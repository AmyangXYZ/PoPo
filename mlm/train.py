# train.py
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torch.optim import AdamW
from tqdm import tqdm
import random

from tokenizer import MPLTokenizer
from dataset import MPLDataset
from model import MPL_MLM


def create_mlm_batch(batch, tokenizer, mask_prob=0.15):
    """Create masked batch with diverse masking patterns"""
    masked_batch = batch.clone()
    labels = batch.clone()
    attention_mask = (batch != tokenizer.vocab['[PAD]']).float()

    # Masking patterns - from single to full statement
    patterns = [
        [0], [1], [2], [3],           # Single
        [0, 1], [1, 2], [2, 3], [0, 3],   # Pairs
        [0, 1, 2], [1, 2, 3],             # Triples
        [0, 1, 2, 3]                     # Full
    ]

    for i in range(batch.size(0)):
        j = 1  # Skip [CLS]
        while j < batch.size(1) - 1:
            # Check for valid statement
            if (j + 4 < batch.size(1) and
                batch[i, j].item() in tokenizer.bone_ids and
                batch[i, j+1].item() in tokenizer.action_ids and
                batch[i, j+2].item() in tokenizer.direction_ids and
                    batch[i, j+3].item() in tokenizer.degree_ids):

                if random.random() < mask_prob:
                    positions = random.choice(patterns)
                    for pos in positions:
                        if random.random() < 0.8:
                            masked_batch[i, j+pos] = tokenizer.vocab['[MASK]']
                    for pos in range(4):
                        if pos not in positions:
                            labels[i, j+pos] = -100
                else:
                    labels[i, j:j+5] = -100
                j += 5
            else:
                labels[i, j] = -100
                j += 1

    return masked_batch, labels, attention_mask


def train():
    # Setup
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    epochs = 5
    batch_size = 32
    lr = 5e-4

    # Initialize
    tokenizer = MPLTokenizer()
    dataset = MPLDataset.from_npy("../dataset/mpl.npy", tokenizer)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

    model = MPL_MLM(vocab_size=tokenizer.vocab_size,
                    hidden_dim=64,
                    num_layers=2,
                    num_heads=2).to(device)
    optimizer = AdamW(model.parameters(), lr=lr)
    criterion = nn.CrossEntropyLoss(ignore_index=-100)

    print(f"Training {sum(p.numel() for p in model.parameters()):,} parameters on {device}")
    print(f"Dataset: {len(dataset)} poses, {len(dataloader)} batches/epoch")

    # Train
    model.train()
    for epoch in range(epochs):
        total_loss = 0
        progress = tqdm(dataloader, desc=f"Epoch {epoch+1}/{epochs}")

        for batch in progress:
            batch = batch.to(device)
            masked_input, labels, mask = create_mlm_batch(batch, tokenizer)

            logits = model(masked_input.to(device), mask.to(device))
            loss = criterion(logits.reshape(-1, tokenizer.vocab_size), labels.to(device).reshape(-1))

            optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()

            total_loss += loss.item()
            progress.set_postfix({'loss': f"{loss.item():.4f}"})

        avg_loss = total_loss / len(dataloader)
        print(f"Epoch {epoch+1}: {avg_loss:.4f}")

        # Save periodically
        if (epoch + 1) % 10 == 0:
            torch.save(model.state_dict(), f'mpl_mlm_epoch_{epoch+1}.pt')

    # Final save
    torch.save(model.state_dict(), 'mpl_mlm_final.pt')
    print("Training complete!")


if __name__ == "__main__":
    train()
