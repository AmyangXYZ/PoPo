import torch
import os
import time
from transformers import AutoTokenizer, AutoModelForCausalLM

# Disable torch compilation entirely to avoid Triton issues
import torch._dynamo
torch._dynamo.config.disable = True


def load_model(model_path="./pose-llm-gemma"):
    """Load model and tokenizer"""
    print("🤖 Gemma Pose Testing")
    print("=" * 50)

    # Check if model exists
    if not os.path.exists(model_path):
        print(f"❌ Model not found at: {model_path}")
        print("   Make sure you've trained the model first!")
        return None, None, None

    # Device detection
    if torch.cuda.is_available():
        device = torch.device("cuda")
        print(f"🚀 GPU detected: {torch.cuda.get_device_name()}")
        print(f"   CUDA version: {torch.version.cuda}")
        print(f"   GPU memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
    else:
        device = torch.device("cpu")
        print("⚠️  GPU not available, using CPU")

    print(f"🎯 Testing device: {device}")
    print()

    try:
        print(f"📥 Loading model: {model_path}")
        start_time = time.time()

        tokenizer = AutoTokenizer.from_pretrained(model_path, use_fast=False)
        model = AutoModelForCausalLM.from_pretrained(model_path).to(device)

        # Add padding token if not present
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token

        load_time = time.time() - start_time
        print(f"✅ Model loaded and moved to {device}")
        print(f"⏱️ Model loading time: {load_time:.2f} seconds")
        print()

        return model, tokenizer, device
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return None, None, None


def generate_pose(model, tokenizer, device, description):
    """Generate pose from description using Gemma - with compact array format"""
    # Compact prompt matching the new array-based training data structure
    prompt = f"""Generate a pose JSON for the following description. Use compact array format [x,y,z,w] for rotations and [x,y,z] for positions:

{{"description": "...", "face": {{"真面目": 0, "困る": 0, "にこり": 0, "怒り": 0, "あ": 0, "い": 0, "う": 0, "え": 0, "お": 0, "お1": 0, "にやり２": 0, "にやり２1": 0, "口横広げ": 0, "口横缩げ": 0, "口角上げ": 0, "口角下げ1": 0, "口角下げ": 0, "まばたき": 0, "笑い": 0, "ウィンク": 0, "ウィンク右": 0, "ウィンク２": 0, "ｳｨﾝｸ２右": 0, "びっくり": 0, "恐ろしい子！": 0, "なごみ": 0, "はちゅ目": 0, "はぅ": 0, "ｷﾘｯ": 0, "眼角下": 0, "眼睑上": 0, "じと目": 0, "じと目1": 0, "照れ": 0}}, "rotatableBones": {{"上半身": [0, 0, 0, 1], "首": [0, 0, 0, 1], "頭": [0, 0, 0, 1], "下半身": [0, 0, 0, 1], "左腕": [0, 0, 0, 1], "左ひじ": [0, 0, 0, 1], "左手首": [0, 0, 0, 1], "左親指１": [0, 0, 0, 1], "左親指２": [0, 0, 0, 1], "左人指１": [0, 0, 0, 1], "左人指２": [0, 0, 0, 1], "左人指３": [0, 0, 0, 1], "左中指１": [0, 0, 0, 1], "左中指２": [0, 0, 0, 1], "左中指３": [0, 0, 0, 1], "左薬指１": [0, 0, 0, 1], "左薬指２": [0, 0, 0, 1], "左薬指３": [0, 0, 0, 1], "左小指１": [0, 0, 0, 1], "左小指２": [0, 0, 0, 1], "左小指３": [0, 0, 0, 1], "左足": [0, 0, 0, 1], "左ひざ": [0, 0, 0, 1], "左足首": [0, 0, 0, 1], "右腕": [0, 0, 0, 1], "右ひじ": [0, 0, 0, 1], "右手首": [0, 0, 0, 1], "右親指１": [0, 0, 0, 1], "右親指２": [0, 0, 0, 1], "右人指１": [0, 0, 0, 1], "右人指２": [0, 0, 0, 1], "右人指３": [0, 0, 0, 1], "右中指１": [0, 0, 0, 1], "右中指２": [0, 0, 0, 1], "右中指３": [0, 0, 0, 1], "右薬指１": [0, 0, 0, 1], "右薬指２": [0, 0, 0, 1], "右薬指３": [0, 0, 0, 1], "右小指１": [0, 0, 0, 1], "右小指２": [0, 0, 0, 1], "右小指３": [0, 0, 0, 1], "右足": [0, 0, 0, 1], "右ひざ": [0, 0, 0, 1]}}, "movableBones": {{"センター": [0, 7.95, -0.45], "左足ＩＫ": [-0.5, 0.8, -1.2], "右足ＩＫ": [0.35, 0.8, 0], "左つま先ＩＫ": [0, -1.59, -1.82], "右つま先ＩＫ": [0, -1.59, -1.82]}}}}

Description: {description}
JSON: """

    print(f"📝 Input prompt:")
    print(f"Description: {description}")
    print("JSON template provided with compact array format")
    print("-" * 60)

    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=1024).to(device)
    input_length = inputs['input_ids'].shape[1]

    print(f"🔢 Input tokens: {input_length}")

    # Start timing generation
    start_time = time.time()

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=800,  # Reduced since compact format needs fewer tokens
            do_sample=True,
            temperature=0.2,  # Lower temperature for more structured output
            top_p=0.8,  # Add top_p for better control
            pad_token_id=tokenizer.pad_token_id,
            eos_token_id=tokenizer.eos_token_id,
            repetition_penalty=1.2  # Add repetition penalty to prevent loops
        )

    generation_time = time.time() - start_time

    # Decode only the generated part
    generated_tokens = outputs[0][input_length:]
    generated_text = tokenizer.decode(generated_tokens, skip_special_tokens=True)

    print(f"⏱️ Generation time: {generation_time:.2f} seconds")
    print(f"🔢 Generated tokens: {len(generated_tokens)}")
    print(f"⚡ Tokens per second: {len(generated_tokens)/generation_time:.1f}")
    print(f"📤 Generated text (full):")
    print(generated_text)  # Show full text, no truncation

    return generated_text


