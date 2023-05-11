import { useMemo, useRef, useEffect } from 'react';
import { Slider, Form, FormProps } from 'antd';
import Model from './model';
import { CAMERA_POSITION } from './constants';
import './App.css';

function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const model = useMemo(() => new Model(), []);

  const handleFieldsChange: FormProps['onFieldsChange'] = (_, allFields) => {
    const data = allFields.reduce(
      (res, item) =>
        Object.assign(res, {
          [(item.name as unknown as string[])[0]]: item.value || 0,
        }),
      {} as { x: number; y: number; z: number }
    );
    model.moveCamera(data.x, data.y, data.z);
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
          onFieldsChange={handleFieldsChange}
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
        </Form>
      </div>
    </div>
  );
}

export default App;
