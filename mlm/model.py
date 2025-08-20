import torch
import torch.nn as nn


class MPL_MLM(nn.Module):
    """Minimal MLM model for MPL pose language"""

    def __init__(self, vocab_size: int, hidden_dim: int = 128, num_layers: int = 4,
                 num_heads: int = 4, max_length: int = 512, dropout: float = 0.1):
        super().__init__()

        # Embeddings
        self.token_embedding = nn.Embedding(vocab_size, hidden_dim)
        self.position_embedding = nn.Embedding(max_length, hidden_dim)
        self.dropout = nn.Dropout(dropout)

        # Transformer
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=hidden_dim,
            nhead=num_heads,
            dim_feedforward=hidden_dim * 4,
            dropout=dropout,
            batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)

        # Output projection
        self.output_proj = nn.Linear(hidden_dim, vocab_size)

        self._init_weights()

    def _init_weights(self):
        nn.init.normal_(self.token_embedding.weight, std=0.02)
        nn.init.normal_(self.position_embedding.weight, std=0.02)
        nn.init.xavier_uniform_(self.output_proj.weight)

    def forward(self, input_ids, attention_mask=None):
        batch_size, seq_len = input_ids.shape

        # Embeddings
        positions = torch.arange(seq_len, device=input_ids.device).expand(batch_size, -1)
        embeddings = self.dropout(
            self.token_embedding(input_ids) + self.position_embedding(positions)
        )

        # Transformer
        padding_mask = ~attention_mask.bool() if attention_mask is not None else None
        hidden_states = self.transformer(embeddings, src_key_padding_mask=padding_mask)

        # Predict token logits
        return self.output_proj(hidden_states)
