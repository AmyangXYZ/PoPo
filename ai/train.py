import os
import warnings
import json
import glob
from datasets import Dataset
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, TrainingArguments, Trainer

# Hide all warnings
warnings.filterwarnings("ignore")

# Hide HuggingFace advisory warnings
os.environ["TRANSFORMERS_NO_ADVISORY_WARNINGS"] = "true"

# Optionally, filter specific warnings (if you want to be more selective)
warnings.filterwarnings("ignore", message=".*symlinks by default.*")
warnings.filterwarnings(
    "ignore", message=".*legacy behaviour of the <class 'transformers.models.t5.tokenization_t5.T5Tokenizer'>.*")
warnings.filterwarnings(
    "ignore", message=".*sentencepiece tokenizer that you are converting to a fast tokenizer uses the byte fallback option.*")

# 1. Load your data from pose_dataset/*.json
data_dir = "../pose_dataset"
data = []

for file_path in glob.glob(os.path.join(data_dir, "*.json")):
    with open(file_path, "r", encoding="utf-8") as f:
        pose = json.load(f)
        # Use the description as input, and the full JSON as output
        data.append({
            "input": pose["description"],
            "output": json.dumps(pose, ensure_ascii=False)
        })

print(f"Loaded {len(data)} samples.")

dataset = Dataset.from_list(data)

# 2. Load model and tokenizer
model_name = "google/mt5-small"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

# 3. Tokenize


def preprocess(example):
    return tokenizer(
        example["input"],
        text_target=example["output"],
        truncation=True,
        max_length=512,
    )


tokenized = dataset.map(preprocess, batched=False)

# 4. Training setup
args = TrainingArguments(
    output_dir="./pose-llm",
    per_device_train_batch_size=2,
    num_train_epochs=5,
    learning_rate=5e-5,
    logging_steps=1,
    save_steps=10,
    save_total_limit=2,
    report_to="none",  # Disable wandb or other loggers by default
)

trainer = Trainer(
    model=model,
    args=args,
    train_dataset=tokenized,
    tokenizer=tokenizer,
)

# 5. Train!
trainer.train()
trainer.save_model("./pose-llm")
