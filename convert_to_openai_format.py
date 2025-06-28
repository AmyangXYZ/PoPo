import json
import glob
import os


def convert_pose_to_openai_format(input_dir="pose_dataset", output_file="pose_training_data.jsonl"):
    """Convert pose JSON files to OpenAI fine-tuning JSONL format"""

    training_examples = []

    # System message for the AI model
    system_message = "You are an expert in MMD (MikuMikuDance) pose generation. Given a description of a pose, you generate the corresponding bone rotations, positions, and facial morphs in JSON format."

    # Load all pose JSON files
    for file_path in glob.glob(os.path.join(input_dir, "*.json")):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                pose_data = json.load(f)

            # Extract description and create the pose data without description
            description = pose_data.get("description", "")

            # Create a clean pose data without the description
            clean_pose_data = {
                "face": pose_data.get("face", {}),
                "rotatableBones": pose_data.get("rotatableBones", {}),
                "movableBones": pose_data.get("movableBones", {})
            }

            # Create training example
            training_example = {
                "messages": [
                    {
                        "role": "system",
                        "content": system_message
                    },
                    {
                        "role": "user",
                        "content": f"Generate MMD pose data for: {description}"
                    },
                    {
                        "role": "assistant",
                        "content": json.dumps(clean_pose_data, ensure_ascii=False)
                    }
                ]
            }

            training_examples.append(training_example)
            print(f"✅ Converted: {os.path.basename(file_path)}")

        except Exception as e:
            print(f"❌ Error processing {file_path}: {e}")

    # Write to JSONL file
    with open(output_file, "w", encoding="utf-8") as f:
        for example in training_examples:
            f.write(json.dumps(example, ensure_ascii=False) + "\n")

    print(f"\n🎉 Conversion complete!")
    print(f"📁 Created: {output_file}")
    print(f"📊 Total examples: {len(training_examples)}")

    # Validate the format
    validate_openai_format(output_file)


def validate_openai_format(file_path):
    """Validate that the JSONL file meets OpenAI requirements"""
    print(f"\n🔍 Validating format for: {file_path}")

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

        valid_examples = 0
        total_tokens = 0

        for i, line in enumerate(lines):
            try:
                example = json.loads(line.strip())

                # Check required structure
                if "messages" not in example:
                    print(f"❌ Line {i+1}: Missing 'messages' key")
                    continue

                messages = example["messages"]
                if not isinstance(messages, list):
                    print(f"❌ Line {i+1}: 'messages' should be a list")
                    continue

                # Check message structure
                valid_message = True
                for msg in messages:
                    if "role" not in msg or "content" not in msg:
                        print(f"❌ Line {i+1}: Message missing 'role' or 'content'")
                        valid_message = False
                        break

                    if msg["role"] not in ["system", "user", "assistant"]:
                        print(f"❌ Line {i+1}: Invalid role '{msg['role']}'")
                        valid_message = False
                        break

                if valid_message:
                    valid_examples += 1
                    # Rough token count estimate
                    content_length = sum(len(msg["content"]) for msg in messages)
                    total_tokens += content_length // 4  # Rough estimate

            except json.JSONDecodeError:
                print(f"❌ Line {i+1}: Invalid JSON")

        print(f"✅ Valid examples: {valid_examples}/{len(lines)}")
        print(f"📊 Estimated tokens: ~{total_tokens}")

        if valid_examples == len(lines):
            print("🎉 All examples are valid for OpenAI fine-tuning!")
        else:
            print("⚠️  Some examples have issues - please fix before uploading")

    except Exception as e:
        print(f"❌ Validation error: {e}")


if __name__ == "__main__":
    convert_pose_to_openai_format()
