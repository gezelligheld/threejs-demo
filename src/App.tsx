import { useMemo, useRef, useEffect } from 'react';
import { Slider, Form, FormProps, Checkbox } from 'antd';
import Model from './model';
import { CAMERA_POSITION } from './constants';
import './App.css';

function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const model = useMemo(() => new Model(), []);

  const handleCameraChange: FormProps['onFieldsChange'] = (_, allFields) => {
    const data = allFields.reduce(
      (res, item) =>
        Object.assign(res, {
          [(item.name as unknown as string[])[0]]:
            item.value === undefined ? 0 : item.value,
        }),
      {} as { x: number; y: number; z: number }
    );
    model.moveCamera(data.x, data.y, data.z);
  };

  const handleLightChange: FormProps['onFieldsChange'] = (_, allFields) => {
    const data = allFields.reduce(
      (res, item) =>
        Object.assign(res, {
          [(item.name as unknown as string[])[0]]:
            item.value === undefined ? 0 : item.value,
        }),
      {} as { x: number; y: number; z: number }
    );
    model.movePointLight(data.x, data.y, data.z);
  };

  useEffect(() => {
    model.init({ wrap: containerRef.current });
    return () => {
      model.destroy();
    };
  }, [model]);

  return (
    <div className="container" ref={containerRef}>
      <div className="control">
        <Form
          onFieldsChange={handleCameraChange}
          initialValues={CAMERA_POSITION}
        >
          <div>相机</div>
          <Form.Item label="x" name="x">
            <Slider min={0} max={1000} />
          </Form.Item>
          <Form.Item label="y" name="y">
            <Slider min={0} max={1000} />
          </Form.Item>
          <Form.Item label="z" name="z">
            <Slider min={0} max={1000} />
          </Form.Item>
          <Form.Item label="自动旋转" name="rotate" valuePropName="checked">
            <Checkbox />
          </Form.Item>
        </Form>
        <Form
          onFieldsChange={handleLightChange}
          initialValues={CAMERA_POSITION}
        >
          <div>点光源</div>
          <Form.Item label="x" name="x">
            <Slider min={0} max={1000} />
          </Form.Item>
          <Form.Item label="y" name="y">
            <Slider min={0} max={1000} />
          </Form.Item>
          <Form.Item label="z" name="z">
            <Slider min={0} max={1000} />
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

export default App;
