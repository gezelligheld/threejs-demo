import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

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
  private orbitControls: PointerLockControls | null = null;

  private raycaster: THREE.Raycaster | null = null;

  private vector3 = new THREE.Vector3();

  private prevTime = performance.now();

  // 动作
  action = {
    left: false,
    right: false,
    front: false,
    back: false,
    jump: false,
  };

  constructor(config: { wrap: HTMLElement | null }) {
    this.wrap = config.wrap;
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('keydown', this.handleKeydown);
    document.addEventListener('keyup', this.handleKeyup);
    document.addEventListener('click', this.handleClick);

    this.init();
  }

  init = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    /*
     * 创建场景
     */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    // 雾化效果
    scene.fog = new THREE.Fog(0xffffff, 0, 750);
    this.scene = scene;

    /*
     * 地板
     */
    const floorGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
    floorGeometry.rotateX(-Math.PI / 2);
    // 随机生成顶点位置，形成一个随机形状的三角形拼接的平面
    const position = floorGeometry.attributes.position;
    // position.array 中保存着缓存中的数据，position.count是保存 array 除以 itemSize 之后的大小，itemSize是保存在 array 中矢量的长度，即每itemSize个值构成一个顶点
    for (let i = 0; i < position.count; i++) {
      const vector3 = new THREE.Vector3();
      // 从attribute中设置向量的x值、y值和z值
      vector3.fromBufferAttribute(position, i);
      vector3.x += Math.random() * 20 - 10;
      vector3.y += Math.random() * 2;
      vector3.z += Math.random() * 20 - 10;
      // 设置给定索引的矢量的第一、二、三维数据
      position.setXYZ(i, vector3.x, vector3.y, vector3.z);
    }

    // 随机生成顶点颜色
    const colorsFloor = [];
    const color = new THREE.Color();
    // 返回已索引的 BufferGeometry 的非索引版本
    const floorGeometryNonIndexed = floorGeometry.toNonIndexed();
    for (
      let i = 0;
      i < floorGeometryNonIndexed.attributes.position.count;
      i++
    ) {
      // 设置hsl值的颜色
      color.setHSL(
        Math.random() * 0.3 + 0.5,
        0.75,
        Math.random() * 0.25 + 0.75,
        THREE.SRGBColorSpace
      );
      colorsFloor.push(color.r, color.g, color.b);
    }
    floorGeometryNonIndexed.setAttribute(
      'color',
      // 每3个值描述一个顶点的颜色信息
      new THREE.Float32BufferAttribute(colorsFloor, 3)
    );
    // 使用顶点着色，不设置的话几何体设置的颜色不生效
    const floorMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });
    scene.add(new THREE.Mesh(floorGeometryNonIndexed, floorMaterial));

    /*
     * 物体
     */
    const boxGeometry = new THREE.BoxGeometry(20, 20, 20).toNonIndexed();
    const colorsBox = [];
    for (let i = 0; i < boxGeometry.attributes.position.count; i++) {
      color.setHSL(
        Math.random() * 0.3 + 0.5,
        0.75,
        Math.random() * 0.25 + 0.75,
        THREE.SRGBColorSpace
      );
      colorsBox.push(color.r, color.g, color.b);
    }
    boxGeometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(colorsBox, 3)
    );

    const material = new THREE.MeshPhongMaterial({
      // 高光颜色
      specular: 0xffffff,
      // 使用平面着色
      flatShading: true,
      // 使用顶点着色
      vertexColors: true,
    });
    for (let i = 0; i < 500; i++) {
      const box = new THREE.Mesh(boxGeometry, material);
      box.position.x = Math.floor(Math.random() * 20 - 10) * 20;
      box.position.y = Math.floor(Math.random() * 20) * 20 + 10;
      box.position.z = Math.floor(Math.random() * 20 - 10) * 20;
      scene.add(box);
    }

    /*
     * 光照
     */
    const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
    light.position.set(0.5, 1, 0.75);
    scene.add(light);

    /*
     * 相机
     */
    const camera = new THREE.PerspectiveCamera(50, width / height, 1, 1000);
    camera.position.set(0, 10, 0);
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
    // 第一人称视角控制器
    const controls = new PointerLockControls(camera, renderer.domElement);
    this.orbitControls = controls;
    scene.add(controls.getObject());
    this.render();

    const raycaster = new THREE.Raycaster(
      new THREE.Vector3(),
      new THREE.Vector3(0, -1, 0),
      0,
      10
    );
    this.raycaster = raycaster;
  };

  handleResize = () => {
    if (!this.camera) {
      return;
    }
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer?.setSize(window.innerWidth, window.innerHeight - 1);
  };

  handleKeydown = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.action.front = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.action.back = true;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.action.left = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.action.right = true;
        break;
      case 'Space':
        this.action.jump = true;
        break;
      default:
        break;
    }
  };

  handleKeyup = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.action.front = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.action.back = false;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.action.left = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.action.right = false;
        break;
      case 'Space':
        this.action.jump = false;
        break;
      default:
        break;
    }
  };

  handleClick = () => {
    // 开启第一人称视角
    this.orbitControls?.lock();
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
      const time = performance.now();
      if (this.orbitControls.isLocked) {
        const delta = (time - this.prevTime) / 1000;
        // z轴方向，向前或向后
        const directionZ = Number(this.action.front) - Number(this.action.back);
        // x轴方向，向左或向右
        const directionX = Number(this.action.left) - Number(this.action.right);
        if (this.action.front || this.action.back) {
          this.vector3.z += directionZ * delta;
          this.orbitControls.moveForward(this.vector3.z);
        }
        if (this.action.left || this.action.right) {
          this.vector3.x += directionX * delta;
          this.orbitControls.moveRight(-this.vector3.x);
        }
      }
      this.prevTime = time;
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
    document.removeEventListener('keydown', this.handleKeydown);
    document.removeEventListener('keyup', this.handleKeyup);
    document.removeEventListener('click', this.handleClick);
  };
}

export default Model;
