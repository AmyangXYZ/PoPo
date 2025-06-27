from huggingface_hub import login
import os
import json
import glob
import warnings
import torch
from datasets import Dataset
from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments, Trainer, DataCollatorForLanguageModeling

# Suppress warnings for cleaner output
warnings.filterwarnings("ignore", message=".*past_key_values.*deprecated.*")
warnings.filterwarnings("ignore", message=".*as_target_tokenizer.*deprecated.*")
os.environ["TRANSFORMERS_NO_ADVISORY_WARNINGS"] = "true"

# Suppress specific warnings
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", message=".*as_target_tokenizer.*")

# Paste your Hugging Face token here (get it from https://huggingface.co/settings/tokens)
login(os.getenv("HF_TOKEN"))


def check_device():
    """Check and return the best available device"""
    if torch.cuda.is_available():
        device = torch.device("cuda")
        print(f"🚀 GPU detected: {torch.cuda.get_device_name()}")
        print(f"   CUDA version: {torch.version.cuda}")
        print(f"   GPU memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
    else:
        device = torch.device("cpu")
        print("⚠️  GPU not available, using CPU")
        print("   For faster training, install PyTorch with CUDA support")

    print(f"🎯 Training device: {device}")
    return device


def load_pose_data(data_dir="../pose_dataset"):
    """Load pose data from JSON files in the specified directory"""
    data = []
    total_tokens = 0

    for file_path in glob.glob(os.path.join(data_dir, "*.json")):
        with open(file_path, "r", encoding="utf-8") as f:
            pose = json.load(f)

            # Add explicit end token to help model learn when to stop
            prompt = f"Description: {pose['description']}\nJSON: {json.dumps(pose, ensure_ascii=False)}<|endoftext|>"

            data.append({"text": prompt})

            # Count tokens for this sample (rough estimate)
            token_count = len(prompt.split()) + len(prompt) // 4  # Rough token estimate
            total_tokens += token_count

            print(f"📄 {os.path.basename(file_path)}: ~{token_count} tokens")

    avg_tokens = total_tokens // len(data) if data else 0
    print(f"📁 Loaded {len(data)} samples from {data_dir}")
    print(f"🔢 Average tokens per sample: ~{avg_tokens}")
    print(f"🔢 Total tokens: ~{total_tokens}")
    return data


def preprocess_data(data, tokenizer):
    """Preprocess the data for encoder-decoder training"""
    inputs = []
    targets = []

    for item in data:
        text = item["text"]

        # Split at "JSON: " to separate input and target
        if "JSON: " in text:
            description_part = text.split("JSON: ")[0].strip()  # "Description: ..."
            json_part = text.split("JSON: ")[1].strip()        # The JSON data

            inputs.append(description_part)
            targets.append(json_part)
        else:
            print(f"⚠️ Skipping malformed data: {text[:100]}...")

    print(f"📝 Preprocessed {len(inputs)} input-target pairs")

    # Tokenize inputs and targets with consistent padding
    model_inputs = tokenizer(
        inputs,
        max_length=2048,  # Increased back to handle full precision floats
        padding="max_length",
        truncation=True,
        return_tensors="pt"
    )

    # Tokenize targets
    with tokenizer.as_target_tokenizer():
        labels = tokenizer(
            targets,
            max_length=2048,  # Same max_length for consistency
            padding="max_length",
            truncation=True,
            return_tensors="pt"
        )

    model_inputs["labels"] = labels["input_ids"]
    return model_inputs


def main():
    print("🤖 Gemma Pose Training")
    print("=" * 50)

    # Check device
    device = check_device()
    print()

    # Load data
    data = load_pose_data()
    dataset = Dataset.from_list(data)

    # Load model and tokenizer
    model_name = "google/gemma-3-1b-it"
    print(f"📥 Loading model: {model_name}")

    tokenizer = AutoTokenizer.from_pretrained(model_name, use_fast=False)
    model = AutoModelForCausalLM.from_pretrained(model_name, attn_implementation='eager')

    # Add padding token if not present
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # Move model to device
    model = model.to(device)
    print(f"✅ Model loaded and moved to {device}")
    print()

    # Tokenize dataset
    print("🔄 Tokenizing dataset...")
    tokenized_dataset = dataset.map(
        lambda x: preprocess_data(x, tokenizer),
        batched=True,
        remove_columns=dataset.column_names
    )

    # Create data collator
    data_collator = DataCollatorForLanguageModeling(
        tokenizer=tokenizer,
        mlm=False  # We're doing causal LM, not masked LM
    )

    # Training configuration - minimal for quick validation
    args = TrainingArguments(
        output_dir="./pose-llm-gemma",
        per_device_train_batch_size=1,
        num_train_epochs=3,  # Just 3 epochs for quick test
        learning_rate=1e-4,  # Slightly higher for faster learning
        logging_steps=1,
        save_steps=5,
        save_total_limit=1,  # Keep only 1 checkpoint
        report_to="none",
        fp16=False,
        dataloader_num_workers=0,
        gradient_checkpointing=False,
        warmup_steps=0,
        max_grad_norm=1.0,
        weight_decay=0.01,
        remove_unused_columns=False,
        save_strategy="no",  # Don't save intermediate checkpoints
    )

    # Initialize trainer
    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=tokenized_dataset,
        data_collator=data_collator,
        tokenizer=tokenizer,
    )

    # Train and save model
    print("🚀 Starting training...")
    trainer.train()
    trainer.save_model("./pose-llm-gemma")
    print("✅ Training completed! Model saved to ./pose-llm-gemma")


if __name__ == "__main__":
    main()
