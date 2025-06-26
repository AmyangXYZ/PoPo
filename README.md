# PoPo

> AI-powered MMD pose generator - Transform natural language into expressive 3D character animations

**PoPo** bridges natural language and 3D character animation. Describe any pose or expression in plain English—from simple gestures to complex emotional scenarios—and watch as AI translates your words into precise MMD character animations in real-time.

**Live demo: [popo.love](https://popo.love)**

## ✨ Features

- **Natural Language Input**: "tired after work, stretching arms, but shy about friend's affair news"
- **Real-time Generation**: Instant pose creation with smooth bone animations
- **Advanced Character Control**: 20+ facial morphs + full skeletal manipulation
- **Professional Quality**: Quaternion-based rotations with MMD physics integration

## 🎯 Why MMD-Specific?

**Generic pose-to-3D tools** generate abstract joint rotations for universal 3D models.

**PoPo focuses on MMD**: Direct bone/morph control using MMD's exact naming conventions and constraints. Perfect for MMD creators who need precise character animation without manual bone adjustment.

## 🎯 Example Prompts

```
"look right with a shy smile"
"angry face while lifting left foot"
"exhausted after gym, wiping sweat, excited about results"
"nervous before presentation, fidgeting hands, looking down"
```

## 🛠️ Technology

- **Frontend**: Next.js, shadcn/ui, TypeScript
- **3D Engine**: Babylon.js with babylon-mmd
- **Deployment**: Vercel

### Current: MMD-Specialized Prompts

Advanced prompt engineering converts natural language to precise MMD parameters:

- **MMD Bone Names**: Direct control of MMD skeleton (首, 頭, 上半身, 左腕, 右腕, etc.)
- **Japanese Morphs**: Native MMD facial expressions (困る, にこり, 怒り, 照れ, etc.)
- **Anatomical Constraints**: MMD-specific bone hierarchies and rotation limits
- **Context Understanding**: Complex emotional + physical state combinations

### Ongoing: MMD-Trained LLM

- **MMD Dataset**: Training on VMD/VPD files with natural language descriptions
- **Specialized Vocabulary**: Understanding MMD bone names and morph terminology
- **Output Consistency**: Reliable JSON format for direct MMD integration

## 🎭 Evolution from MiKaPo

PoPo builds on **[MiKaPo](https://mikapo.amyang.dev)** (MediaPipe real-time motion capture):

- **MiKaPo**: Camera → MediaPipe pose landmarks → MMD bones (real-time capture)
- **PoPo**: Text → AI → MMD bones (generative control)

Same proven 3D engine, new AI-driven input method.

## 📄 License

GPL-3.0 License - see LICENSE for details.
