import * as THREE from 'three';

// --- GLSL SIMPLEX NOISE & CURL NOISE ---
const SIMULATION_VERTEX_SHADER = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
    }
`;

const SIMULATION_FRAGMENT_SHADER = `
    uniform sampler2D u_positions;
    uniform sampler2D u_initialPositions;
    uniform sampler2D u_webcamTexture;
    uniform sampler2D u_webcamPrevTexture;
    uniform float u_webcamActive;
    uniform float u_time;
    uniform float u_delta;
    uniform vec3 u_mouse3d;
    uniform float u_mouseRadius;
    uniform float u_mouseStrength;
    uniform float u_curlFreq;
    uniform float u_curlSpeed;
    uniform float u_curlStrength;
    uniform float u_attraction;
    uniform float u_depthScale;
    uniform float u_decaySpeed;
    uniform float u_reset;
    uniform vec2 u_viewScale;
    uniform float u_motionThreshold;
    uniform float u_motionSensitivity;
    uniform float u_audioBass;
    uniform float u_audioActive;
    
    varying vec2 vUv;

    // --- Simplex 3D Noise by Ashima Arts ---
    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

    float snoise(vec3 v){
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);

        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);

        vec3 x1 = x0 - i1 + 1.0 * C.xxx;
        vec3 x2 = x0 - i2 + 2.0 * C.xxx;
        vec3 x3 = x0 - D.yyy;

        i = mod(i, 289.0);
        vec4 p = permute(permute(permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));

        float n_ = 1.0/7.0;
        vec3 ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);

        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);

        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);

        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    // --- Helper to sample noise in 3 directions ---
    vec3 snoiseVec3(vec3 x){
        float s  = snoise(x);
        float s1 = snoise(vec3(x.y - 19.1, x.z + 33.4, x.x + 5.2));
        float s2 = snoise(vec3(x.z + 74.2, x.x - 124.5, x.y + 99.4));
        return vec3(s, s1, s2);
    }

    // --- Octave simplex noise vector function ---
    vec3 octaveSnoiseVec3(vec3 p, float persistence) {
        vec3 sum = vec3(0.0);
        float amplitude = 1.0;
        float frequency = 1.0;
        for (int i = 0; i < 3; i++) {
            sum += snoiseVec3(p * frequency) * amplitude;
            amplitude *= persistence;
            frequency *= 2.0;
        }
        return sum;
    }

    // --- Multi-Octave Curl Noise via Finite Differences ---
    vec3 curlNoise(vec3 p, float time, float persistence){
        const float e = 0.05;
        vec3 dx = vec3(e, 0.0, 0.0);
        vec3 dy = vec3(0.0, e, 0.0);
        vec3 dz = vec3(0.0, 0.0, e);

        vec3 p_x0 = octaveSnoiseVec3(p - dx, persistence);
        vec3 p_x1 = octaveSnoiseVec3(p + dx, persistence);
        vec3 p_y0 = octaveSnoiseVec3(p - dy, persistence);
        vec3 p_y1 = octaveSnoiseVec3(p + dy, persistence);
        vec3 p_z0 = octaveSnoiseVec3(p - dz, persistence);
        vec3 p_z1 = octaveSnoiseVec3(p + dz, persistence);

        float x = p_y1.z - p_y0.z - (p_z1.y - p_z0.y);
        float y = p_z1.x - p_z0.x - (p_x1.z - p_x0.z);
        float z = p_x1.y - p_x0.y - (p_y1.x - p_y0.x);

        return normalize(vec3(x, y, z) / (2.0 * e));
    }

    // --- Simple PRNG based on UV ---
    float hash(vec2 co) {
        return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }

    vec3 randomSpherePoint(vec2 uv, float seed) {
        float u = hash(uv + seed);
        float v = hash(uv + seed + 0.1);
        float theta = u * 2.0 * 3.14159265;
        float phi = acos(2.0 * v - 1.0);
        float r = pow(hash(uv + seed + 0.2), 0.33); // Distribute inside sphere
        return vec3(
            r * sin(phi) * cos(theta),
            r * sin(phi) * sin(theta),
            r * cos(phi)
        );
    }

    void main() {
        // Read current state (xyz = pos, w = life)
        vec4 state = texture2D(u_positions, vUv);
        vec3 pos = state.xyz;
        float life = state.w;
        
        // Read initial state (initial spawning grid coords)
        vec4 init = texture2D(u_initialPositions, vUv);
        vec3 initialPos = init.xyz;
        
        // Target / Attraction Home position
        vec3 homePos;
        
        if (u_webcamActive > 0.5) {
            // Mirror X mapping
            vec2 webcamUV = vec2(1.0 - initialPos.x, initialPos.y);
            vec3 colorCurr = texture2D(u_webcamTexture, webcamUV).rgb;
            vec3 colorPrev = texture2D(u_webcamPrevTexture, webcamUV).rgb;
            
            // Luminance for 3D extrusion
            float brightness = dot(colorCurr, vec3(0.299, 0.587, 0.114));
            
            // Map 2D grid of particles to viewport coordinates
            homePos = vec3(
                (initialPos.x - 0.5) * u_viewScale.x,
                (initialPos.y - 0.5) * u_viewScale.y,
                brightness * u_depthScale
            );
            
            // GPU Motion Detection - Frame difference
            float diff = length(colorCurr - colorPrev);
            float motion = smoothstep(u_motionThreshold, u_motionThreshold + u_motionSensitivity, diff);
            if (motion > 0.05) {
                // Wake up particle based on motion intensity
                life = max(life, motion);
            }
        } else {
            homePos = u_mouse3d;
        }
        
        // Decay life over time if active
        if (life > 0.0) {
            life -= u_delta * u_decaySpeed;
            if (life < 0.0) life = 0.0;
        }
        
        vec3 force = vec3(0.0);
        
        // --- Calculate Physics ---
        if (u_webcamActive > 0.5) {
            if (life > 0.0) {
                // ACTIVE MOTION: Particle is released to float and swirl
                // Attraction grows back as life decays, pulling the particle back home
                float currentAttraction = u_attraction * (1.0 - life);
                force += (homePos - pos) * currentAttraction;
                
                // Multi-octave curl noise with dynamic persistence based on age
                float persistence = 0.12 + (1.0 - life) * 0.15;
                vec3 curl = curlNoise(pos * u_curlFreq + vec3(0.0, 0.0, u_time * u_curlSpeed), u_time, persistence);
                force += curl * u_curlStrength;
                
                // Mouse Repulsion still acts on active pixels
                vec3 toMouse = pos - u_mouse3d;
                float distToMouse = length(toMouse);
                if (distToMouse < u_mouseRadius && distToMouse > 0.0) {
                    float strength = (1.0 - distToMouse / u_mouseRadius) * u_mouseStrength;
                    force += normalize(toMouse) * strength;
                }
                
                pos += force * u_delta;
            } else {
                // STATIC PIXEL: Lock immediately back to 3D mirrored coordinate
                // Symmetrical, zero movement, clean image
                pos = homePos;
            }
        } else {
            // MOUSE FLOW MODE: Swirl particles and rebirth
            if (life <= 0.0 || u_reset > 0.5) {
                life = 0.5 + hash(vUv * 3.42) * 0.5; // Random start life
                pos = u_mouse3d + randomSpherePoint(vUv, u_time) * 15.0;
            } else {
                // Attraction with falloff (so far away particles flow independently)
                vec3 delta = homePos - pos;
                float dist = length(delta);
                float attFactor = u_attraction * (0.05 + life * 0.15) * (1.0 - smoothstep(100.0, 450.0, dist));
                force += delta * attFactor;
                
                // Multi-octave curl noise with dynamic persistence based on age
                float persistence = 0.1 + (1.0 - life) * 0.15;
                
                float dynamicCurlSpeed = u_curlSpeed;
                float dynamicCurlStrength = u_curlStrength;
                if (u_audioActive > 0.5) {
                    dynamicCurlSpeed += u_audioBass * 5.0; // Faster turbulence
                    dynamicCurlStrength += u_audioBass * 150.0; // Stronger turbulence
                    
                    // Audio shockwave repelling from center (0,0,0)
                    float distFromCenter = length(pos);
                    if (distFromCenter > 0.0) {
                        force += normalize(pos) * u_audioBass * 600.0 * (1.0 / (1.0 + distFromCenter * 0.005));
                    }
                }
                
                vec3 curl = curlNoise(pos * u_curlFreq + vec3(0.0, 0.0, u_time * dynamicCurlSpeed), u_time, persistence);
                force += curl * dynamicCurlStrength;
                
                pos += force * u_delta;
            }
        }
        
        gl_FragColor = vec4(pos, life);
    }
