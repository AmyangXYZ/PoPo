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

# Concise JSON template for the system prompt (short float values)
system_prompt = """
You are an expert at generating facial expressions and body poses for MMD (MikuMikuDance) models in 3D scenes. Your task is to convert any natural language description into a valid JSON object with this exact structure (use short float values, e.g., -0.01, 0.12):

{
  "description": "Standing with both arms extended forward, palms open and fingers spread.",
  "face": {
    "真面目": 0, "困る": 0, "にこり": 0, "怒り": 0, "あ": 0, "い": 0, "う": 0, "え": 0, "お": 0.6, "お1": 0,
    "にやり２": 0, "にやり２1": 0, "口横広げ": 0, "口横缩げ": 0, "口角上げ": 0, "口角下げ1": 0, "口角下げ": 0,
    "まばたき": 0, "笑い": 0, "ウィンク": 0, "ウィンク右": 0, "ウィンク２": 0, "ｳｨﾝｸ２右": 0, "びっくり": 0,
    "恐ろしい子！": 0, "なごみ": 0, "はちゅ目": 0, "はぅ": 0, "ｷﾘｯ": 0, "眼角下": 0, "眼睑上": 0, "じと目": 0, "じと目1": 0, "照れ": 0
  },
  "rotatableBones": {
    "上半身": {"x": -0.2, "y": -0.04, "z": -0.04, "w": 0.98},
    "首": {"x": 0, "y": 0, "z": 0, "w": 1},
    "頭": {"x": 0.16, "y": -0.01, "z": -0.09, "w": 0.98},
    "下半身": {"x": -0.09, "y": -0.1, "z": 0.01, "w": 0.99},
    "左腕": {"x": 0.38, "y": 0.2, "z": 0.15, "w": 0.89},
    "右腕": {"x": 0.35, "y": -0.38, "z": -0.03, "w": 0.86},
    "左ひじ": {"x": 0, "y": 0, "z": 0, "w": 1},
    "右ひじ": {"x": 0, "y": 0, "z": 0, "w": 1},
    "左手首": {"x": 0, "y": 0, "z": 0, "w": 1},
    "右手首": {"x": 0, "y": 0, "z": 0, "w": 1},
    "左足": {"x": 0, "y": 0, "z": 0, "w": 1},
    "右足": {"x": 0, "y": 0, "z": 0, "w": 1},
    "左ひざ": {"x": 0, "y": 0, "z": 0, "w": 1},
    "右ひざ": {"x": 0, "y": 0, "z": 0, "w": 1},
    "左足首": {"x": 0, "y": 0, "z": 0, "w": 1},
    "右足首": {"x": 0, "y": 0, "z": 0, "w": 1},
    "左親指１": {"x": 0, "y": 0, "z": 0, "w": 1},
    "右親指１": {"x": 0, "y": 0, "z": 0, "w": 1}
  },
  "movableBones": {
    "センター": {"x": -3.35, "y": 7.44, "z": 0.4},
    "左足ＩＫ": {"x": -3.04, "y": 1.17, "z": 1.2},
    "右足ＩＫ": {"x": -5.05, "y": 0.8, "z": -0.05},
    "左つま先ＩＫ": {"x": 0, "y": 0, "z": 0},
    "右つま先ＩＫ": {"x": 0, "y": 0, "z": 0}
  }
}
Return only the JSON object.
"""

# Test description (you can change this to any description you want to test)
description = "Standing with both arms extended forward, palms open and fingers spread"

user_prompt = f"Pose description: {description}"
full_prompt = system_prompt + "\n" + user_prompt

# Tokenize and move inputs to device
inputs = tokenizer(full_prompt, return_tensors="pt", truncation=True, max_length=1024).to(device)

# Generate output
with torch.no_grad():
    outputs = model.generate(**inputs, max_length=1024, do_sample=False)

pose_json = tokenizer.decode(outputs[0], skip_special_tokens=True)

# Extract the first JSON object from the output
match = re.search(r'(\{[\s\S]*\})', pose_json)
if match:
    pose_json = match.group(1)
    try:
        pose_dict = json.loads(pose_json)
        # Recursively round all floats in the dict to 2 decimal places

        def round_floats(obj):
            if isinstance(obj, float):
                return round(obj, 2)
            elif isinstance(obj, dict):
                return {k: round_floats(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [round_floats(i) for i in obj]
            else:
                return obj
        pose_dict = round_floats(pose_dict)
        from pprint import pprint
        pprint(pose_dict)
    except Exception as e:
        print("Failed to decode JSON:", e)
        print("Raw output:")
        print(pose_json)
else:
    print("No JSON object found in output.")
    print("Raw output:")
    print(pose_json)
