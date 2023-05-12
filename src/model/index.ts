import * as THREE from 'three';

import { randomColor } from '../utils';
import { CAMERA_POSITION, POINT_LIGHT_POSITION } from '../constants';

class Model {
  private camera: THREE.OrthographicCamera | null = null;

  private scene: THREE.Scene | null = null;

  private renderer: THREE.WebGLRenderer | null = null;

  private pointLight: THREE.PointLight | null = null;

  private container: HTMLElement | null = null;

  private raycaster: THREE.Raycaster | null = null;

  private lightMesh: THREE.Mesh | null = null;

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
    scene.add(mesh);

    // 创建网格模型（充当点光源）
    const lightGeometry = new THREE.SphereGeometry(10, 32, 16);
    const lightMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
    });
    const lightMesh = new THREE.Mesh(lightGeometry, lightMaterial);
    lightMesh.position.set(
      POINT_LIGHT_POSITION.x,
      POINT_LIGHT_POSITION.y,
      POINT_LIGHT_POSITION.z
    );
    this.lightMesh = lightMesh;
    scene.add(lightMesh);

    // 点光源
    const point = new THREE.PointLight(0xffffff);
    this.pointLight = point;
    point.position.set(
      POINT_LIGHT_POSITION.x,
      POINT_LIGHT_POSITION.y,
      POINT_LIGHT_POSITION.z
    );
    scene.add(point);
    // 添加点光源照亮灯泡
    const lightPoint = new THREE.PointLight(0xbbbbbb);
    lightPoint.position.set(100, 100, 100);
    scene.add(lightPoint);
    // 环境光
    const ambient = new THREE.AmbientLight(0x666666);
    scene.add(ambient);

    // 相机
    const width = window.innerWidth;
    const height = window.innerHeight;
    const k = width / height;
    const s = 200; // 三维场景显示范围控制系数，系数越大，显示的范围越大
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
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 1);
    const wrap = config.wrap || document.body;
    wrap.appendChild(renderer.domElement);
    this.container = wrap;
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
    this.render();
  };

  // 移动点光源
  movePointLight = (x: number, y: number, z: number) => {
    if (!this.pointLight || !this.scene) {
      return;
    }
    this.pointLight.position.set(x, y, z); //点光源位置
    this.scene.add(this.pointLight);
    this.render();
    this.lightMesh?.position.set(x, y, z);
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
    const intersects = this.raycaster.intersectObjects(this.scene.children);
    intersects.forEach(() => {
      const color = new THREE.Color(randomColor());
      (
        (intersects[0].object as THREE.Mesh)
          .material as THREE.MeshLambertMaterial
      ).color.set(color);
    });
    this.render();
  };

  // 渲染
  render = () => {
    if (!this.camera || !this.scene || !this.renderer) {
      return;
    }
    this.renderer.render(this.scene, this.camera);
  };

  // 销毁
  destroy = () => {
    this.renderer?.dispose();
    this.container?.removeChild(this.renderer?.domElement as Node);
    this.container = null;
    document.removeEventListener('mousedown', this.handleMouseDown);
  };
}

export default Model;