`;

export class GPGPUSimulator {
    constructor(renderer, size, uniforms) {
        this.renderer = renderer;
        this.size = size; // e.g. 512 for a 512x512 = 262,144 particles simulation
        
        // Check for float textures support
        const gl = renderer.getContext();
        if (!gl.getExtension('EXT_color_buffer_float')) {
            console.warn('EXT_color_buffer_float not supported! Falling back to half-float or unsigned byte.');
        }

        // Initialize variables
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        
        // Create initial positions texture
        this.initialTexture = this.createInitialTexture();
        
        // Set up uniforms
        this.uniforms = {
            u_positions: { value: null },
            u_initialPositions: { value: this.initialTexture },
            u_webcamTexture: { value: new THREE.Texture() },
            u_webcamPrevTexture: { value: new THREE.Texture() },
            u_webcamActive: { value: 0.0 },
            u_time: { value: 0 },
            u_delta: { value: 0 },
            u_mouse3d: { value: new THREE.Vector3() },
            u_mouseRadius: { value: uniforms.mouseRadius || 40.0 },
            u_mouseStrength: { value: uniforms.mouseStrength || 80.0 },
            u_curlFreq: { value: uniforms.curlFreq || 0.01 },
            u_curlSpeed: { value: uniforms.curlSpeed || 0.1 },
            u_curlStrength: { value: uniforms.curlStrength || 10.0 },
            u_attraction: { value: uniforms.attraction || 2.0 },
            u_depthScale: { value: uniforms.depthScale || 80.0 },
            u_decaySpeed: { value: uniforms.decaySpeed || 0.15 },
            u_motionThreshold: { value: uniforms.motionThreshold || 0.12 },
            u_motionSensitivity: { value: uniforms.motionSensitivity || 0.08 },
            u_reset: { value: 0.0 },
            u_viewScale: { value: new THREE.Vector2(400, 300) },
            u_audioBass: { value: 0.0 },
            u_audioActive: { value: 0.0 }
        };

        // Shader material for GPGPU simulation
        this.material = new THREE.ShaderMaterial({
            vertexShader: SIMULATION_VERTEX_SHADER,
            fragmentShader: SIMULATION_FRAGMENT_SHADER,
            uniforms: this.uniforms,
            depthWrite: false,
            depthTest: false
        });

        // Fullscreen quad mesh
        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, this.material);
        this.scene.add(mesh);

        // Create double render targets for ping-ponging positions
        const options = {
            wrapS: THREE.ClampToEdgeWrapping,
            wrapT: THREE.ClampToEdgeWrapping,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType, // Native float support in WebGL 2
            depthBuffer: false,
            stencilBuffer: false
        };

        this.rtA = new THREE.WebGLRenderTarget(this.size, this.size, options);
        this.rtB = new THREE.WebGLRenderTarget(this.size, this.size, options);

        // Copy initial positions into target B first
        this.copyTexture(this.initialTexture, this.rtB);
        this.copyTexture(this.initialTexture, this.rtA);
        
        this.currentOutput = this.rtA;
        this.currentInput = this.rtB;
    }

    createInitialTexture() {
        const amount = this.size * this.size;
        const data = new Float32Array(amount * 4);

        for (let i = 0; i < amount; i++) {
            const x = (i % this.size) / this.size;
            const y = Math.floor(i / this.size) / this.size;
            const z = 0.0;
            const life = Math.random(); // Initial random life offset

            const idx = i * 4;
            data[idx + 0] = x;
            data[idx + 1] = y;
            data[idx + 2] = z;
            data[idx + 3] = life;
        }

        const texture = new THREE.DataTexture(data, this.size, this.size, THREE.RGBAFormat, THREE.FloatType);
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;
        texture.needsUpdate = true;
        return texture;
    }

    // Helper to copy texture content
    copyTexture(inputTex, outputTarget) {
        const copyMat = new THREE.ShaderMaterial({
            vertexShader: SIMULATION_VERTEX_SHADER,
            fragmentShader: `
                uniform sampler2D u_tex;
                varying vec2 vUv;
                void main() {
                    gl_FragColor = texture2D(u_tex, vUv);
                }
            `,
            uniforms: { u_tex: { value: inputTex } },
            depthWrite: false,
            depthTest: false
        });

        const copyMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), copyMat);
        const tempScene = new THREE.Scene();
        tempScene.add(copyMesh);

        this.renderer.setRenderTarget(outputTarget);
        this.renderer.render(tempScene, this.camera);
        this.renderer.setRenderTarget(null);
    }

    // Ping-pong update
    update(time, delta) {
        // Swap targets
        const temp = this.currentInput;
        this.currentInput = this.currentOutput;
        this.currentOutput = temp;

        // Update uniforms
        this.uniforms.u_positions.value = this.currentInput.texture;
        this.uniforms.u_time.value = time;
        this.uniforms.u_delta.value = delta;

        // Render simulation to currentOutput
        this.renderer.setRenderTarget(this.currentOutput);
        this.renderer.render(this.scene, this.camera);
        this.renderer.setRenderTarget(null);

        // Turn off reset trigger if it was active
        this.uniforms.u_reset.value = 0.0;
    }

    get texture() {
        return this.currentOutput.texture;
    }

    triggerReset() {
        this.uniforms.u_reset.value = 1.0;
    }
}
