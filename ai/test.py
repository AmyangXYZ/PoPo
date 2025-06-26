from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

# Load the fine-tuned model and tokenizer
model_name = "./pose-llm"  # Path to your fine-tuned model directory

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

# Test description
input_text = (
    "Standing with both arms extended forward, palms open and fingers spread, as if gently pushing something away. The body leans slightly forward, left foot ahead of the right, with a confident yet gentle expression. The head is tilted slightly down, eyes focused ahead, lips softly pursed."
)

# Tokenize and generate
inputs = tokenizer(input_text, return_tensors="pt")
with torch.no_grad():
    outputs = model.generate(**inputs, max_length=512)
pose_json = tokenizer.decode(outputs[0], skip_special_tokens=True)

print("Generated pose JSON:")
print(pose_json)
