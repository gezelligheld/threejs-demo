import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';
import { EventEmitter } from 'events';

import { randomColor } from '../utils';
import {
  CAMERA_POSITION,
  POINT_LIGHT_POSITION,
  EVENT_MAPS,
} from '../constants';

class Model {
  // 相机
  private camera: THREE.OrthographicCamera | null = null;

  // 场景
  private scene: THREE.Scene | null = null;

  // 渲染器
  private renderer: THREE.WebGLRenderer | null = null;

  // 点光源
  private pointLight: THREE.PointLight | null = null;

  // webgl容器
  private container: HTMLElement | null = null;

  // 鼠标拾取
  private raycaster: THREE.Raycaster | null = null;

  // 网格模型
  private mesh: THREE.Mesh | null = null;

  private animationFrameId: number | null = null;

  // 轨道控制器
  private orbitControls: OrbitControls | null = null;

  // 是否自动旋转物体
  private isAutoRotate = false;

  event = new EventEmitter();

  constructor() {
    document.addEventListener('mousedown', this.handleMouseDown);
  }

  init = (config: { wrap: HTMLElement | null }) => {
    // 创建场景
    const scene = new THREE.Scene();
    this.scene = scene;

    // 创建网格模型（充当物体）
    const geometry = new THREE.BoxGeometry(100, 100, 100);
    const material = new THREE.MeshLambertMaterial({ color: 0x0000ff });
    const mesh = new THREE.Mesh(geometry, material);
    this.mesh = mesh;
    scene.add(mesh);

    // 点光源
    const point = new THREE.PointLight(0xffffff);
    this.pointLight = point;
    point.position.set(
      POINT_LIGHT_POSITION.x,
      POINT_LIGHT_POSITION.y,
      POINT_LIGHT_POSITION.z
    );
    scene.add(point);
    // 模拟点光源路径
    const pointLightHelper = new THREE.PointLightHelper(point, 50);
    scene.add(pointLightHelper);
    // 环境光
    const ambient = new THREE.AmbientLight(0x666666);
    scene.add(ambient);

    const axesHelper = new THREE.AxesHelper(
      Math.max(window.innerWidth, window.innerHeight)
    );
    scene.add(axesHelper);

    // 相机
    const width = window.innerWidth;
    const height = window.innerHeight;
    const k = width / height;
    // 三维场景显示范围控制系数，系数越大，显示的范围越大
    const s = 200;
    const camera = new THREE.OrthographicCamera(-s * k, s * k, s, -s, 1, 1000);
    camera.position.set(
      CAMERA_POSITION.x,
      CAMERA_POSITION.y,
      CAMERA_POSITION.z
    );
    camera.lookAt(scene.position);
    this.camera = camera;

    // 渲染器
    const renderer = new THREE.WebGLRenderer();
    this.renderer = renderer;
    // 不减1会出现滚动条，why?
    renderer.setSize(width, height - 1);
    renderer.setClearColor(0x000000, 1);
    const wrap = config.wrap || document.body;
    wrap.appendChild(renderer.domElement);
    this.container = wrap;
    // 轨道控制器，可以鼠标控制物体
    const controls = new OrbitControls(camera, renderer.domElement);
    // 启用阻尼，增加重量感
    controls.enableDamping = true;
    controls.addEventListener('change', this.handleControlsChange);
    this.orbitControls = controls;
    this.render();

    // 用于鼠标拾取
    this.raycaster = new THREE.Raycaster();
  };

  // 移动相机
  moveCamera = (x: number, y: number, z: number) => {
    if (!this.camera || !this.scene) {
      return;
    }
    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.scene.position);
  };

  // 移动点光源
  movePointLight = (x: number, y: number, z: number) => {
    if (!this.pointLight || !this.scene) {
      return;
    }
    this.pointLight.position.set(x, y, z); //点光源位置
    this.scene.add(this.pointLight);
  };

  handleMouseDown = (e: MouseEvent) => {
    if (!this.raycaster || !this.scene || !this.camera) {
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
    intersects.forEach(() => {
      const color = new THREE.Color(randomColor());
      (
        (intersects[0].object as THREE.Mesh)
          .material as THREE.MeshLambertMaterial
      ).color.set(color);
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleControlsChange = (e: any) => {
    const position = e.target.object.position;
    this.event.emit(EVENT_MAPS.orbitControlsChange, {
      x: Math.floor(position.x),
      y: Math.floor(position.y),
      z: Math.floor(position.z),
    });
  };

  // 动画
  animate = (x: number, y: number, z: number) => {
    if (!this.mesh) {
      return;
    }
    gsap.to(this.mesh.position, {
      x,
      y,
      z,
      duration: 5,
      ease: 'power2.out',
      onStart: (e) => {
        this.event.emit(EVENT_MAPS.animateStart, e);
      },
      onComplete: (e) => {
        this.event.emit(EVENT_MAPS.animateEnd, e);
      },
    });
  };

  // 自动旋转切换
  toggleAutoRotate = (value: boolean) => {
    this.isAutoRotate = value;
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
      if (this.mesh && this.isAutoRotate) {
        this.mesh.rotation.set(
          this.mesh.rotation.x + 0.01,
          this.mesh.rotation.y + 0.01,
          this.mesh.rotation.z + 0.01
        );
      }
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

    document.removeEventListener('mousedown', this.handleMouseDown);
    this.orbitControls?.removeEventListener(
      'change',
      this.handleControlsChange
    );
    this.event.removeAllListeners();
  };
}

export default Model;
