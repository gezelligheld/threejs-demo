import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

import image from '../../assets/env.hdr';
import image1 from '../../assets/env1.hdr';

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

  private raycaster: THREE.Raycaster | null = null;

  private mesh: THREE.Mesh | null = null;

  constructor(config: { wrap: HTMLElement | null }) {
    this.wrap = config.wrap;
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('mousedown', this.handleMousedown);

    this.init();
  }

  init = async () => {
    const loader = new RGBELoader();
    const texture = await loader.load(image);

    const width = window.innerWidth;
    const height = window.innerHeight;
    /*
     * 创建场景
     */
    const scene = new THREE.Scene();
    this.scene = scene;
    const box = new THREE.SphereGeometry(1000, 64, 64);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
    });
    // 贴图反转
    box.scale(0.8, 0.8, -0.8);
    const mesh = new THREE.Mesh(box, material);
    scene.add(mesh);
    this.mesh = mesh;
    // 引导icon
    const spriteMaterial = new THREE.SpriteMaterial({ color: 0xffffff });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(10, 50, 0);
    sprite.scale.set(10, 10, 10);
    scene.add(sprite);

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

    this.raycaster = new THREE.Raycaster();
  };

  handleResize = () => {
    if (!this.camera) {
      return;
    }
    this.camera.updateProjectionMatrix();
    this.renderer?.setSize(window.innerWidth, window.innerHeight - 1);
  };

  handleMousedown = async (e: MouseEvent) => {
    if (!this.raycaster || !this.camera || !this.scene || !this.mesh) {
      return;
    }
    const pointer = new THREE.Vector2();
    // 屏幕坐标转换为分量取值-1到1的 NDC 坐标，供顶点着色器使用
    // 原点从左上角变成了中心位置，经换算得到下面的公式
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(pointer, this.camera);
    // 获取点击到的物体
    // 原理是从物体中心向点击位置发射一条射线，如果这个距离比物体中心到物体顶点的距离都要小，则点击位置在物体里面
    const intersects = this.raycaster.intersectObjects(this.scene.children);
    const mesh = (intersects[0]?.object as THREE.Mesh) || null;
    // 场景切换
    if (mesh.type === 'Sprite') {
      const loader = new RGBELoader();
      const texture = await loader.load(image1);
      this.mesh.material = new THREE.MeshBasicMaterial({ map: texture });
    }
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
