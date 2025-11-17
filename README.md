# PoPo

> AI-powered MMD pose generator - Transform natural language into expressive 3D character animations

**PoPo** uses fine-tuned LLMs to generate MMD character poses from natural language descriptions. Instead of training on raw quaternions, we use **[MPL (MMD Pose Language)](https://github.com/AmyangXYZ/MMD-MPL)** - a semantic, MMD-specific pose description language that helps AI understand and generate anatomically correct poses.

**🌐 Live demo: [popo.love](https://popo.love)**

> Powered by [Reze Engine](https://github.com/AmyangXYZ/reze-engine)

## ✨ Features

- **Natural Language Input**: "wave right hand with big laugh, inviting me for dinner"
- **LLM-Generated Poses**: Fine-tuned models output semantic MPL code for precise pose control
- **Real-time Rendering**: Instant pose creation with smooth bone animations
- **MMD-Specific**: Built for anime characters with proper bone constraints and physics

## 🎯 Fine-tune LLMs with MPL

**PoPo fine-tunes LLMs with MPL**: [MPL](https://github.com/AmyangXYZ/MPL) is a semantic pose description language designed specifically for MMD. This approach provides:

- **Better training convergence** - Structured, human-readable pose descriptions
- **Consistent outputs** - Same prompt generates reliable pose code
- **Anatomically correct** - Built-in constraints prevent impossible movements
- **Debuggable results** - Generated MPL code can be read and modified

### Training Data Example:

```json
{
  "messages": [
    { "role": "system", "content": "Generate MMD Pose Language (MPL) script from description." },
    { "role": "user", "content": "Description: arms down" },
    { "role": "assistant", "content": "arm_l bend forward 40;arm_r bend forward 40;" }
  ]
}
```

## 🛠️ Technology

- **Frontend**: Next.js, shadcn/ui, TypeScript
- **3D Engine**: [Reze Engine](https://github.com/AmyangXYZ/reze-engine)
- **Pose Language**: [MPL (MMD Pose Language)](https://github.com/AmyangXYZ/MPL) for semantic pose description
- **AI Model**: Fine-tuned GPT-4o-mini for natural language → MPL generation
- **Deployment**: Vercel

## 🎭 Evolution

- **[MiKaPo](https://github.com/AmyangXYZ/MiKaPo)**: Camera → MediaPipe → MMD bones (real-time capture)
- **PoPo**: Text → Fine-tuned LLM → **MPL code** → MMD bones (AI-generated poses)

By using semantic MPL as the training target instead of raw quaternions, we achieve better consistency and allow the AI to learn the "grammar" of human movement.

## 📄 License

GPL-3.0 License - see LICENSE for details.
