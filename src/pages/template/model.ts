import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class Model {
  // 相机
  private camera: THREE.PerspectiveCamera | null = null;

  // 场景
  private scene: THREE.Scene | null = null;

  // 渲染器
  private renderer: THREE.WebGLRenderer | null = null;

  private wrap: HTMLElement | null = null;

  // webgl容器
  private container: HTMLElement | null = null;

  private animationFrameId: number | null = null;

  // 轨道控制器
  private orbitControls: OrbitControls | null = null;

  constructor(config: { wrap: HTMLElement | null }) {
    this.wrap = config.wrap;
    window.addEventListener('resize', this.handleResize);

    this.init();
  }

  init = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    /*
     * 创建场景
     */
    const scene = new THREE.Scene();
    this.scene = scene;

    /*
     * 光照
     */
    const ambient = new THREE.AmbientLight(0x666666);
    scene.add(ambient);

    /*
     * 相机
     */
    const camera = new THREE.PerspectiveCamera(50, width / height, 1, 1000);
    camera.position.set(100, 100, 100);
    scene.add(camera);
    this.camera = camera;

    /*
     * 渲染器
     */
    const renderer = new THREE.WebGLRenderer();
    this.renderer = renderer;
    renderer.setSize(width, height - 1);
    renderer.setClearColor(0x000000, 1);
    this.renderer = renderer;
    const wrap = this.wrap || document.body;
    wrap.appendChild(renderer.domElement);
    this.container = wrap;
    // 轨道控制器，可以鼠标控制物体
    const controls = new OrbitControls(camera, renderer.domElement);
    // 启用阻尼，增加重量感
    controls.enableDamping = true;
    this.orbitControls = controls;
    this.render();
  };

  handleResize = () => {
    if (!this.camera) {
      return;
    }
    this.camera.updateProjectionMatrix();
    this.renderer?.setSize(window.innerWidth, window.innerHeight - 1);
  };

  // 渲染
  render = () => {
    const autoRun = () => {
      if (
        !this.camera ||
        !this.scene ||
        !this.renderer ||
        !this.orbitControls
      ) {
        return;
      }
      this.animationFrameId &&
        window.cancelAnimationFrame(this.animationFrameId);
      this.orbitControls.update();
      this.renderer.render(this.scene, this.camera);
      this.animationFrameId = window.requestAnimationFrame(autoRun);
    };
    this.animationFrameId = window.requestAnimationFrame(autoRun);
  };

  // 销毁
  destroy = () => {
    this.renderer?.dispose();
    this.container?.removeChild(this.renderer?.domElement as Node);
    this.container = null;

    window.removeEventListener('resize', this.handleResize);
  };
}

export default Model;
