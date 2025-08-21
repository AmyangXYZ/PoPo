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
    """Create masked batch with contiguous masking for anatomical coherence"""
    masked_batch = batch.clone()
    labels = batch.clone()
    attention_mask = (batch != tokenizer.vocab['[PAD]']).float()

    for i in range(batch.size(0)):
        # First, identify all bone statement positions
        bone_statements = []
        j = 1  # Skip [CLS]
        while j < batch.size(1) - 1:
            if (j + 4 < batch.size(1) and
                batch[i, j].item() in tokenizer.bone_ids and
                batch[i, j+1].item() in tokenizer.action_ids and
                batch[i, j+2].item() in tokenizer.direction_ids and
                    batch[i, j+3].item() in tokenizer.degree_ids):
                bone_statements.append(j)
                j += 5
            else:
                labels[i, j] = -100
                j += 1

        if not bone_statements:
            continue

        # Decide masking strategy
        strategy = random.random()

        if strategy < 0.5:  # 50%: Contiguous span masking
            # Mask 1-4 contiguous bone statements (leverages your sorting)
            span_length = random.randint(1, min(4, len(bone_statements)))
            max_start = len(bone_statements) - span_length
            if max_start >= 0:
                start_idx = random.randint(0, max_start)
                for idx in range(start_idx, start_idx + span_length):
                    j = bone_statements[idx]
                    # Mask entire bone statement or just parameters
                    if random.random() < 0.7:  # 70%: mask all
                        for k in range(4):
                            masked_batch[i, j+k] = tokenizer.vocab['[MASK]']
                    else:  # 30%: mask parameters only (keep bone name)
                        for k in range(1, 4):
                            masked_batch[i, j+k] = tokenizer.vocab['[MASK]']
                        labels[i, j] = -100  # Don't predict bone name

        else:  # 50%: Sparse random masking (original behavior for diversity)
            # Randomly mask individual statements
            num_to_mask = max(1, int(len(bone_statements) * mask_prob))
            positions_to_mask = random.sample(bone_statements,
                                              min(num_to_mask, len(bone_statements)))

            for j in positions_to_mask:
                # Random pattern within statement
                if random.random() < 0.5:
                    # Mask parameters only
                    for k in range(1, 4):
                        masked_batch[i, j+k] = tokenizer.vocab['[MASK]']
                    labels[i, j] = -100
                else:
                    # Mask random tokens in statement
                    mask_pattern = random.choice([[0, 1, 2, 3], [1, 2, 3], [0], [1], [2], [3]])
                    for k in mask_pattern:
                        masked_batch[i, j+k] = tokenizer.vocab['[MASK]']
                    for k in range(4):
                        if k not in mask_pattern:
                            labels[i, j+k] = -100

        # Set labels for unmasked positions
        for j in bone_statements:
            for k in range(4):
                if masked_batch[i, j+k] != tokenizer.vocab['[MASK]']:
                    labels[i, j+k] = -100

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
