/**
 * Sonic Singularity Visualizer
 * A premium, shader-based experience that represents Sonic DNA as 
 * morphing geometric resonances rather than simple particles.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface VisualizerConfig {
  container: HTMLElement;
  theme: 'light' | 'dark';
  dnaSequence?: string;
  genes?: string[];
}

export class SonicVisualizer {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private core!: THREE.Mesh;
  private nodes: THREE.Group[] = [];
  private links!: THREE.LineSegments;
  private animationId: number | null = null;
  private time: number = 0;
  private config: VisualizerConfig;
  private clock = new THREE.Clock();

  // Shader params driven by DNA
  private params = {
    distortion: 0.2,
    speed: 1.0,
    colorShift: 0.0,
    complexity: 1.0
  };

  constructor(config: VisualizerConfig) {
    this.config = config;
    this.init();
  }

  private init() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      45,
      this.config.container.clientWidth / this.config.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 15);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.config.container.clientWidth, this.config.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.config.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enableZoom = false;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.5;

    this.setupLights();
    this.createCore();
    this.createDNAStructure();

    window.addEventListener('resize', this.onResize.bind(this));
    this.animate();
  }

  private setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambient);

    const p1 = new THREE.PointLight(this.getPrimaryColor(), 5, 20);
    p1.position.set(5, 5, 5);
    this.scene.add(p1);

    const p2 = new THREE.PointLight(this.getAccentColor(), 3, 20);
    p2.position.set(-5, -5, 5);
    this.scene.add(p2);
  }

  private getPrimaryColor() {
    return this.config.theme === 'dark' ? 0x818cf8 : 0x6366f1;
  }

  private getAccentColor() {
    return this.config.theme === 'dark' ? 0xfb7185 : 0xf43f5e;
  }

  /**
   * Create the central "Sonic Core" - a morphing geometric orb
   */
  private createCore() {
    // We'll use a high-poly sphere and a custom material
    const geometry = new THREE.IcosahedronGeometry(3, 32);

    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.0,
      metalness: 0.9,
      flatShading: false,
      emissive: this.getPrimaryColor(),
      emissiveIntensity: 0.2,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });

    this.core = new THREE.Mesh(geometry, material);
    this.scene.add(this.core);

    // Add an inner solid glow core
    const innerGeo = new THREE.IcosahedronGeometry(2.5, 4);
    const innerMat = new THREE.MeshStandardMaterial({
      color: this.getPrimaryColor(),
      emissive: this.getPrimaryColor(),
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.8
    });
    const innerCore = new THREE.Mesh(innerGeo, innerMat);
    this.core.add(innerCore);
  }

  /**
   * Create the "Genes" - distinct primitives that form the DNA structure
   */
  private createDNAStructure() {
    // Instead of 100 particles, we use 12 high-quality resonance nodes
    const nodeGeometries = [
      new THREE.IcosahedronGeometry(0.5, 0),
      new THREE.OctahedronGeometry(0.5, 0),
      new THREE.TorusGeometry(0.4, 0.1, 8, 16)
    ];

    for (let i = 0; i < 12; i++) {
      const group = new THREE.Group();

      const geo = nodeGeometries[i % nodeGeometries.length];
      const mat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? this.getPrimaryColor() : this.getAccentColor(),
        metalness: 1.0,
        roughness: 0.0,
        emissive: i % 2 === 0 ? this.getPrimaryColor() : this.getAccentColor(),
        emissiveIntensity: 0.2
      });

      const mesh = new THREE.Mesh(geo, mat);
      group.add(mesh);

      // Random initial scatter
      const radius = 6 + Math.random() * 2;
      const angle = (i / 12) * Math.PI * 2;
      group.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 4,
        Math.sin(angle) * radius
      );

      this.nodes.push(group);
      this.scene.add(group);
    }
  }

  public updateDNASequence(dna: string) {
    // Map Strudel functions to visual params
    this.params.distortion = dna.includes('distort') ? 0.8 : 0.2;
    this.params.speed = dna.includes('slow') ? 0.4 : (dna.includes('fast') ? 2.5 : 1.0);
    this.params.complexity = dna.split('|').length / 5;

    if (dna.includes('hpf')) this.params.colorShift = 1.0;
    else if (dna.includes('lpf')) this.params.colorShift = -1.0;
    else this.params.colorShift = 0.0;

    this.formHelix();
  }

  private formHelix() {
    const helixRadius = 4;
    const helixHeight = 10;
    const turns = 2;

    this.nodes.forEach((node, i) => {
      const t = i / this.nodes.length;
      const angle = t * Math.PI * turns * 2;
      const y = (t - 0.5) * helixHeight;
      const offset = (i % 2 === 0) ? 0 : Math.PI;

      const targetX = Math.cos(angle + offset) * helixRadius;
      const targetZ = Math.sin(angle + offset) * helixRadius;

      // We'll lerp this in the animate loop
      node.userData.targetPos = new THREE.Vector3(targetX, y, targetZ);
    });
  }

  public resetParticles() {
    this.params = { distortion: 0.2, speed: 1.0, colorShift: 0.0, complexity: 1.0 };
    this.nodes.forEach((node, i) => {
      const angle = (i / this.nodes.length) * Math.PI * 2;
      const radius = 8;
      node.userData.targetPos = new THREE.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      );
    });
  }

  public highlightParticles(indices: number[]) {
    // If indices is empty, dim everything except core
    // If all, ultra glow
    const intensity = indices.length > 0 ? 2.5 : 0.2;
    this.nodes.forEach(node => {
      const mesh = node.children[0] as THREE.Mesh;
      const material = mesh.material;
      if (material instanceof THREE.MeshStandardMaterial) {
        material.emissiveIntensity = intensity;
      }
    });
  }

  public playGenerationAnimation() {
    this.params.distortion = 2.0; // Explosion effect
    setTimeout(() => this.params.distortion = 0.5, 1000);
  }

  private onResize() {
    this.camera.aspect = this.config.container.clientWidth / this.config.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.config.container.clientWidth, this.config.container.clientHeight);
  }

  private animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));
    const delta = this.clock.getDelta();
    this.time += delta * this.params.speed;

    // 1. Core Morphing
    // We simulate a shader displacement by oscillating vertices (simple version)
    // In a real premium app, we'd use a custom ShaderMaterial
    const scale = 1 + Math.sin(this.time) * 0.1 * this.params.distortion;
    this.core.scale.setScalar(scale);
    this.core.rotation.y += delta * 0.2 * this.params.speed;
    this.core.rotation.z += delta * 0.1;

    // 2. Node Movement
    this.nodes.forEach((node, i) => {
      // Lerp to target position if set
      if (node.userData.targetPos) {
        node.position.lerp(node.userData.targetPos, 0.05);
      } else {
        // Brownian floating
        node.position.x += Math.sin(this.time + i) * 0.01;
        node.position.y += Math.cos(this.time * 0.8 + i) * 0.01;
      }

      // Individual node rotation
      node.rotation.x += delta * 0.5 * this.params.speed;
      node.rotation.y += delta * 0.3;

      // Color shift based on HPF/LPF
      const material = (node.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (this.params.colorShift > 0.5) material.emissive.setHex(0xffffff); // HPF - White
      else if (this.params.colorShift < -0.5) material.emissive.setHex(0x4444ff); // LPF - Blue
    });

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.renderer.dispose();
    this.scene.traverse((obj: any) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
    window.removeEventListener('resize', this.onResize.bind(this));
    if (this.config.container.contains(this.renderer.domElement)) {
      this.config.container.removeChild(this.renderer.domElement);
    }
  }
}