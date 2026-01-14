# PoPo

> AI-powered MMD pose generator - Transform natural language into expressive 3D character animations

**PoPo** uses LLMs to generate MMD character poses from natural language descriptions. Instead of raw rotation quaternions, we use **[MPL (MMD Pose Language)](https://github.com/AmyangXYZ/MMD-MPL)** - a semantic, MMD-specific pose description language that helps AI understand and generate anatomically correct poses.

**🌐 Live demo: [popo.love](https://popo.love)**

> Powered by [Reze Engine](https://github.com/AmyangXYZ/reze-engine)

## ✨ Features

- **Natural Language Input**: "wave right hand with big laugh, inviting me for dinner"
- **LLM-Generated Poses**: Output semantic MPL code for precise pose control
- **Real-time Rendering**: Instant pose creation with smooth bone animations
- **MMD-Specific**: Built for anime characters with proper bone constraints and physics

## 🎯 LLMs with MPL

**PoPo fine-tunes LLMs with MPL**: [MPL](https://github.com/AmyangXYZ/MPL) is a semantic pose description language designed specifically for MMD. This approach provides:

- **Better training convergence** - Structured, human-readable pose descriptions
- **Consistent outputs** - Same prompt generates reliable pose code
- **Anatomically correct** - Built-in constraints prevent impossible movements
- **Debuggable results** - Generated MPL code can be read and modified

## 🛠️ Technology

- **Frontend**: Next.js, shadcn/ui, TypeScript
- **3D Engine**: [Reze Engine](https://github.com/AmyangXYZ/reze-engine)
- **Pose Language**: [MPL (MMD Pose Language)](https://github.com/AmyangXYZ/MPL) for semantic pose description
- **AI Model**: GPT-4o-mini for natural language → MPL generation
- **Deployment**: Vercel

## 🎭 Evolution

- **[MiKaPo](https://github.com/AmyangXYZ/MiKaPo)**: Camera → MediaPipe → MMD bones (real-time capture)
- **PoPo**: Text → Fine-tuned LLM → **MPL code** → MMD bones (AI-generated poses)

By using semantic MPL as the training target instead of raw quaternions, we achieve better consistency and allow the AI to learn the "grammar" of human movement.

## 📄 License

GPL-3.0 License - see LICENSE for details.