def quick_test(model, tokenizer, device):
    """Quick test with one training example"""
    print("🧪 Quick validation test:")
    print("-" * 40)

    # Test with one description from training data
    description = "Standing with both arms extended forward"
    result = generate_pose(model, tokenizer, device, description)

    print(f"\n✅ Result length: {len(result)} characters")
    if len(result) > 10 and "{" in result:
        print("✅ Generated JSON-like content!")

        # Try to parse as JSON to validate structure
        try:
            import json
            # Find the JSON part (starts with {)
            json_start = result.find('{')
            if json_start != -1:
                json_part = result[json_start:]
                # Try to find end of JSON
                brace_count = 0
                json_end = json_start
                for i, char in enumerate(json_part):
                    if char == '{':
                        brace_count += 1
                    elif char == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            json_end = json_start + i + 1
                            break

                if json_end > json_start:
                    json_text = result[json_start:json_end]
                    parsed = json.loads(json_text)
                    print("✅ Valid JSON structure!")
                    print(f"📊 JSON keys: {list(parsed.keys())}")
        except Exception as e:
            print(f"⚠️ JSON parsing issue: {e}")
    else:
        print("❌ No meaningful JSON generated")

    return result


def test_training_data(model, tokenizer, device):
    """Test with descriptions from training data"""
    training_descriptions = [
        "Standing with both arms extended forward",
        "Sitting with hands on knees",
        "Walking forward with normal gait",
        "Waving with right hand"
    ]

    print("🧪 Testing with training data descriptions:")
    print("=" * 60)

    for i, desc in enumerate(training_descriptions, 1):
        print(f"\n📋 Test {i}: {desc}")
        print("-" * 40)

        result = generate_pose(model, tokenizer, device, desc)

        print(f"✅ Result {i}:")
        print(result[:200] + "..." if len(result) > 200 else result)
        print("-" * 60)


def main():
    # Load model
    model, tokenizer, device = load_model()

    if model is None:
        print("❌ Cannot proceed without model")
        return

    # Quick validation test
    quick_test(model, tokenizer, device)

    print("✅ Test complete!")


if __name__ == "__main__":
    main()
