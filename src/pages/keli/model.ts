import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { MMDLoader } from 'three/addons/loaders/MMDLoader.js';
import * as dat from 'dat.gui';

import keli from '../../assets/keli/keli.pmx';

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

  constructor(config: { wrap: HTMLElement | null }) {
    this.wrap = config.wrap;
    window.addEventListener('resize', this.handleResize);

    this.init();
  }

  init = () => {
    const gui = new dat.GUI();

    const width = window.innerWidth;
    const height = window.innerHeight;
    /*
     * 创建场景
     */
    const scene = new THREE.Scene();
    this.scene = scene;
    const geometry = new THREE.PlaneGeometry(100, 100);
    const material = new THREE.MeshStandardMaterial({
      color: 0xe8edd4,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.set(Math.PI / 2, 0, 0);
    // 接收投影
    plane.receiveShadow = true;
    scene.add(plane);

    /*
     * 相机
     */
    const camera = new THREE.PerspectiveCamera(50, width / height, 1, 1000);
    camera.position.set(0, 25, 100);
    scene.add(camera);
    this.camera = camera;

    /*
     * 光照
     */
    const spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(100, 100, 100);
    spotLight.angle = 0.2;
    // 用于计算阴影的光源对象
    spotLight.castShadow = true;
    scene.add(spotLight);
    gui.add(spotLight, 'angle', 0, Math.PI / 2);
    const ambient = new THREE.AmbientLight(0x666666);
    scene.add(ambient);

    /*
     * 渲染器
     */
    const renderer = new THREE.WebGLRenderer();
    this.renderer = renderer;
    renderer.setSize(width, height - 1);
    renderer.setClearColor(0x000000, 1);
    renderer.shadowMap.enabled = true;
    const wrap = this.wrap || document.body;
    wrap.appendChild(renderer.domElement);
    this.container = wrap;

    this.load();
    this.render();
  };

  // 加载模型
  load = () => {
    const loader = new MMDLoader();
    loader.load(keli, (mesh) => {
      if (!this.scene || !this.camera || !this.renderer) {
        return;
      }
      console.log(mesh);
      mesh.castShadow = true;
      this.scene.add(mesh);

      // 手柄控制器
      const controls = new TransformControls(
        this.camera,
        this.renderer.domElement
      );
      controls.size = 0.75;
      controls.attach(mesh);
      this.scene.add(controls);
      // const mixer = new THREE.AnimationMixer(mesh);
      // const animationClip = new THREE.AnimationClip('walk', 20, [
      //   new THREE.KeyframeTrack('.position[x]', [0, 10], [0, 100]),
      // ]);
      // const action = mixer.clipAction(animationClip);
      // action.loop = THREE.LoopRepeat;
      // action.play();
    });
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
      if (!this.camera || !this.scene || !this.renderer) {
        return;
      }
      this.animationFrameId &&
        window.cancelAnimationFrame(this.animationFrameId);
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
