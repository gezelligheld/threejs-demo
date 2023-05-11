import * as THREE from 'three';

class Model {
  private camera: THREE.OrthographicCamera | null = null;

  private scene: THREE.Scene | null = null;

  private renderer: THREE.WebGLRenderer | null = null;

  private pointLight: THREE.PointLight | null = null;

  private container: HTMLElement | null = null;

  init = (config: { wrap: HTMLElement | null }) => {
    // 创建场景
    const scene = new THREE.Scene();
    this.scene = scene;

    // 创建网格模型
    const geometry = new THREE.BoxGeometry(100, 100, 100);
    const material = new THREE.MeshLambertMaterial({ color: 0x0000ff });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    //点光源
    const point = new THREE.PointLight(0xffffff);
    this.pointLight = point;
    point.position.set(400, 200, 300); //点光源位置
    scene.add(point); //点光源添加到场景中
    //环境光
    const ambient = new THREE.AmbientLight(0x444444);
    scene.add(ambient);

    // 相机
    const width = window.innerWidth; //窗口宽度
    const height = window.innerHeight; //窗口高度
    const k = width / height; //窗口宽高比
    const s = 200; //三维场景显示范围控制系数，系数越大，显示的范围越大
    const camera = new THREE.OrthographicCamera(-s * k, s * k, s, -s, 1, 1000);
    camera.position.set(200, 300, 200); //设置相机位置
    camera.lookAt(scene.position); //设置相机方向(指向的场景对象)
    this.camera = camera;

    // 渲染器
    const renderer = new THREE.WebGLRenderer();
    this.renderer = renderer;
    renderer.setSize(width, height); //设置渲染区域尺寸
    renderer.setClearColor(0x000000, 1); //设置背景颜色
    const wrap = config.wrap || document.body;
    wrap.appendChild(renderer.domElement);
    this.container = wrap;
    this.render();

    // const controls = new THREE.OrbitControls(camera,renderer.domElement);//创建控件对象
    // controls.addEventListener('change', render);
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
  };
}

export default Model;
