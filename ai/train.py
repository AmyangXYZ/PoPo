from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import json
import re

# Load the fine-tuned Gemma model and tokenizer
model_name = "./pose-llm-gemma"

# Use GPU if available
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name).to(device)

# Test description (change as needed)
description = "Standing with both arms extended forward, palms open and fingers spread"

# Format the prompt for Gemma (decoder-only model)
prompt = f"Description: {description}\nOutput JSON:"

# Tokenize and move inputs to device
inputs = tokenizer(prompt, return_tensors="pt").to(device)

# Generate output
with torch.no_grad():
    outputs = model.generate(**inputs, max_length=1024, do_sample=False)

pose_json = tokenizer.decode(outputs[0], skip_special_tokens=True)

# Extract only the JSON part (after the prompt)
# Use regex to find the first JSON object in the output
match = re.search(r'(\{.*\})', pose_json, re.DOTALL)
if match:
    pose_json = match.group(1)
else:
    print("No JSON object found in output.")
    pose_json = ""

# Try to pretty-print and save the JSON
try:
    pose_dict = json.loads(pose_json)
    with open("generated_pose.json", "w", encoding="utf-8") as f:
        json.dump(pose_dict, f, ensure_ascii=False, indent=2)
    print("Generated pose JSON has been saved to generated_pose.json")
    print(json.dumps(pose_dict, ensure_ascii=False, indent=2))
except Exception as e:
    print("Failed to decode or save JSON:", e)
    print("Raw output:")
    print(pose_json)
