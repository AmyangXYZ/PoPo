import torch
from torch.utils.data import Dataset
import numpy as np
from glob import glob
from tqdm import tqdm
import os
from tokenizer import MPLTokenizer


class MPLDataset(Dataset):
    def __init__(self, tokenizer: MPLTokenizer, max_length: int = 512):
        self.tokenizer = tokenizer
        self.max_length = max_length
        self.data = None

    @classmethod
    def from_npy(cls, path: str, tokenizer: MPLTokenizer) -> 'MPLDataset':
        """Load preprocessed tokens from .npy file"""
        dataset = cls(tokenizer)
        dataset.data = np.load(path, mmap_mode='r')
        print(f"Loaded {len(dataset.data)} sequences from {path}")
        return dataset

    @classmethod
    def from_mpl_files(cls, directory: str, tokenizer: MPLTokenizer, max_length: int = 512) -> 'MPLDataset':
        """Load and tokenize .mpl files from directory"""
        dataset = cls(tokenizer, max_length)
        files = sorted(glob(f"{directory}/*.mpl"))

        all_tokens = []
        for file in tqdm(files, desc="Tokenizing MPL files"):
            with open(file, 'r') as f:
                tokens = tokenizer.tokenize(f.read())
                # Pad or truncate
                if len(tokens) > max_length:
                    tokens = tokens[:max_length-1] + [tokenizer.vocab['[SEP]']]
                else:
                    tokens += [tokenizer.vocab['[PAD]']] * (max_length - len(tokens))
                all_tokens.append(tokens)

        dataset.data = np.array(all_tokens, dtype=np.int32)
        print(f"Loaded {len(dataset.data)} MPL files")
        return dataset

    def save_npy(self, path: str):
        """Save tokenized data to .npy file"""
        if self.data is None:
            raise ValueError("No data to save")
        np.save(path, self.data)
        print(f"Saved {len(self.data)} sequences to {path}")

    def convert_vpd_to_mpl(self, vpd_path: str, mpl_path: str):
        for file in os.listdir(vpd_path):
            os.system(f"mpl.exe -r {vpd_path}{file} -o {mpl_path}{file.replace('.vpd', '.mpl')}")

    def __len__(self):
        return len(self.data) if self.data is not None else 0

    def __getitem__(self, idx):
        return torch.from_numpy(self.data[idx].copy()).long()


if __name__ == "__main__":
    tokenizer = MPLTokenizer()
    dataset = MPLDataset.from_mpl_files("../dataset/mpl/", tokenizer)
    dataset.save_npy("../dataset/mpl.npy")

    dataset = MPLDataset.from_npy("../dataset/mpl.npy", tokenizer)
    print(f"Shape: {dataset.data.shape}")
    print(f"Size: {dataset.data.nbytes / 1024 / 1024:.1f} MB")

    sample = dataset[0]
    print(f"Sample shape: {sample.shape}")
    print(f"Non-pad tokens: {(sample != tokenizer.vocab['[PAD]']).sum()}")
