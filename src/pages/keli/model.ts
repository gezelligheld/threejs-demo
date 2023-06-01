import * as THREE from 'three';
import { MMDLoader } from 'three/addons/loaders/MMDLoader.js';
import * as dat from 'dat.gui';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import keli from '../../assets/keli/keli.pmx';
import keliVmd from '../../assets/keli/keli.vmd';
import linghua from '../../assets/linghua/linghua.pmx';
import linghuaVmd from '../../assets/linghua/linghua.vmd';
import { gsap } from 'gsap';

const ASSETS = [
  {
    name: 'keli',
    model: keli,
    action: keliVmd,
    position: new THREE.Vector3(-10, 0, 0),
  },
  {
    name: 'linghua',
    model: linghua,
    action: linghuaVmd,
    position: new THREE.Vector3(10, 0, 0),
  },
];
const ROTATION_RADIUS = 10;

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
  private mixers: {
    mixer: THREE.AnimationMixer;
    name: string;
    play: boolean;
  }[] = [];

  private clock: THREE.Clock | null = null;

  private raycaster: THREE.Raycaster | null = null;

  constructor(config: { wrap: HTMLElement | null }) {
    this.wrap = config.wrap;
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('mousedown', this.handleMousedown);

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
    const group = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const ball = new THREE.SphereGeometry(1, 64, 64);
      const material = new THREE.MeshStandardMaterial({ color: 0xe3f756 });
      const mesh = new THREE.Mesh(ball, material);
      // 小球圆周动画
      const obj = { angle: 0 };
      gsap.to(obj, {
        angle: Math.PI * 2,
        ease: 'power2.out',
        repeat: Infinity,
        duration: 5,
        onUpdate: () => {
          mesh.position.set(
            ROTATION_RADIUS *
              Math.cos(Math.PI / 2 + (i * Math.PI * 2) / 3 + obj.angle),
            30,
            ROTATION_RADIUS *
              Math.sin(Math.PI / 2 + (i * Math.PI * 2) / 3 + obj.angle)
          );
        },
      });
      const l = new THREE.PointLight(0xe3f756, 1, 20);
      l.add(mesh);
      group.add(l);
    }
    scene.add(group);

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
    const spotLight = new THREE.SpotLight(0xcccccc);
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

    this.raycaster = new THREE.Raycaster();

    this.load();
    this.render();
  };

  // 加载模型
  load = () => {
    ASSETS.forEach(({ action, model, position, name }, index) => {
      const loader = new MMDLoader();
      loader.loadWithAnimation(model, action, (mmd) => {
        console.log(mmd);
        mmd.mesh.name = name;
        mmd.mesh.castShadow = true;
        mmd.mesh.position.set(position.x, position.y, position.z);
        this.scene?.add(mmd.mesh);

        const clip = new THREE.AnimationClip(
          `default${index}`,
          60,
          mmd.animation.tracks
        );
        const mixer = new THREE.AnimationMixer(mmd.mesh); //创建混合器
        const animationAction = mixer.clipAction(clip); //返回动画操作对象
        animationAction.loop = THREE.LoopRepeat;
        animationAction.play();
        this.mixers.push({ mixer, name, play: false });
      });
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

  handleMousedown = (e: MouseEvent) => {
    if (!this.raycaster || !this.camera || !this.scene || !this.orbitControls) {
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
    if (intersects.length) {
      const mesh = ASSETS.find(
        ({ name }) => name === intersects[0].object.name
      );
      if (mesh) {
        this.orbitControls.target = mesh.position;
        gsap.to(this.camera.position, {
          x: 0,
          y: 20,
          z: 40,
          ease: 'power2.out',
          onUpdate: () => {
            this.camera?.updateProjectionMatrix();
          },
        });
      }

      const mixer = this.mixers.find(
        ({ name }) => name === intersects[0].object.name
      );
      if (mixer) {
        this.mixers = this.mixers.map((m) => ({
          ...m,
          play: m.name === intersects[0].object.name,
        }));
      }
    }
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
      this.mixers.forEach(({ mixer, play }) => {
        play && mixer?.update(this.clock?.getDelta() || 0);
      });
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

    this.mixers = [];

    this.gui?.destroy();

    window.removeEventListener('resize', this.handleResize);
  };
}

export default Model;
