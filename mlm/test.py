# test.py
import torch
from tokenizer import MPLTokenizer
from model import MPL_MLM
from dataset import MPLDataset
from train import create_mlm_batch


def test_completion():
    """Test pose completion with masked tokens"""
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    # Load model
    tokenizer = MPLTokenizer()
    model = MPL_MLM(vocab_size=tokenizer.vocab_size,
                    hidden_dim=128, num_layers=2, num_heads=2).to(device)
    model.load_state_dict(torch.load('mpl_mlm_final.pt', map_location=device))
    model.eval()

    test_poses = [
        "head turn left 30; [MASK] turn [MASK] [MASK];",
        "arm_l bend forward 45; [MASK] [MASK] forward [MASK];",
        "[MASK] bend backward 90; ankle_l bend forward 15;",
        # "shoulder_l [MASK] [MASK] 20; shoulder_r [MASK] [MASK] 20;"
        "index_0_r bend forward 30; [MASK] [MASK] [MASK] 40; index_2_r bend forward 60;"
    ]

    print("Pose Completion Tests:\n" + "="*50)

    for test in test_poses:
        # Build tokens manually
        tokens = [tokenizer.vocab['[CLS]']]
        mask_positions = []

        for i, word in enumerate(test.replace(';', ' ;').split()):
            if word == '[MASK]':
                mask_positions.append(len(tokens))
                tokens.append(tokenizer.vocab['[MASK]'])
            else:
                tokens.append(tokenizer.vocab.get(word, tokenizer.vocab['[UNK]']))

        tokens.append(tokenizer.vocab['[SEP]'])

        # Only pad what we need
        original_length = len(tokens)
        tokens += [tokenizer.vocab['[PAD]']] * (512 - len(tokens))
        input_ids = torch.tensor([tokens]).to(device)

        # Predict
        with torch.no_grad():
            logits = model(input_ids)
            predictions = torch.argmax(logits, dim=-1)

        # Replace ONLY masked positions
        completed_tokens = tokens.copy()
        for pos in mask_positions:
            completed_tokens[pos] = predictions[0, pos].item()

        # Decode only up to original length
        completed = tokenizer.decode(completed_tokens[:original_length])

        print(f"Input:     {test}")
        print(f"Completed: {completed}")
        print("-" * 50)


def test_accuracy():
    """Test masking accuracy on validation data"""
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    tokenizer = MPLTokenizer()
    model = MPL_MLM(vocab_size=tokenizer.vocab_size,
                    hidden_dim=128, num_layers=2, num_heads=2).to(device)
    model.load_state_dict(torch.load('mpl_mlm_final.pt', map_location=device))
    model.eval()

    # Load a few samples
    dataset = MPLDataset.from_npy("../dataset/mpl.npy", tokenizer)

    correct = 0
    total = 0

    for i in range(min(100, len(dataset))):  # Test on 100 samples
        batch = dataset[i].unsqueeze(0).to(device)

        # Create masked version
        masked, labels, mask = create_mlm_batch(batch, tokenizer, mask_prob=0.3)

        with torch.no_grad():
            logits = model(masked.to(device), mask.to(device))
            predictions = torch.argmax(logits, dim=-1)

        # Count correct predictions
        mask_positions = (labels != -100)
        correct += (predictions[mask_positions] == batch[mask_positions]).sum().item()
        total += mask_positions.sum().item()

    accuracy = correct / total if total > 0 else 0
    print(f"\nMasked Token Accuracy: {accuracy:.2%} ({correct}/{total})")


if __name__ == "__main__":
    test_completion()
    test_accuracy()
