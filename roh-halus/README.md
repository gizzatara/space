# Nebula Flow

Nebula Flow is an immersive WebGL-based interactive particle simulation. It utilizes GPGPU (General-Purpose computing on Graphics Processing Units) techniques to render and simulate thousands of particles mimicking the organic, flowing movements of a cosmic nebula.

## 🚀 Features
- **GPGPU Simulation**: Offloads particle position and velocity calculations to the GPU for high-performance rendering.
- **Interactive Flow**: Fluid and dynamic particle behaviors.
- **Pure WebGL**: Built using vanilla WebGL, HTML5 Canvas, and JavaScript without heavy 3D frameworks.

## 📂 Project Structure
- `index.html`: Main entry point and canvas container.
- `styles.css`: Styling and layout.
- `main.js`: Core WebGL setup, rendering loop, and interactions.
- `GPGPU.js`: Logic for managing the GPU-based particle physics.

## 🛠️ How to Run
This is a static web project. You can run it by serving the directory with any local web server. 
For example, using Python:
```bash
python -m http.server 8080
```
Then open `http://localhost:8080` in your web browser.

---

## 🙏 Credits & Inspiration

This project would not have been possible without the amazing work and inspiration from the creative coding community.

- **Inspiration**: Special thanks to **Edan Kwan** for the incredible [The Spirit](https://github.com/edankwan/The-Spirit) project, which served as a huge inspiration for the fluid particle physics and GPGPU implementation in this project.
- **Author**: Gizza
