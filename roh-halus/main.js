import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19/+esm';
import { GPGPUSimulator } from './GPGPU.js';

// --- Configuration & Constants ---
const SIM_SIZE = 512; // 512 x 512 = 262,144 particles
const PARTICLE_COUNT = SIM_SIZE * SIM_SIZE;

// --- Global Variables ---
let scene, camera, renderer, controls;
let gpgpu, particleSystem;
let videoElement, videoTexture;
let webcamCurrRT = null, webcamPrevRT = null;
let clock, lastTime = 0;
let currentMode = 'mouse'; // 'mouse' or 'webcam' or 'audio'
let webcamStream = null;
let audioContext = null, analyser = null, audioDataArray = null, audioStream = null;

// Intersection Plane for mouse interaction (Z=0 plane)
const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(-9999, -9999); // Offscreen initially
const mouse3d = new THREE.Vector3(0, 0, 0);

// --- Uniform Settings Object for lil-gui ---
const settings = {
    // General
    particleSize: 1.5,
    particleOpacity: 0.8,
    decaySpeed: 0.1, // slower decay makes smoother trails
    
    // Physics / Forces
    attraction: 1.8,
    curlFreq: 0.006,
    curlSpeed: 0.25,
    curlStrength: 15.0,
    
    // Mouse Repulsion
    mouseRadius: 50.0,
    mouseStrength: 120.0,
    
    // Webcam Mode
    depthScale: 90.0, // 3D relief extrusion factor
    motionThreshold: 0.12, // frame difference threshold
    motionSensitivity: 0.08, // frame difference transition range
    
    // Aesthetics (Mouse Mode Colors)
    colorA: '#00f2fe', // Bright Cyan
    colorB: '#7f00ff', // Glowing Violet
    
    // Actions
    triggerReset: () => {
        if (gpgpu) gpgpu.triggerReset();
    },
    resetCamera: () => {
        controls.reset();
        camera.position.set(0, 0, 450);
        controls.target.set(0, 0, 0);
        controls.update();
    }
};

// --- Shaders for Particle Mesh Rendering ---
const PARTICLE_VERTEX_SHADER = `
    uniform sampler2D u_positions;
    uniform sampler2D u_webcamTexture;
    uniform float u_webcamActive;
    uniform float u_size;
    
    varying vec3 vColor;
    varying float vLife;
    varying vec2 vUv;

    void main() {
        vUv = position.xy;
        
        // 1. Fetch particle state from FBO position texture
        vec4 posInfo = texture2D(u_positions, vUv);
        vec3 pos = posInfo.xyz;
        vLife = posInfo.w;
        
        // 2. Color assignment
        if (u_webcamActive > 0.5) {
            // Mirror UV coordinates to match mirrored camera feed
            vec2 webcamUV = vec2(1.0 - position.x, position.y);
            vColor = texture2D(u_webcamTexture, webcamUV).rgb;
        } else {
            vColor = vec3(1.0); // Colors will be blended in fragment shader
        }

        // 3. Project positions to screen space
        vec4 mvPosition = viewMatrix * modelMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // 4. Size attenuation based on distance and lifetime
        float sizeAttenuation = 1000.0 / -mvPosition.z;
        gl_PointSize = u_size * sizeAttenuation * smoothstep(0.0, 0.2, vLife);
    }
`;

const PARTICLE_FRAGMENT_SHADER = `
    uniform float u_webcamActive;
    uniform float u_audioActive;
    uniform float u_audioTreble;
    uniform float u_opacity;
    uniform vec3 u_colorA;
    uniform vec3 u_colorB;
    
    varying vec3 vColor;
    varying float vLife;
    varying vec2 vUv;

    void main() {
        // Discard pixels outside point circle (makes particles perfectly round)
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        if (dist > 0.5) discard;
        
        // Smooth radial edge falloff for glowing circular effect
        float alpha = smoothstep(0.5, 0.15, dist) * u_opacity;
        
        if (u_audioActive > 0.5) {
            alpha += u_audioTreble * 1.5; // Glow intensely on treble/highs
        }
        
        vec3 col = vColor;
        if (u_webcamActive <= 0.5) {
            // Gradient interpolation based on life
            col = mix(u_colorB, u_colorA, smoothstep(0.0, 0.7, vLife));
            if (u_audioActive > 0.5) {
                // Boost color brightness on treble
                col += u_audioTreble * 0.8;
            }
        }
        
        gl_FragColor = vec4(col, alpha * min(1.0, vLife * 2.5));
    }
`;

