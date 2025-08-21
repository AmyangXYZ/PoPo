from typing import List
import re


class MPLTokenizer:
    def __init__(self):
        self.special_tokens = ['[PAD]', '[MASK]', '[CLS]', '[SEP]', '[UNK]']

        self.bones = ['base', 'center', 'upper_body', 'upper_body2', 'lower_body', 'neck', 'head', 'waist',
                      'shoulder_l', 'shoulder_r', 'arm_l', 'arm_r', 'arm_twist_l', 'arm_twist_r', 'elbow_l', 'elbow_r', 'wrist_l', 'wrist_r', 'wrist_twist_l', 'wrist_twist_r',
                      'leg_l', 'leg_r', 'knee_l', 'knee_r', 'ankle_l', 'ankle_r', 'toe_l', 'toe_r',
                      'thumb_0_l', 'thumb_1_l', 'thumb_2_l', 'index_0_l', 'index_1_l', 'index_2_l', 'middle_0_l', 'middle_1_l', 'middle_2_l', 'ring_0_l', 'ring_1_l', 'ring_2_l', 'pinky_0_l', 'pinky_1_l', 'pinky_2_l',
                      'thumb_0_r', 'thumb_1_r', 'thumb_2_r', 'index_0_r', 'index_1_r', 'index_2_r', 'middle_0_r', 'middle_1_r', 'middle_2_r', 'ring_0_r', 'ring_1_r', 'ring_2_r', 'pinky_0_r', 'pinky_1_r', 'pinky_2_r']
        self.actions = ['bend', 'turn', 'sway']
        self.directions = ['forward', 'backward', 'left', 'right']
        self.degrees = [str(i) for i in range(0, 185, 5)]

        self.valid_combinations = {
            'bend-forward': True,
            'bend-backward': True,
            'turn-left': True,
            'turn-right': True,
            'sway-left': True,
            'sway-right': True
        }

        # Add all tokens to vocab
        self.vocab = {}
        idx = 0
        for token_list in [self.special_tokens, self.bones, self.actions, self.directions, self.degrees, [';']]:
            for token in token_list:
                self.vocab[token] = idx
                idx += 1

        self.idx_to_token = {v: k for k, v in self.vocab.items()}
        self.vocab_size = len(self.vocab)

        self.bone_ids = set(self.vocab[b] for b in self.bones)
        self.action_ids = set(self.vocab[a] for a in self.actions)
        self.direction_ids = set(self.vocab[d] for d in self.directions)
        self.degree_ids = set(self.vocab[d] for d in self.degrees)

    def is_valid_combination(self, action: str, direction: str) -> bool:
        """Check if action-direction pair is valid"""
        return f'{action}-{direction}' in self.valid_combinations

    def tokenize(self, text: str) -> List[int]:
        """Tokenize with validation"""
        tokens = [self.vocab['[CLS]']]

        match = re.search(r'@pose\s+\w+\s*\{([^}]*)\}', text)
        if match:
            block = match.group(1)
            clean_block = ' '.join(block.split())

            for statement in clean_block.split(';'):
                parts = statement.strip().split()
                if len(parts) == 4:
                    bone, action, direction, degree = parts
                    # Validate combination
                    if (bone in self.bones and
                        action in self.actions and
                        direction in self.directions and
                        degree in self.degrees and
                            self.is_valid_combination(action, direction)):  # NEW CHECK

                        for part in parts:
                            tokens.append(self.vocab[part])
                        tokens.append(self.vocab[';'])

        tokens.append(self.vocab['[SEP]'])
        return tokens

    def decode(self, token_ids: List[int]) -> str:
        """Convert token IDs back to MPL text"""
        tokens = [self.idx_to_token.get(idx, '[UNK]') for idx in token_ids]

        mpl_statements = []
        current_statement = []

        for token in tokens:
            if token in ['[CLS]', '[SEP]', '[PAD]', '[MASK]']:
                continue
            elif token == ';':
                if len(current_statement) == 4:
                    bone, action, direction, degree = current_statement
                    # Validate combination (same as in tokenize)
                    if (bone in self.bones and
                        action in self.actions and
                        direction in self.directions and
                        degree in self.degrees and
                            self.is_valid_combination(action, direction)):
                        mpl_statements.append(' '.join(current_statement) + ';')
                current_statement = []
            else:
                current_statement.append(token)

        return ' '.join(mpl_statements)


if __name__ == "__main__":
    tokenizer = MPLTokenizer()
    print(tokenizer.vocab)
    with open('../dataset/mpl/1.mpl', 'r') as f:
        test_mpl = f.read()
    tokens = tokenizer.tokenize(test_mpl)
    print(tokens)
    print(tokenizer.decode(tokens))
