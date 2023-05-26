import * as THREE from 'three';
import { MMDLoader } from 'three/addons/loaders/MMDLoader.js';
import * as dat from 'dat.gui';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import keli from '../../assets/keli/keli.pmx';
import keliVmd from '../../assets/keli/keli.vmd';

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

  private gui: dat.GUI | null = null;

  // 动画混合器
  private mixer: THREE.AnimationMixer | null = null;

  private clock: THREE.Clock | null = null;

  constructor(config: { wrap: HTMLElement | null }) {
    this.wrap = config.wrap;
    window.addEventListener('resize', this.handleResize);

    this.init();
  }

  init = () => {
    const gui = new dat.GUI();
    this.gui = gui;

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
    // 轨道控制器，可以鼠标控制物体
    const controls = new OrbitControls(camera, renderer.domElement);
    // 启用阻尼，增加重量感
    controls.enableDamping = true;
    this.orbitControls = controls;

    this.clock = new THREE.Clock();

    this.load();
    this.render();
  };

  // 加载模型
  load = () => {
    const loader = new MMDLoader();
    loader.loadWithAnimation(keli, keliVmd, (mmd) => {
      mmd.mesh.castShadow = true;
      console.log(mmd.animation);
      this.scene?.add(mmd.mesh);

      const clip = new THREE.AnimationClip('default', 10, mmd.animation.tracks);
      const mixer = new THREE.AnimationMixer(mmd.mesh); //创建混合器
      const animationAction = mixer.clipAction(clip); //返回动画操作对象
      animationAction.loop = THREE.LoopRepeat;
      animationAction.play();
      this.mixer = mixer;
    });
  };

  handleResize = () => {
    if (!this.camera) {
      return;
    }
    this.camera.aspect = window.innerWidth / window.innerHeight;
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
      this.orbitControls?.update();
      this.mixer?.update(this.clock?.getDelta() || 0);
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

    this.gui?.destroy();

    window.removeEventListener('resize', this.handleResize);
  };
}

export default Model;