// --- Initialization ---
function init() {
    // 1. DOM Elements
    videoElement = document.getElementById('webcam-video');
    const canvas = document.getElementById('webgl-canvas');

    // 2. Three.js Core Setup
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x06060c, 0.0015);
    
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.set(0, 0, 450);

    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = true;

    // 3. Orbit Controls (limiting pitch so user doesn't flip upside down)
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 800;
    controls.minDistance = 100;
    controls.maxPolarAngle = Math.PI / 2 + 0.3; // Allow looking slightly from below
    controls.minPolarAngle = 0.2;

    // 4. Initialize GPGPU Engine
    gpgpu = new GPGPUSimulator(renderer, SIM_SIZE, settings);
    // Set initial view scale based on window size
    updateViewScale();

    // 5. Generate Particle Geometry (containing FBO UVs)
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const u = (i % SIM_SIZE) / SIM_SIZE;
        const v = Math.floor(i / SIM_SIZE) / SIM_SIZE;
        
        const idx = i * 3;
        positions[idx + 0] = u;
        positions[idx + 1] = v;
        positions[idx + 2] = 0.0;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // 6. Particle Render Material
    const particleMaterial = new THREE.ShaderMaterial({
        vertexShader: PARTICLE_VERTEX_SHADER,
        fragmentShader: PARTICLE_FRAGMENT_SHADER,
        uniforms: {
            u_positions: { value: null },
            u_webcamTexture: { value: new THREE.Texture() },
            u_webcamActive: { value: 0.0 },
            u_audioActive: { value: 0.0 },
            u_audioTreble: { value: 0.0 },
            u_size: { value: settings.particleSize },
            u_opacity: { value: settings.particleOpacity },
            u_colorA: { value: new THREE.Color(settings.colorA) },
            u_colorB: { value: new THREE.Color(settings.colorB) }
        },
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending
    });

    // Create the Points Mesh
    particleSystem = new THREE.Points(geometry, particleMaterial);
    scene.add(particleSystem);

    // 7. Event Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('keydown', onKeyDown);
    canvas.addEventListener('dblclick', toggleFullscreen);

    // Mobile UI Toggle hookup
    document.getElementById('mobile-ui-toggle').addEventListener('click', () => {
        document.body.classList.toggle('hide-hud');
    });

    // Mode Buttons hookup
    document.getElementById('btn-mouse-mode').addEventListener('click', () => setMode('mouse'));
    document.getElementById('btn-webcam-mode').addEventListener('click', () => requestAccess('webcam'));
    document.getElementById('btn-audio-mode').addEventListener('click', () => requestAccess('audio'));
    
    // Permission modal actions
    document.getElementById('btn-allow-permission').addEventListener('click', () => {
        const mode = document.getElementById('permission-modal').dataset.requestMode;
        hideModal();
        if (mode === 'webcam') startWebcam();
        if (mode === 'audio') startAudio();
    });
    document.getElementById('btn-cancel-permission').addEventListener('click', () => {
        hideModal();
        setMode('mouse');
    });

    // 8. Build Menu Dashboard (lil-gui)
    buildGUI();

    // 9. Start Clock & Loops
    clock = new THREE.Clock();
    lastTime = performance.now();
    
    // Update particle count in HTML overlay
    document.getElementById('particle-count').textContent = PARTICLE_COUNT.toLocaleString();

    animate();
}

