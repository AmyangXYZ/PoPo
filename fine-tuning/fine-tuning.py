import json
from datasets import Dataset
from unsloth import FastLanguageModel
from trl import SFTTrainer
from transformers import TrainingArguments

# Setup model
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/Qwen3-8B-bnb-4bit",
    max_seq_length=4096,
    load_in_4bit=True,
)

conversations = []
with open("/content/drive/MyDrive/pose_dataset/pose_training_data.jsonl", 'r') as f:
    for line in f:
        data = json.loads(line.strip())
        messages = data['messages']

        text = tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=False,
            enable_thinking=False  # Disable thinking mode
        )
        conversations.append({"text": text})

print(f"Loaded {len(conversations)} examples")


model = FastLanguageModel.get_peft_model(
    model,
    r=64,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_alpha=16,
    lora_dropout=0,  # Changed to 0 for better Unsloth performance
    use_gradient_checkpointing="unsloth",
)

# Train
dataset = Dataset.from_list(conversations)

trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset,
    dataset_text_field="text",
    max_seq_length=4096,
    args=TrainingArguments(
        output_dir="./qwen3-pose",
        num_train_epochs=20,
        per_device_train_batch_size=1,
        gradient_accumulation_steps=2,
        learning_rate=1e-4,
        bf16=True,
        logging_steps=100,
        save_steps=500,
        optim="adamw_8bit",
        report_to="none",
        dataloader_num_workers=0,
        max_steps=2000,
    ),
)

print("Training...")
trainer.train()

# Save
model.save_pretrained("./qwen3-pose-final")
tokenizer.save_pretrained("./qwen3-pose-final")


FastLanguageModel.for_inference(model)
test_messages = [
    {"role": "system", "content": "Generate MMD pose data from description."},
    {"role": "user", "content": "Description: smile and squat"}
]
test_prompt = tokenizer.apply_chat_template(test_messages, tokenize=False,
                                            add_generation_prompt=True, enable_thinking=False)
inputs = tokenizer(test_prompt, return_tensors="pt").to("cuda")
outputs = model.generate(**inputs, max_new_tokens=256, temperature=0.7)
result = tokenizer.decode(outputs[0], skip_special_tokens=True)
print(f"\nTest result:\n{result}")
