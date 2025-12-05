"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js"
import { RenderPass } from "three/addons/postprocessing/RenderPass.js"
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js"

const theme = {
  accretionColor: new THREE.Vector3(1.0, 0.5, 0.2),
  accretionCore: new THREE.Vector3(1.0, 0.9, 0.7),
}

const tesseractVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const tesseractFragmentShader = `
  precision highp float;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uDepth;
  uniform float uOpacity;
  
  float hash(float n) { return fract(sin(n) * 43758.5453); }
  
  float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
  }

  float map(vec3 p) {
    vec3 q = p;
    q.z += uDepth;
    
    vec3 c = vec3(3.0, 3.0, 6.0);
    q = mod(q + c * 0.5, c) - c * 0.5;
    
    float pillars = sdBox(q, vec3(0.06, 1.4, 0.06));
    float hBars = sdBox(q, vec3(1.4, 0.04, 0.04));
    float zBars = sdBox(q, vec3(0.04, 0.04, 2.8));
    
    return min(min(pillars, hBars), zBars);
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
    
    vec3 ro = vec3(0.0, 0.0, 0.0);
    vec3 rd = normalize(vec3(uv, -1.2));
    
    float sway = sin(uTime * 0.3) * 0.1;
    ro.x += sway;
    ro.y += cos(uTime * 0.2) * 0.05;

    float t = 0.0;
    float glow = 0.0;
    
    for(int i = 0; i < 64; i++) {
      vec3 p = ro + rd * t;
      float d = map(p);
      
      glow += 0.02 / (1.0 + d * d * 20.0);
      
      if(d < 0.01) {
        glow += 0.4;
        break;
      }
      
      t += max(d * 0.6, 0.05);
      if(t > 50.0) break;
    }
    
    vec3 amber = vec3(1.0, 0.7, 0.3);
    vec3 white = vec3(1.0, 0.95, 0.85);
    vec3 col = mix(amber, white, glow * 0.6) * glow * 1.5;
    
    col *= exp(-t * 0.03);
    col *= 0.9 + 0.1 * sin(uTime * 2.0);
    
    col = col / (col + 1.0);
    col = pow(col, vec3(0.45));

    gl_FragColor = vec4(col, uOpacity);
  }
`