// --- Mode Management ---
function setMode(mode) {
    currentMode = mode;
    
    const mouseBtn = document.getElementById('btn-mouse-mode');
    const webcamBtn = document.getElementById('btn-webcam-mode');
    const audioBtn = document.getElementById('btn-audio-mode');
    const statusIndicator = document.getElementById('mode-status');
    const statusText = document.getElementById('mode-status-text');

    mouseBtn.classList.remove('active');
    webcamBtn.classList.remove('active');
    audioBtn.classList.remove('active');
    
    gpgpu.uniforms.u_webcamActive.value = 0.0;
    particleSystem.material.uniforms.u_webcamActive.value = 0.0;
    gpgpu.uniforms.u_audioActive.value = 0.0;
    particleSystem.material.uniforms.u_audioActive.value = 0.0;

    if (mode === 'mouse') {
        mouseBtn.classList.add('active');
        statusIndicator.classList.add('hidden');
        gpgpu.triggerReset();
        
        if (webcamStream) {
            webcamStream.getTracks().forEach(track => track.stop());
            webcamStream = null;
        }
        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
            audioStream = null;
            if (audioContext) audioContext.close();
            audioContext = null;
        }
        
        if (webcamCurrRT) {
            webcamCurrRT.dispose();
            webcamPrevRT.dispose();
            webcamCurrRT = null;
            webcamPrevRT = null;
        }
    } else if (mode === 'webcam') {
        webcamBtn.classList.add('active');
        statusIndicator.classList.remove('hidden');
        statusText.textContent = "Webcam + Audio Reactive";
        
        gpgpu.uniforms.u_webcamActive.value = 1.0;
        particleSystem.material.uniforms.u_webcamActive.value = 1.0;
        gpgpu.uniforms.u_audioActive.value = 1.0;
        particleSystem.material.uniforms.u_audioActive.value = 1.0;
        gpgpu.triggerReset();
    } else if (mode === 'audio') {
        audioBtn.classList.add('active');
        statusIndicator.classList.remove('hidden');
        statusText.textContent = "Audio Reactive Mode";
        
        gpgpu.uniforms.u_audioActive.value = 1.0;
        particleSystem.material.uniforms.u_audioActive.value = 1.0;
        gpgpu.triggerReset();
    }
}

// --- Access Management ---
function requestAccess(mode) {
    if (mode === 'webcam' && webcamStream) {
        setMode('webcam');
        return;
    }
    if (mode === 'audio' && audioStream) {
        setMode('audio');
        return;
    }
    
    const modal = document.getElementById('permission-modal');
    modal.dataset.requestMode = mode;
    
    if (mode === 'webcam') {
        document.getElementById('permission-icon').textContent = '📷';
        document.getElementById('permission-title').textContent = 'Camera & Mic Access Required';
        document.getElementById('permission-desc').textContent = 'Please grant webcam and microphone permission to enable real-time audio-reactive 3D particle video mirroring.';
    } else if (mode === 'audio') {
        document.getElementById('permission-icon').textContent = '🎤';
        document.getElementById('permission-title').textContent = 'Microphone Access Required';
        document.getElementById('permission-desc').textContent = 'Please grant microphone permission to enable audio reactive particles.';
    }
    
    modal.classList.remove('hidden');
}

// --- Hide Modal ---
function hideModal() {
    document.getElementById('permission-modal').classList.add('hidden');
}

// --- Start Webcam ---
function startWebcam() {
    navigator.mediaDevices.getUserMedia({
        video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user"
        },
        audio: true
    }).then(stream => {
        webcamStream = stream;
        videoElement.srcObject = stream;
        
        // Setup Audio for Webcam
        audioStream = stream;
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        audioDataArray = new Uint8Array(analyser.frequencyBinCount);
        
        // Wait until video data is loaded to play
        videoElement.onloadedmetadata = () => {
            videoElement.play();
            
            // Create Three.js VideoTexture
            videoTexture = new THREE.VideoTexture(videoElement);
            videoTexture.minFilter = THREE.LinearFilter;
            videoTexture.magFilter = THREE.LinearFilter;
            
            // Create low-res frame history render targets (256x256 filters out sensor noise)
            const rtOptions = {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat,
                type: THREE.UnsignedByteType
            };
            webcamCurrRT = new THREE.WebGLRenderTarget(256, 256, rtOptions);
            webcamPrevRT = new THREE.WebGLRenderTarget(256, 256, rtOptions);
            
            // Initialize both frames with a copy of the current video texture
            gpgpu.copyTexture(videoTexture, webcamCurrRT);
            gpgpu.copyTexture(videoTexture, webcamPrevRT);
            
            // Bind to GPGPU and Particle shaders
            gpgpu.uniforms.u_webcamTexture.value = webcamCurrRT.texture;
            gpgpu.uniforms.u_webcamPrevTexture.value = webcamPrevRT.texture;
            particleSystem.material.uniforms.u_webcamTexture.value = webcamCurrRT.texture;
            
            setMode('webcam');
        };
    }).catch(err => {
        console.error("Camera access failed:", err);
        showToast("Webcam access denied. Defaulting to Mouse Flow.");
        setMode('mouse');
    });
}

// --- Audio Integration ---
function startAudio() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        audioStream = stream;
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        
        audioDataArray = new Uint8Array(analyser.frequencyBinCount);
        setMode('audio');
    }).catch(err => {
        console.error("Mic access failed:", err);
        showToast("Microphone access denied. Defaulting to Mouse Flow.");
        setMode('mouse');
    });
}

