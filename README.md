# PoPo

> AI-powered MMD pose generator - Transform natural language into expressive 3D character animations

**PoPo** bridges natural language and 3D character animation. Describe any pose or expression in plain text—from simple gestures to complex emotional scenarios—and watch as AI translates your words into precise MMD character animations in real-time.

**Live demo: [popo.love](https://popo.love)**

## ✨ Features

- **Natural Language Input**: "tired after work, stretching arms, but shy about friend's affair news"
- **Real-time Generation**: Instant pose creation with smooth bone animations
- **Advanced Character Control**: 20+ facial morphs + full skeletal manipulation
- **Professional Quality**: Quaternion-based rotations with MMD physics integration

## 🎯 Example Prompts

```
"look right with a shy smile"
"angry face while lifting left foot"
"exhausted after gym, wiping sweat, excited about results"
"nervous before presentation, fidgeting hands, looking down"
```

## 🛠️ Technology

### Current Implementation

- **Frontend**: Next.js 15.3, React 19, TypeScript 5, Tailwind CSS 4
- **3D Engine**: Babylon.js 8.11 with babylon-mmd 0.65
- **AI**: OpenAI API with specialized MMD anatomy prompts
- **Storage**: AWS S3 integration for file uploads

### Ongoing Development

- **Dedicated LLM**: Training specialized Gemma/Llama models on VMD/VPD pose data
- **Local Inference**: Eliminating API dependency with domain-specific understanding

## 📦 Quick Start

```bash
git clone https://github.com/yourusername/popo.git
cd popo && npm install

# Add API keys to .env.local
echo "AI_API_KEY=your_openai_key" > .env.local
echo "AWS_ACCESS_KEY_ID=your_aws_key" >> .env.local
echo "AWS_SECRET_ACCESS_KEY=your_aws_secret" >> .env.local

npm run dev  # Open http://localhost:3000
```

## 🧠 AI Implementation

### Current: Prompt Engineering

Sophisticated system prompts convert natural language to precise MMD parameters:

- **Morph Targets**: Facial expressions (困る, にこり, 怒り, 照れ, etc.)
- **Bone Rotations**: Full skeletal control with anatomical constraints
- **Context Awareness**: Emotional states + physical actions + situational context

### Next: Specialized LLM Training

- **Dataset**: VMD/VPD pose files + crowd-sourced descriptions
- **Models**: Fine-tuned Gemma 2B / Llama 3.2 for efficiency
- **Training**: LoRA/QLoRA on MMD-specific pose-text pairs

## 🎭 Evolution from MiKaPo

PoPo builds on **[MiKaPo](https://mikapo.amyang.dev)** (MediaPipe real-time motion capture):

- **MiKaPo**: Video/Image → MediaPipe pose landmarks → MMD bones (real-time capture)
- **PoPo**: Text → MMD bones (generative control)

Same proven 3D engine, new AI-driven input method.

## 🔮 Roadmap

- **Q1 2025**: Local LLM training with VMD dataset
- **Q2 2025**: Multi-character scenes and pose sequences
- **Q3 2025**: Voice input and VR integration

## 📄 License

MIT License - see LICENSE for details.

---

**popo.love | Bridging Language and Animation**