export default function BlackHoleScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showInfo, setShowInfo] = useState(true)

  useEffect(() => {
    if (!containerRef.current) return

    // Main scene for black hole
    const scene = new THREE.Scene()

    const tesseractScene = new THREE.Scene()
    const orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0, 2.0, 15)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      stencil: false,
    })

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0))
    renderer.autoClear = false
    containerRef.current.appendChild(renderer.domElement)

    const composer = new EffectComposer(renderer)
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.4, 0.6, 0.1)
    composer.addPass(bloomPass)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enablePan = false
    controls.minDistance = 1.5
    controls.maxDistance = 50
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.2

    const textureLoader = new THREE.TextureLoader()
    const galaxyTexture = textureLoader.load("/images/milkyway.png")
    galaxyTexture.colorSpace = THREE.SRGBColorSpace

    const starsTexture = textureLoader.load("/images/stars.jpg")
    starsTexture.colorSpace = THREE.SRGBColorSpace
    starsTexture.wrapS = THREE.RepeatWrapping
    starsTexture.wrapT = THREE.RepeatWrapping
    starsTexture.minFilter = THREE.LinearMipmapLinearFilter
    starsTexture.magFilter = THREE.LinearFilter

    const millerTexture = textureLoader.load("/images/miller-planet.png")
    millerTexture.colorSpace = THREE.SRGBColorSpace
    millerTexture.wrapS = THREE.RepeatWrapping
    millerTexture.wrapT = THREE.RepeatWrapping
    millerTexture.minFilter = THREE.LinearMipmapLinearFilter
    millerTexture.magFilter = THREE.LinearFilter

    const mannTexture = textureLoader.load("/images/mann-planet.png")
    mannTexture.colorSpace = THREE.SRGBColorSpace
    mannTexture.wrapS = THREE.RepeatWrapping
    mannTexture.wrapT = THREE.RepeatWrapping
    mannTexture.minFilter = THREE.LinearMipmapLinearFilter
    mannTexture.magFilter = THREE.LinearFilter

    const edmundsTexture = textureLoader.load("/images/edmunds-planet.png")
    edmundsTexture.colorSpace = THREE.SRGBColorSpace
    edmundsTexture.wrapS = THREE.RepeatWrapping
    edmundsTexture.wrapT = THREE.RepeatWrapping
    edmundsTexture.minFilter = THREE.LinearMipmapLinearFilter
    edmundsTexture.magFilter = THREE.LinearFilter

    const geometry = new THREE.BoxGeometry(100, 100, 100)

    const material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uCamPos: { value: camera.position },
        uCamTarget: { value: controls.target },
        uBaseColor: { value: theme.accretionColor },
        uCoreColor: { value: theme.accretionCore },
        uGalaxyTexture: { value: galaxyTexture },
        uStarsTexture: { value: starsTexture },
        uMillerTexture: { value: millerTexture },
        uMannTexture: { value: mannTexture },
        uEdmundsTexture: { value: edmundsTexture },
        uTransition: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;

        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec3 uCamPos;
        uniform vec3 uCamTarget;
        uniform vec3 uBaseColor;
        uniform vec3 uCoreColor;
        uniform sampler2D uGalaxyTexture;
        uniform sampler2D uStarsTexture;
        uniform sampler2D uMillerTexture;
        uniform sampler2D uMannTexture;
        uniform sampler2D uEdmundsTexture;
        uniform float uTransition;

        #define MAX_STEPS 400
        #define PI 3.14159265
        #define RS 1.0
        #define PHOTON_SPHERE 1.5
        #define ISCO 3.0
        #define DISK_INNER 2.6
        #define DISK_OUTER 12.0
        
        #define MILLER_RADIUS 0.6
        #define MANN_RADIUS 1.0
        #define EDMUNDS_RADIUS 1.3
        
        float hash(float n) { return fract(sin(n) * 43758.5453123); }
        float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        vec3 hash3(vec3 p) {
          p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
                   dot(p, vec3(269.5, 183.3, 246.1)),
                   dot(p, vec3(113.5, 271.9, 124.6)));
          return fract(sin(p) * 43758.5453123);
        }
        
        float noise(vec3 x) {
            vec3 p = floor(x);
            vec3 f = fract(x);
            f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
            float n = p.x + p.y * 157.0 + p.z * 113.0;
            return mix(mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
                           mix(hash(n + 157.0), hash(n + 158.0), f.x), f.y),
                       mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
                           mix(hash(n + 270.0), hash(n + 271.0), f.x), f.y), f.z);
        }
        
        float pnoise(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          vec3 u = f * f * (3.0 - 2.0 * f);
          
          return mix(mix(mix(hash(dot(i, vec3(1.0, 57.0, 113.0))),
                             hash(dot(i + vec3(1.0, 0.0, 0.0), vec3(1.0, 57.0, 113.0))), u.x),
                         mix(hash(dot(i + vec3(0.0, 1.0, 0.0), vec3(1.0, 57.0, 113.0))),
                             hash(dot(i + vec3(1.0, 1.0, 0.0), vec3(1.0, 57.0, 113.0))), u.x), u.y),
                     mix(mix(hash(dot(i + vec3(0.0, 0.0, 1.0), vec3(1.0, 57.0, 113.0))),
                             hash(dot(i + vec3(1.0, 0.0, 1.0), vec3(1.0, 57.0, 113.0))), u.x),
                         mix(hash(dot(i + vec3(0.0, 1.0, 1.0), vec3(1.0, 57.0, 113.0))),
                             hash(dot(i + vec3(1.0, 1.0, 1.0), vec3(1.0, 57.0, 113.0))), u.x), u.y), u.z);
        }

        float fbm(vec3 p) {
            float f = 0.0;
            float amp = 0.5;
            float freq = 1.0;
            mat3 rot = mat3(0.8, 0.6, 0.0, -0.6, 0.8, 0.0, 0.0, 0.0, 1.0);
            for(int i = 0; i < 10; i++){
                f += amp * noise(p * freq);
                p = rot * p;
                freq *= 2.07;
                amp *= 0.48;
            }
            return f;
        }
        
        float fbmHigh(vec3 p, int octaves) {
            float f = 0.0;
            float amp = 0.5;
            mat3 rot = mat3(0.8, 0.6, 0.0, -0.6, 0.8, 0.0, 0.0, 0.0, 1.0);
            for(int i = 0; i < 12; i++){
                if(i >= octaves) break;
                f += amp * pnoise(p);
                p = rot * p * 2.07;
                amp *= 0.48;
            }
            return f;
        }
        
        vec2 voronoi(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          
          float d1 = 10.0;
          float d2 = 10.0;
          
          for(int x = -1; x <= 1; x++) {
            for(int y = -1; y <= 1; y++) {
              for(int z = -1; z <= 1; z++) {
                vec3 neighbor = vec3(float(x), float(y), float(z));
                vec3 point = hash3(i + neighbor);
                vec3 diff = neighbor + point - f;
                float d = dot(diff, diff);
                
                if(d < d1) {
                  d2 = d1;
                  d1 = d;
                } else if(d < d2) {
                  d2 = d;
                }
              }
            }
          }
          
          return vec2(sqrt(d1), sqrt(d2));
        }
        
        float ridgedNoise(vec3 p, int octaves) {
          float f = 0.0;
          float amp = 0.5;
          float prev = 1.0;
          for(int i = 0; i < 8; i++) {
            if(i >= octaves) break;
            float n = 1.0 - abs(pnoise(p) * 2.0 - 1.0);
            n = n * n;
            f += n * amp * prev;
            prev = n;
            p *= 2.2;
            amp *= 0.5;
          }
          return f;
        }
        
        vec2 sphereUV(in vec3 p) {
          vec3 n = normalize(p);
          float u = atan(n.z, n.x) / (2.0 * 3.14159265) + 0.5;
          float v = asin(clamp(n.y, -1.0, 1.0)) / 3.14159265 + 0.5;
          return vec2(u, v);
        }
        
        vec3 calcNormal(vec3 p, float eps, float heightScale, int planetType) {
          vec2 e = vec2(eps, 0.0);
          
          float h0, hx, hy, hz;
          vec3 sp = normalize(p);
          
          if(planetType == 0) {
            h0 = fbmHigh(sp * 8.0 + vec3(uTime * 0.1), 8) * 0.3;
            hx = fbmHigh(normalize(p + e.xyy) * 8.0 + vec3(uTime * 0.1), 8) * 0.3;
            hy = fbmHigh(normalize(p + e.yxy) * 8.0 + vec3(uTime * 0.1), 8) * 0.3;
            hz = fbmHigh(normalize(p + e.yyx) * 8.0 + vec3(uTime * 0.1), 8) * 0.3;
          } else if(planetType == 1) {
            vec2 v0 = voronoi(sp * 12.0);
            vec2 vx = voronoi(normalize(p + e.xyy) * 12.0);
            vec2 vy = voronoi(normalize(p + e.yxy) * 12.0);
            vec2 vz = voronoi(normalize(p + e.yyx) * 12.0);
            h0 = v0.y - v0.x + ridgedNoise(sp * 6.0, 6) * 0.2;
            hx = vx.y - vx.x + ridgedNoise(normalize(p + e.xyy) * 6.0, 6) * 0.2;
            hy = vy.y - vy.x + ridgedNoise(normalize(p + e.yxy) * 6.0, 6) * 0.2;
            hz = vz.y - vz.x + ridgedNoise(normalize(p + e.yyx) * 6.0, 6) * 0.2;
          } else {
            h0 = ridgedNoise(sp * 5.0, 6) + fbmHigh(sp * 10.0, 8) * 0.3;
            hx = ridgedNoise(normalize(p + e.xyy) * 5.0, 6) + fbmHigh(normalize(p + e.xyy) * 10.0, 8) * 0.3;
            hy = ridgedNoise(normalize(p + e.yxy) * 5.0, 6) + fbmHigh(normalize(p + e.yxy) * 10.0, 8) * 0.3;
            hz = ridgedNoise(normalize(p + e.yyx) * 5.0, 6) + fbmHigh(normalize(p + e.yyx) * 10.0, 8) * 0.3;
          }
          
          vec3 n = normalize(vec3(h0 - hx, h0 - hy, h0 - hz) * heightScale + sp);
          return n;
        }
        
        vec3 getMillerPos() {
          float t = uTime;
          return vec3(cos(t * 0.8 + 4.0) * 5.5, 0.3, sin(t * 0.8 + 4.0) * 5.5);
        }
        
        vec3 getMannPos() {
          float t = uTime;
          return vec3(cos(t * 0.25 + 2.0) * 18.0, -1.5, sin(t * 0.25 + 2.0) * 18.0);
        }
        
        vec3 getEdmundsPos() {
          float t = uTime;
          return vec3(cos(t * 0.15) * 28.0, sin(t * 0.08) * 3.0, sin(t * 0.15) * 28.0);
        }
        
        vec2 raySphere(vec3 ro, vec3 rd, vec3 center, float radius) {
          vec3 oc = ro - center;
          float b = dot(oc, rd);
          float c = dot(oc, oc) - radius * radius;
          float h = b * b - c;
          if(h < 0.0) return vec2(-1.0);
          h = sqrt(h);
          return vec2(-b - h, -b + h);
        }
        
        vec3 getLightDir(vec3 pos) {
          vec3 toCenter = -normalize(pos);
          vec3 diskNormal = vec3(0.0, 1.0, 0.0);
          return normalize(toCenter + diskNormal * 0.5);
        }
        
        vec4 shadePlanet(vec3 ro, vec3 rd, vec3 center, float radius, int planetType) {
          vec2 t = raySphere(ro, rd, center, radius);
          if(t.x < 0.0) return vec4(0.0);
          
          vec3 hitPos = ro + rd * t.x;
          vec3 localPos = hitPos - center;
          vec3 normal = normalize(localPos);
          
          float rotSpeed = planetType == 0 ? 0.2 : (planetType == 1 ? 0.05 : 0.1);
          vec3 rotatedLocal = localPos;
          float angle = uTime * rotSpeed;
          rotatedLocal.x = localPos.x * cos(angle) - localPos.z * sin(angle);
          rotatedLocal.z = localPos.x * sin(angle) + localPos.z * cos(angle);
          
          vec2 uv = sphereUV(rotatedLocal);
          
          vec3 texColor;
          if(planetType == 0) {
            texColor = texture2D(uMillerTexture, uv).rgb;
          } else if(planetType == 1) {
            texColor = texture2D(uMannTexture, uv).rgb;
          } else {
            texColor = texture2D(uEdmundsTexture, uv).rgb;
          }
          
          vec3 detailNormal = calcNormal(rotatedLocal, 0.01, 2.0, planetType);
          vec3 N = normalize(mix(normal, detailNormal, 0.5));
          
          vec3 L = getLightDir(center);
          vec3 V = normalize(ro - hitPos);
          vec3 H = normalize(L + V);
          
          float NdotL = max(dot(N, L), 0.0);
          float diffuse = NdotL * 0.7 + 0.3;
          
          float NdotH = max(dot(N, H), 0.0);
          float spec = pow(NdotH, 64.0);
          
          float fresnel = pow(1.0 - max(dot(N, V), 0.0), 4.0);
          
          vec3 surfaceColor = texColor;
          float specIntensity = 0.3;
          vec3 atmosphereColor;
          
          if(planetType == 0) {
            atmosphereColor = vec3(0.3, 0.5, 0.8);
            specIntensity = 0.8;
            
            float waves = fbmHigh(rotatedLocal * 20.0 + vec3(uTime * 0.3, 0.0, uTime * 0.2), 6);
            surfaceColor += vec3(0.02, 0.05, 0.08) * waves;
            
            float foam = smoothstep(0.6, 0.8, waves);
            surfaceColor = mix(surfaceColor, vec3(0.9, 0.95, 1.0), foam * 0.2);
            
          } else if(planetType == 1) {
            atmosphereColor = vec3(0.6, 0.7, 0.85);
            specIntensity = 0.5;
            
            vec2 vor = voronoi(rotatedLocal * 15.0);
            float cracks = smoothstep(0.05, 0.0, vor.y - vor.x);
            surfaceColor = mix(surfaceColor, vec3(0.4, 0.5, 0.6), cracks * 0.5);
            
            float sparkle = pnoise(rotatedLocal * 100.0 + uTime) * pnoise(rotatedLocal * 150.0);
            sparkle = smoothstep(0.6, 1.0, sparkle);
            surfaceColor += vec3(1.0) * sparkle * 0.3;
            
            float sss = pow(max(dot(-L, V), 0.0), 2.0) * 0.2;
            surfaceColor += vec3(0.5, 0.6, 0.8) * sss;
            
          } else {
            atmosphereColor = vec3(0.3, 0.5, 0.9);
            specIntensity = 0.4;
            
            vec3 cloudPos = rotatedLocal + vec3(uTime * 0.02, 0.0, 0.0);
            float clouds = fbmHigh(cloudPos * 4.0, 8);
            clouds = smoothstep(0.4, 0.7, clouds);
            
            float cloudShadow = 1.0 - clouds * 0.3;
            surfaceColor *= cloudShadow;
            
            surfaceColor = mix(surfaceColor, vec3(0.95, 0.97, 1.0), clouds * 0.6);
            
            float terrain = ridgedNoise(rotatedLocal * 8.0, 5);
            surfaceColor = mix(surfaceColor, surfaceColor * 0.8, terrain * 0.1);
          }
          
          vec3 finalColor = surfaceColor * diffuse;
          finalColor += vec3(1.0, 0.95, 0.9) * spec * specIntensity;
          
          float mie = pow(max(dot(rd, L), 0.0), 8.0) * 0.3;
          finalColor = mix(finalColor, atmosphereColor, fresnel * 0.6);
          finalColor += atmosphereColor * mie * fresnel;
          
          float diskGlow = 1.0 / (length(center) * 0.5);
          finalColor += vec3(1.0, 0.6, 0.3) * diskGlow * 0.05 * max(NdotL, 0.0);
          
          return vec4(finalColor, 1.0);
        }

        vec3 aces(vec3 x) {
          const float a = 2.51;
          const float b = 0.03;
          const float c = 2.43;
          const float d = 0.59;
          const float e = 0.14;
          return clamp((x*(a*x+b))/(x*(c*x+d)+e), 0.0, 1.0);
        }

        vec3 getBackground(vec3 dir) {
            vec2 uv = vec2(atan(dir.z, dir.x), asin(clamp(dir.y, -1.0, 1.0)));
            uv *= vec2(0.1591, 0.3183);
            uv += 0.5;
            
            vec3 galaxy = texture2D(uGalaxyTexture, uv).rgb;
            vec2 starUV = uv * 4.0; 
            vec3 stars = texture2D(uStarsTexture, starUV).rgb;
            
            float galaxyMask = smoothstep(0.3, 0.5, uv.y) * smoothstep(0.7, 0.5, uv.y);
            vec3 bg = mix(stars * 0.207, galaxy * 0.461 + stars * 0.130, galaxyMask);
            
            float luminance = dot(bg, vec3(0.299, 0.587, 0.114));
            bg = mix(vec3(luminance), bg, 1.04);
            
            return bg;
        }

        vec3 getLensedBackground(vec3 dir, float lensStrength) {
            float aberration = lensStrength * 0.003;
            
            vec3 dirR = normalize(dir + vec3(aberration, 0.0, 0.0));
            vec3 dirG = dir;
            vec3 dirB = normalize(dir - vec3(aberration, 0.0, 0.0));
            
            float r = getBackground(dirR).r;
            float g = getBackground(dirG).g;
            float b = getBackground(dirB).b;
            
            return vec3(r, g, b);
        }
        
        vec3 bendRay(vec3 p, vec3 dir, float stepSize) {
            float r2 = dot(p, p);
            float r = sqrt(r2);
            
            float bendingStrength = 1.5 * RS / r2;
            
            if(r < 3.0 * RS) {
                bendingStrength += 2.0 * RS * RS / (r2 * r);
            }
            
            vec3 gravity = -normalize(p) * bendingStrength;
            
            if(r < 4.0 * RS) {
                vec3 spinAxis = vec3(0.0, 1.0, 0.0);
                vec3 tangent = cross(spinAxis, -normalize(p));
                float frameDrag = 0.12 * (RS * RS) / r2;
                gravity += tangent * frameDrag;
            }
            
            return normalize(dir + gravity * stepSize * 2.0);
        }

        void main() {
            vec2 screenUV = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
            vec3 ro = uCamPos;
            vec3 target = uCamTarget;
            vec3 fwd = normalize(target - ro);
            vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), fwd));
            vec3 up = cross(fwd, right);
            vec3 rd = normalize(fwd + screenUV.x * right + screenUV.y * up);

            vec3 p = ro;
            vec3 col = vec3(0.0);
            float totalDensity = 0.0;
            
            float stepSize = 0.1;
            float r = length(p);
            
            vec3 diskColorAccum = vec3(0.0);
            bool hitHorizon = false;
            
            float minRadius = 1000.0;
            int orbitCount = 0;
            vec3 prevPos = p;
            
            float dither = hash(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 0.1;
            
            float transmittance = 1.0;
            
            vec3 millerPos = getMillerPos();
            vec3 mannPos = getMannPos();
            vec3 edmundsPos = getEdmundsPos();
            
            vec4 planetColor = vec4(0.0);
            float planetDist = 1e10;

            for(int i = 0; i < MAX_STEPS; i++) {
                r = length(p);
                minRadius = min(minRadius, r);
                
                if(r < RS) {
                    hitHorizon = true;
                    transmittance = 0.0;
                    break; 
                }

                rd = bendRay(p, rd, stepSize);
                
                vec3 crossProd = cross(prevPos, p);
                if(crossProd.y < 0.0 && cross(p - prevPos, rd).y > 0.0 && r < 5.0) {
                    orbitCount++;
                }
                prevPos = p;
                
                p += rd * stepSize;
                
                if(planetColor.a < 0.5) {
                  vec2 tMiller = raySphere(p - rd * stepSize, rd, millerPos, MILLER_RADIUS);
                  if(tMiller.x > 0.0 && tMiller.x < stepSize * 2.0) {
                    vec4 pc = shadePlanet(p - rd * stepSize, rd, millerPos, MILLER_RADIUS, 0);
                    if(pc.a > 0.5 && tMiller.x < planetDist) {
                      planetColor = pc;
                      planetDist = tMiller.x;
                    }
                  }
                  
                  vec2 tMann = raySphere(p - rd * stepSize, rd, mannPos, MANN_RADIUS);
                  if(tMann.x > 0.0 && tMann.x < stepSize * 2.0) {
                    vec4 pc = shadePlanet(p - rd * stepSize, rd, mannPos, MANN_RADIUS, 1);
                    if(pc.a > 0.5 && tMann.x < planetDist) {
                      planetColor = pc;
                      planetDist = tMann.x;
                    }
                  }
                  
                  vec2 tEdmunds = raySphere(p - rd * stepSize, rd, edmundsPos, EDMUNDS_RADIUS);
                  if(tEdmunds.x > 0.0 && tEdmunds.x < stepSize * 2.0) {
                    vec4 pc = shadePlanet(p - rd * stepSize, rd, edmundsPos, EDMUNDS_RADIUS, 2);
                    if(pc.a > 0.5 && tEdmunds.x < planetDist) {
                      planetColor = pc;
                      planetDist = tEdmunds.x;
                    }
                  }
                }

                float h = abs(p.y);
                float d = length(p.xz);
                
                if(h < 0.5 && d > DISK_INNER && d < DISK_OUTER) {
                    
                    float radialFade = smoothstep(DISK_INNER, DISK_INNER + 0.5, d) * smoothstep(DISK_OUTER, DISK_OUTER - 2.0, d);
                    float verticalFade = exp(-h * h * 50.0);
                    
                    float angle = atan(p.z, p.x);
                    float speed = 6.0 / sqrt(d);
                    float offset = uTime * speed;
                    
                    vec3 baseCoord = vec3(angle * 5.0 + offset, d * 1.5, p.y * 2.0);
                    
                    float primaryNoise = fbm(baseCoord);
                    float mesoNoise = fbmHigh(baseCoord * 1.2 + vec3(uTime * 0.15, 0.0, uTime * 0.08), 8);
                    
                    float alphaModulation = fbm(baseCoord * 2.0 + uTime * 0.2);
                    
                    float noiseVal = primaryNoise * 0.5 + mesoNoise * 0.3;
                    noiseVal = smoothstep(0.20, 0.90, noiseVal);
                    
                    float density = radialFade * verticalFade * noiseVal * 0.35 * (0.6 + alphaModulation * 0.4);
                    
                    vec3 velocity = normalize(vec3(-p.z, 0.0, p.x));
                    float viewDotVel = dot(rd, velocity);
                    
                    float orbitalSpeed = sqrt(1.0 / d);
                    float doppler = pow(1.0 + viewDotVel * orbitalSpeed, 3.5);
                    
                    float gravRedshift = sqrt(1.0 - RS / d);
                    
                    vec3 hot = uCoreColor * 2.5;
                    vec3 cold = uBaseColor;
                    
                    float tempProfile = pow(DISK_INNER / d, 0.75);
                    
                    vec3 localCol = mix(cold, hot, noiseVal * tempProfile * (0.5 + viewDotVel * 0.3));
                    
                    localCol *= density;
                    localCol *= doppler;
                    localCol *= gravRedshift;
                    
                    diskColorAccum += localCol * transmittance;
                    totalDensity += density;
                    transmittance *= (1.0 - density * 0.3);
                }
                
                if(totalDensity > 1.2 || transmittance < 0.01) break;

                float distToHole = r - RS;
                stepSize = max(0.02, min(distToHole * 0.1, r * 0.06)) + dither * 0.01;
            }

            if(!hitHorizon && transmittance > 0.01) {
                float lensStrength = clamp(1.0 / (minRadius * 0.5), 0.0, 3.0);
                
                vec3 bg = getLensedBackground(rd, lensStrength);
                
                float distToPhotonSphere = abs(minRadius - PHOTON_SPHERE * RS);
                float photonRing = exp(-distToPhotonSphere * 100.0) * 2.0;
                bg += vec3(1.0, 0.85, 0.65) * photonRing;
                
                float einsteinRing = 0.0;
                if(minRadius < 2.5 * RS && minRadius > PHOTON_SPHERE) {
                    float ringFactor = 1.0 - abs(minRadius - 1.8 * RS) / (0.8 * RS);
                    ringFactor = clamp(ringFactor, 0.0, 1.0);
                    ringFactor = pow(ringFactor, 2.0);
                    
                    float orbitBrightness = 1.0 + float(orbitCount) * 0.5;
                    einsteinRing = ringFactor * orbitBrightness * 0.4;
                }
                
                bg *= (1.0 + einsteinRing);
                
                float shadowEdge = smoothstep(1.2 * RS, 2.5 * RS, minRadius);
                float edgeGlow = (1.0 - shadowEdge) * 0.15;
                bg += vec3(1.0, 0.85, 0.7) * edgeGlow * transmittance;
                
                float glow = 1.0 / (minRadius * minRadius);
                bg += uBaseColor * glow * 0.02;

                diskColorAccum += bg * transmittance;
            }
            
            if(planetColor.a > 0.5) {
              diskColorAccum = mix(diskColorAccum, planetColor.rgb, transmittance);
            }

            vec3 exposed = diskColorAccum * 1.5;
            vec3 finalCol = aces(exposed);
            finalCol = pow(finalCol, vec3(1.0 / 2.2));
            
            finalCol = mix(finalCol, vec3(0.0), uTransition);

            gl_FragColor = vec4(finalCol, 1.0);
        }
      `,
      transparent: false,
    })

    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    const tesseractGeometry = new THREE.PlaneGeometry(2, 2)
    const tesseractMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uDepth: { value: 0 },
        uOpacity: { value: 0 },
      },
      vertexShader: tesseractVertexShader,
      fragmentShader: tesseractFragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
    const tesseractMesh = new THREE.Mesh(tesseractGeometry, tesseractMaterial)
    tesseractMesh.frustumCulled = false
    tesseractScene.add(tesseractMesh)

    let currentMode: "ORBIT" | "TRANSITION_IN" | "TESSERACT" | "TRANSITION_OUT" = "ORBIT"
    let transitionProgress = 0
    let tesseractDepth = 0

    const clock = new THREE.Clock()

    const animate = () => {
      requestAnimationFrame(animate)
      const elapsedTime = clock.getElapsedTime()
      const delta = Math.min(clock.getDelta(), 0.05)

      const dist = camera.position.length()

      if (currentMode === "ORBIT") {
        if (dist < 3.5) {
          transitionProgress = Math.min(1, transitionProgress + delta * 1.5)
          if (dist < 2.2 && transitionProgress > 0.9) {
            currentMode = "TRANSITION_IN"
          }
        } else {
          transitionProgress = Math.max(0, transitionProgress - delta * 2)
        }
      } else if (currentMode === "TRANSITION_IN") {
        transitionProgress = Math.min(1, transitionProgress + delta * 2)
        if (transitionProgress >= 1) {
          currentMode = "TESSERACT"
          controls.enabled = false
          tesseractDepth = 0
        }
      } else if (currentMode === "TESSERACT") {
        tesseractDepth += delta * 10
      } else if (currentMode === "TRANSITION_OUT") {
        transitionProgress = Math.max(0, transitionProgress - delta * 2)
        if (transitionProgress <= 0) {
          currentMode = "ORBIT"
          controls.enabled = true
          camera.position.set(0, 2, 6)
          controls.target.set(0, 0, 0)
        }
      }

      // Update black hole shader
      material.uniforms.uTime.value = elapsedTime
      material.uniforms.uCamPos.value.copy(camera.position)
      material.uniforms.uCamTarget.value.copy(controls.target)
      material.uniforms.uTransition.value = transitionProgress

      // Update tesseract shader
      tesseractMaterial.uniforms.uTime.value = elapsedTime
      tesseractMaterial.uniforms.uDepth.value = tesseractDepth
      tesseractMaterial.uniforms.uOpacity.value = transitionProgress

      controls.update()

      renderer.clear()
      composer.render()

      if (transitionProgress > 0) {
        renderer.render(tesseractScene, orthoCamera)
      }
    }

    const handleWheel = (e: WheelEvent) => {
      if (currentMode === "TESSERACT" && e.deltaY < 0) {
        currentMode = "TRANSITION_OUT"
      }
    }
    renderer.domElement.addEventListener("wheel", handleWheel, { passive: true })

    animate()

    const handleResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      composer.setSize(w, h)
      material.uniforms.uResolution.value.set(w, h)
      tesseractMaterial.uniforms.uResolution.value.set(w, h)
    }
    window.addEventListener("resize", handleResize)
    const infoTimeout = setTimeout(() => setShowInfo(false), 8000)

    return () => {
      window.removeEventListener("resize", handleResize)
      renderer.domElement.removeEventListener("wheel", handleWheel)
      clearTimeout(infoTimeout)
      containerRef.current?.removeChild(renderer.domElement)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      tesseractGeometry.dispose()
      tesseractMaterial.dispose()
      galaxyTexture.dispose()
      starsTexture.dispose()
      millerTexture.dispose()
      mannTexture.dispose()
      edmundsTexture.dispose()
    }
  }, [])

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <div ref={containerRef} className="w-full h-full" />

      <div
        className={`absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none z-50 transition-opacity duration-[2000ms] ${showInfo ? "opacity-100" : "opacity-0"}`}
      >
        <div className="text-center">
          <h1
            className="text-6xl font-thin tracking-[0.5em] text-white mb-4"
            style={{ textShadow: "0 0 40px rgba(255,200,100,0.5)" }}
          >
            GARGANTUA
          </h1>
          <div className="h-px w-32 bg-white/30 mx-auto mb-4"></div>
          <p className="text-xs tracking-[0.3em] text-white/50 uppercase font-light">
            Interstellar Black Hole Simulation
          </p>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 text-white/40 text-xs font-mono pointer-events-none">
        <div>SCHWARZSCHILD GEODESICS + KERR FRAME DRAGGING</div>
        <div>KEPLERIAN DOPPLER D³·⁵ + GRAVITATIONAL REDSHIFT</div>
        <div>SHAKURA-SUNYAEV T∝r⁻³ᐟ⁴ TEMPERATURE PROFILE</div>
      </div>

      <div className="absolute bottom-4 right-4 text-white/30 text-xs font-mono pointer-events-none">
        DRAG TO ORBIT • SCROLL TO ZOOM • ZOOM IN TO ENTER EVENT HORIZON
      </div>
    </div>
  )
}