// --- GUI Setup ---
function buildGUI() {
    const gui = new GUI({ title: 'Roh Halus HUD' });
    
    // Simulation Panel folder
    const folderSim = gui.addFolder('Simulation Params');
    folderSim.add(settings, 'particleSize', 0.2, 5.0).step(0.1).name('Size').onChange(val => {
        particleSystem.material.uniforms.u_size.value = val;
    });
    folderSim.add(settings, 'particleOpacity', 0.1, 1.0).step(0.05).name('Glow Opacity').onChange(val => {
        particleSystem.material.uniforms.u_opacity.value = val;
    });
    folderSim.add(settings, 'decaySpeed', 0.02, 0.5).step(0.01).name('Decay Speed').onChange(val => {
        gpgpu.uniforms.u_decaySpeed.value = val;
    });
    folderSim.add(settings, 'attraction', 0.1, 5.0).step(0.1).name('Attraction Force').onChange(val => {
        gpgpu.uniforms.u_attraction.value = val;
    });

    // Noise parameters folder
    const folderNoise = gui.addFolder('Curl Turbulence');
    folderNoise.add(settings, 'curlFreq', 0.001, 0.03).step(0.001).name('Frequency').onChange(val => {
        gpgpu.uniforms.u_curlFreq.value = val;
    });
    folderNoise.add(settings, 'curlSpeed', 0.05, 1.0).step(0.05).name('Flow Speed').onChange(val => {
        gpgpu.uniforms.u_curlSpeed.value = val;
    });
    folderNoise.add(settings, 'curlStrength', 0.0, 50.0).step(1.0).name('Strength').onChange(val => {
        gpgpu.uniforms.u_curlStrength.value = val;
    });

    // Interaction Parameters folder
    const folderInteract = gui.addFolder('Mouse Interaction');
    folderInteract.add(settings, 'mouseRadius', 10.0, 150.0).step(5.0).name('Influence Radius').onChange(val => {
        gpgpu.uniforms.u_mouseRadius.value = val;
    });
    folderInteract.add(settings, 'mouseStrength', 0.0, 300.0).step(10.0).name('Blast Strength').onChange(val => {
        gpgpu.uniforms.u_mouseStrength.value = val;
    });

    // Webcam Mirror params
    const folderWebcam = gui.addFolder('Webcam Mirror settings');
    folderWebcam.add(settings, 'depthScale', 10.0, 200.0).step(5.0).name('3D Extrusion').onChange(val => {
        gpgpu.uniforms.u_depthScale.value = val;
    });
    folderWebcam.add(settings, 'motionThreshold', 0.02, 0.4).step(0.01).name('Motion Cutoff').onChange(val => {
        gpgpu.uniforms.u_motionThreshold.value = val;
    });
    folderWebcam.add(settings, 'motionSensitivity', 0.02, 0.3).step(0.01).name('Motion Sensitivity').onChange(val => {
        gpgpu.uniforms.u_motionSensitivity.value = val;
    });

    // Aesthetics colors (Mouse Mode)
    const folderColors = gui.addFolder('Mouse Flow Palette');
    folderColors.addColor(settings, 'colorA').name('Flow Neon').onChange(val => {
        particleSystem.material.uniforms.u_colorA.value.set(val);
    });
    folderColors.addColor(settings, 'colorB').name('Flow Fade').onChange(val => {
        particleSystem.material.uniforms.u_colorB.value.set(val);
    });

    // Buttons
    gui.add(settings, 'triggerReset').name('Blast / Scatter Particles');
    gui.add(settings, 'resetCamera').name('Reset Camera Orbit');

    if (window.innerWidth <= 768) {
        gui.close();
    } else {
        gui.open();
    }
}

// --- Raycast Coordinate Utility ---
function updateMouse3d() {
    raycaster.setFromCamera(mouse, camera);
    const intersectPoint = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(interactionPlane, intersectPoint)) {
        mouse3d.copy(intersectPoint);
        // Bind to simulation shader
        gpgpu.uniforms.u_mouse3d.value.copy(mouse3d);
    }
}

// --- Window resizing ---
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    updateViewScale();
}

