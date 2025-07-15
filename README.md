# PoPo

> AI-powered MMD pose generator - Transform natural language into expressive 3D character animations

**PoPo** bridges natural language and 3D character animation. Describe any pose or expression in plain text—from simple gestures to complex emotional scenarios—and watch as AI translates your words into precise MMD character animations in real-time. No need to understand complex bone rotations quaternions!

**🌐 Live demo: [popo.love](https://popo.love)**

Demo model: 深空之眼 三相·梵天「无间玩伴」

## ✨ Features

- **Natural Language Input**: "wave right hand with big laugh, inviting me for dinner"
- **Real-time Generation**: Instant pose creation with smooth bone animations
- **Advanced Character Control**: 20+ facial morphs + full skeletal manipulation
- **Professional Quality**: Quaternion-based rotations with MMD physics integration

## 🎯 Why MMD-Specific?

**Generic pose-to-3D tools** generate abstract joint rotations for universal 3D models.

**PoPo focuses on MMD**: Direct bone/morph control using MMD's exact naming conventions and constraints. Perfect for anime fans who want to pose their favorite characters without learning complex bone rigging or technical animation skills.

## 💬 Example Prompts

```
"sit and raise hands"
"bend over and look right with a shy smile"
"angry face while lifting left foot"
"my exam failed"
```

## 🤝 Help Improve PoPo

**Want to make PoPo smarter?** Help us expand the training dataset!

### How to contribute:

1. **Create poses manually**

   - Use the **Customization Panel** to adjust bones and facial expressions
   - Or import poses from **VPD files** (MMD pose data)
   - Fine-tune until you get the perfect pose

2. **Add descriptions**

   - Write natural language descriptions for your poses
   - Be specific about body position, hand gestures, facial expressions
   - Include emotional context and scenarios

3. **Export and share**
   - Use the **Export** button to get the JSON data
   - Email your labeled pose data set to: **amyang.xyz@gmail.com**

Here is an exported [sample pose.json](./pose_dataset/sample.json)

Your contributions directly improve the AI model for everyone! 🙏

## 🛠️ Technology

- **Frontend**: Next.js, shadcn/ui, TypeScript
- **3D Engine**: Babylon.js with babylon-mmd
- **AI Model**: Fine-tuned GPT-4o-mini specialized for MMD pose generation
- **Deployment**: Vercel

## 🎭 Evolution from MiKaPo

PoPo builds on **[MiKaPo](https://mikapo.amyang.dev)** (MediaPipe real-time motion capture on Web):

- **MiKaPo**: Camera → MediaPipe pose landmarks → MMD bones (real-time capture)
- **PoPo**: Text → AI → MMD bones (generative control)

Same proven 3D engine, new AI-driven input method.

## 📄 License

GPL-3.0 License - see LICENSE for details.
