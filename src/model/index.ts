import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';
import { EventEmitter } from 'events';
import * as dat from 'dat.gui';

import image from '../assets/texture.jpeg';

import { randomColor } from '../utils';
import {
  CAMERA_POSITION,
  POINT_LIGHT_POSITION,
  EVENT_MAPS,
  SCENE_RANGE_COEFFICIENT,
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

  // 所有选中过的物体
  private meshes: THREE.Mesh[] = [];

  // 当前物体
  private mesh: THREE.Mesh | null = null;

  private animationFrameId: number | null = null;

  // 轨道控制器
  private orbitControls: OrbitControls | null = null;

  // 是否自动旋转物体
  private isAutoRotate = false;

  private wrap: HTMLElement | null = null;

  event = new EventEmitter();

  gui: Record<'camera', { [k: string]: dat.GUIController }> | null = null;

  constructor(config: { wrap: HTMLElement | null }) {
    this.wrap = config.wrap;
    document.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('resize', this.handleResize);

    this.init3D();
    // this.initUI();
  }

  init3D = () => {
    /*
     * 创建场景
     */
    const scene = new THREE.Scene();
    this.scene = scene;

    /*
     *创建网格模型（充当物体）
     */
    // 添加纹理
    const loader = new THREE.TextureLoader();
    const texture = loader.load(image);
    for (let i = 0; i < 80; i++) {
      const size = Math.random() * 50;
      const geometry = new THREE.BoxGeometry(size, size, size);
      const color = new THREE.Color(randomColor());
      // 材质
      const material = new THREE.MeshLambertMaterial({
        color,
        normalMap: texture,
      });
      // 网格模型
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        Math.random() * 500 - 250,
        Math.random() * 500 - 250,
        Math.random() * 500 - 250
      );
      scene.add(mesh);
    }

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
    const camera = new THREE.OrthographicCamera(
      -SCENE_RANGE_COEFFICIENT * k,
      SCENE_RANGE_COEFFICIENT * k,
      SCENE_RANGE_COEFFICIENT,
      -SCENE_RANGE_COEFFICIENT,
      1,
      1000
    );
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
    const wrap = this.wrap || document.body;
    wrap.appendChild(renderer.domElement);
    this.container = wrap;
    // 轨道控制器，可以鼠标控制物体
    const controls = new OrbitControls(camera, renderer.domElement);
    // 启用阻尼，增加重量感
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.addEventListener('change', this.handleControlsChange);
    this.orbitControls = controls;
    this.render();

    // 用于鼠标拾取
    this.raycaster = new THREE.Raycaster();
  };

  initUI = () => {
    const gui = new dat.GUI();
    if (this.camera) {
      const folder = gui.addFolder('相机');
      const x = folder.add(this.camera.position, 'x', -1000, 1000);
      const y = folder.add(this.camera.position, 'y', -1000, 1000);
      const z = folder.add(this.camera.position, 'z', -1000, 1000);
      this.gui = {
        ...(this.gui || {}),
        camera: {
          x,
          y,
          z,
        },
      };
    }
  };

  // 移动相机
  moveCamera = (x: number, y: number, z: number) => {
    this.camera?.position.set(x, y, z);
  };

  // 移动点光源
  movePointLight = (x: number, y: number, z: number) => {
    this.pointLight?.position.set(x, y, z);
  };

  handleMouseDown = (e: MouseEvent) => {
    if (
      !this.raycaster ||
      !this.scene ||
      !this.camera ||
      (e.target as any)?.nodeName !== 'CANVAS'
    ) {
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
    this.mesh = (intersects[0]?.object as THREE.Mesh) || null;
    if (this.mesh) {
      this.meshes.push(this.mesh);
    }
    intersects.forEach(() => {
      (
        (intersects[0].object as THREE.Mesh)
          .material as THREE.MeshLambertMaterial
      ).color.set(0xffffff);
    });
    this.event.emit(EVENT_MAPS.geometrySelected, intersects);
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
    // 参考官方文档 https://greensock.com/
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

  handleResize = () => {
    if (!this.camera) {
      return;
    }
    const width = window.innerWidth;
    const height = window.innerHeight;
    const k = width / height;
    this.camera.left = -SCENE_RANGE_COEFFICIENT * k;
    this.camera.right = SCENE_RANGE_COEFFICIENT * k;
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
      if (this.meshes.length && this.isAutoRotate) {
        this.meshes.forEach((mesh) => {
          mesh.rotation.set(
            mesh.rotation.x + 0.01,
            mesh.rotation.y + 0.01,
            mesh.rotation.z + 0.01
          );
        });
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
    window.removeEventListener('resize', this.handleResize);
    this.orbitControls?.removeEventListener(
      'change',
      this.handleControlsChange
    );
    this.event.removeAllListeners();
  };
}

export default Model;