function updateViewScale() {
    // Map GPGPU bounds to camera view bounds depending on perspective frustum
    const aspect = window.innerWidth / window.innerHeight;
    let scaleX, scaleY;
    
    if (aspect > 1) {
        // Landscape
        scaleY = 320.0;
        scaleX = scaleY * aspect;
    } else {
        // Portrait / Mobile
        scaleX = 280.0;
        scaleY = scaleX / aspect;
    }
    
    if (gpgpu) {
        gpgpu.uniforms.u_viewScale.value.set(scaleX, scaleY);
    }
}

// --- Mouse Interaction ---
function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    updateMouse3d();
}

// --- Touch Interaction for mobile/tablet ---
function onTouchStart(event) {
    if (event.touches.length > 0) {
        if (event.target === document.getElementById('webgl-canvas')) {
            event.preventDefault();
        }
        mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
        updateMouse3d();
    }
}

function onTouchMove(event) {
    if (event.touches.length > 0) {
        // Avoid scrolling window while drawing if interacting with canvas
        if (event.target === document.getElementById('webgl-canvas')) {
            event.preventDefault();
        }
        
        mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
        updateMouse3d();
    }
}

function onTouchEnd() {
    mouse.set(-9999, -9999); // Reset offscreen
    gpgpu.uniforms.u_mouse3d.value.set(-9999, -9999, -9999);
}

// --- Toast / Alerts system ---
function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = 0;
        toast.style.transition = 'opacity 0.5s ease';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// --- FPS Counter helper ---
const fpsCounter = document.getElementById('fps-counter');
let frameTimes = [];
function updateFPS() {
    const now = performance.now();
    while (frameTimes.length > 0 && frameTimes[0] <= now - 1000) {
        frameTimes.shift();
    }
    frameTimes.push(now);
    
    if (frameTimes.length > 0) {
        fpsCounter.textContent = `${frameTimes.length} FPS`;
    }
}

// --- Main Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    // Clamp delta time to avoid physics explosion on background tab focus resume
    const clampedDelta = Math.min(delta, 0.05); 
    const elapsedTime = clock.getElapsedTime();

    // 0. Modes logic (Webcam / Audio)
    if (currentMode === 'webcam' && videoTexture && webcamCurrRT && webcamPrevRT) {
        const temp = webcamPrevRT;
        webcamPrevRT = webcamCurrRT;
        webcamCurrRT = temp;
        
        gpgpu.copyTexture(videoTexture, webcamCurrRT);
        
        gpgpu.uniforms.u_webcamTexture.value = webcamCurrRT.texture;
        gpgpu.uniforms.u_webcamPrevTexture.value = webcamPrevRT.texture;
        particleSystem.material.uniforms.u_webcamTexture.value = webcamCurrRT.texture;
    }
    
    if ((currentMode === 'audio' || currentMode === 'webcam') && analyser && audioDataArray) {
        analyser.getByteFrequencyData(audioDataArray);
        
        // Calculate bass (lower frequencies) and treble (higher frequencies)
        let bassSum = 0;
        let trebleSum = 0;
        const length = audioDataArray.length;
        const half = Math.floor(length / 2);
        
        for (let i = 0; i < half; i++) {
            bassSum += audioDataArray[i];
            trebleSum += audioDataArray[i + half];
        }
        
        // Normalize 0.0 - 1.0 and boost signal by 1.8x
        const bassAvg = Math.min(1.0, ((bassSum / half) / 255.0) * 1.8);
        const trebleAvg = Math.min(1.0, ((trebleSum / half) / 255.0) * 1.8);
        
        // Faster reaction (less smoothing latency)
        gpgpu.uniforms.u_audioBass.value += (bassAvg - gpgpu.uniforms.u_audioBass.value) * 0.3;
        particleSystem.material.uniforms.u_audioTreble.value += (trebleAvg - particleSystem.material.uniforms.u_audioTreble.value) * 0.4;
    }

    // 1. Run GPGPU Simulation Step
    gpgpu.update(elapsedTime, clampedDelta);

    // 2. Connect FBO position texture output to the particle material
    particleSystem.material.uniforms.u_positions.value = gpgpu.texture;

    // 3. Update Camera Controls
    controls.update();

    // 4. Render main scene
    renderer.render(scene, camera);

    // 5. Update FPS counter in UI
    updateFPS();
}

// --- Fullscreen and UI Toggle Functions ---
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

function onKeyDown(event) {
    if (event.key.toLowerCase() === 'h') {
        document.body.classList.toggle('hide-hud');
    }
    if (event.key.toLowerCase() === 'f') {
        toggleFullscreen();
    }
}

// Start everything
window.addEventListener('DOMContentLoaded', init);
