/**
 * 3D Visualizer for Sonic Guardian
 * Creates an interactive 3D physics-based visualization of the DNA extraction process
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export interface VisualizerConfig {
  container: HTMLElement;
  theme: 'light' | 'dark';
  particleCount: number;
  dnaSequence?: string;
}

export interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  targetPosition: THREE.Vector3;
  originalPosition: THREE.Vector3;
  color: THREE.Color;
  size: number;
}

export class SonicVisualizer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private particles: Particle[] = [];
  private animationId: number | null = null;
  private time: number = 0;
  private isAnimating: boolean = false;
  private config: VisualizerConfig;

  constructor(config: VisualizerConfig) {
    this.config = config;
    this.init();
  }

  private init() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.getBackgroundColor());

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75, 
      this.config.container.clientWidth / this.config.container.clientHeight, 
      0.1, 
      1000
    );
    this.camera.position.set(0, 0, 15);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(this.config.container.clientWidth, this.config.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.config.container.appendChild(this.renderer.domElement);

    // Add controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enableZoom = true;
    this.controls.enablePan = true;

    // Add lighting
    this.setupLighting();

    // Create particles
    this.createParticles();

    // Handle resize
    window.addEventListener('resize', this.onResize.bind(this));

    // Start animation
    this.animate();
  }

  private setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    // Directional light
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    // Point lights for DNA effect
    const blueLight = new THREE.PointLight(0x00ffff, 2, 20);
    blueLight.position.set(0, 0, 0);
    this.scene.add(blueLight);

    const purpleLight = new THREE.PointLight(0x8000ff, 1.5, 15);
    purpleLight.position.set(3, 3, 3);
    this.scene.add(purpleLight);

    // Hemisphere light for ambient color
    const hemiLight = new THREE.HemisphereLight(0x404040, 0xffffff, 0.5);
    this.scene.add(hemiLight);
  }

  private createParticles() {
    const geometry = new THREE.IcosahedronGeometry(0.2, 0);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.1,
      metalness: 0.8,
      emissive: 0x000000,
      emissiveIntensity: 0.5
    });

    const colors = this.getThemeColors();
    
    for (let i = 0; i < this.config.particleCount; i++) {
      const mesh = new THREE.Mesh(geometry, material.clone());
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Random position in a sphere
      const radius = 4 + Math.random() * 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      mesh.position.set(x, y, z);
      mesh.userData = { originalPosition: new THREE.Vector3(x, y, z) };

      const particle: Particle = {
        mesh,
        velocity: new THREE.Vector3(),
        targetPosition: new THREE.Vector3(x, y, z),
        originalPosition: new THREE.Vector3(x, y, z),
        color: colors[i % colors.length],
        size: 0.2 + Math.random() * 0.3
      };

      // Set initial color
      (mesh.material as THREE.MeshStandardMaterial).color.copy(particle.color);
      (mesh.material as THREE.MeshStandardMaterial).emissive.copy(particle.color).multiplyScalar(0.3);

      this.particles.push(particle);
      this.scene.add(mesh);
    }
  }

  private getThemeColors(): THREE.Color[] {
    if (this.config.theme === 'dark') {
      return [
        new THREE.Color(0x00ffff), // Cyan
        new THREE.Color(0x8000ff), // Purple
        new THREE.Color(0xff00ff), // Magenta
        new THREE.Color(0x00ff80), // Green
        new THREE.Color(0xffaa00)  // Orange
      ];
    } else {
      return [
        new THREE.Color(0x2563eb), // Blue
        new THREE.Color(0x10b981), // Green
        new THREE.Color(0xf59e0b), // Yellow
        new THREE.Color(0xef4444), // Red
        new THREE.Color(0x8b5cf6)  // Purple
      ];
    }
  }

  private getBackgroundColor(): string {
    return this.config.theme === 'dark' ? '#0b1220' : '#ffffff';
  }

  public updateDNASequence(dnaSequence: string) {
    this.config.dnaSequence = dnaSequence;
    this.animateDNAFormation();
  }

  private animateDNAFormation() {
    if (!this.config.dnaSequence) return;

    const sequence = this.config.dnaSequence;
    const helixRadius = 2;
    const helixHeight = 8;
    const turns = 2;

    this.particles.forEach((particle, index) => {
      const t = index / this.particles.length;
      const angle = t * Math.PI * 2 * turns;
      const height = (t - 0.5) * helixHeight;

      // Create double helix pattern
      const helixOffset = (index % 2 === 0) ? Math.PI : 0;
      
      const targetX = Math.cos(angle + helixOffset) * helixRadius;
      const targetY = height;
      const targetZ = Math.sin(angle + helixOffset) * helixRadius;

      particle.targetPosition.set(targetX, targetY, targetZ);
      particle.size = 0.3;
    });

    this.isAnimating = true;
  }

  public resetParticles() {
    this.particles.forEach(particle => {
      particle.targetPosition.copy(particle.originalPosition);
      particle.size = 0.2 + Math.random() * 0.3;
    });
    this.isAnimating = false;
  }

  public highlightParticles(matchingIndices: number[]) {
    this.particles.forEach((particle, index) => {
      const material = particle.mesh.material as THREE.MeshStandardMaterial;
      
      if (matchingIndices.includes(index)) {
        // Highlight matching particles
        material.emissiveIntensity = 2.0;
        material.emissive.copy(particle.color);
      } else {
        // Dim non-matching particles
        material.emissiveIntensity = 0.1;
      }
    });
  }

  public playGenerationAnimation() {
    // Create a pulse effect
    this.particles.forEach(particle => {
      const pulse = Math.sin(this.time * 5) * 0.5 + 1;
      particle.mesh.scale.setScalar(pulse);
    });
  }

  private onResize() {
    this.camera.aspect = this.config.container.clientWidth / this.config.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.config.container.clientWidth, this.config.container.clientHeight);
  }

  private animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));

    this.time += 0.016; // Approximate delta time

    // Update particles
    this.particles.forEach(particle => {
      // Smoothly interpolate to target position
      particle.mesh.position.lerp(particle.targetPosition, 0.1);
      
      // Add subtle floating animation
      const floatOffset = Math.sin(this.time + particle.mesh.position.x) * 0.1;
      particle.mesh.position.y += floatOffset * 0.1;

      // Rotate particles
      particle.mesh.rotation.x += 0.01;
      particle.mesh.rotation.y += 0.01;

      // Pulse animation
      if (this.isAnimating) {
        const pulse = Math.sin(this.time * 4 + particle.mesh.position.length()) * 0.2 + 1;
        particle.mesh.scale.setScalar(pulse);
      } else {
        particle.mesh.scale.setScalar(1);
      }
    });

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    this.renderer.dispose();
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach(mat => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    window.removeEventListener('resize', this.onResize.bind(this));
    this.config.container.removeChild(this.renderer.domElement);
  }
}