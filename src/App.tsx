import { useMemo, useRef, useEffect } from 'react';
import { Form, FormProps, Checkbox } from 'antd';

import CustomSlider from './components/CustomSlider';
import Model from './model';
import { CAMERA_POSITION, EVENT_MAPS } from './constants';
import './App.css';

function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [form] = Form.useForm();

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
    model.event.on(EVENT_MAPS.OrbitControlsChange, (position) => {
      form.setFieldsValue(position);
    });
    return () => {
      model.destroy();
    };
  }, [form, model]);

  return (
    <div className="container" ref={containerRef}>
      <div className="control">
        <Form
          form={form}
          onFieldsChange={handleCameraChange}
          initialValues={CAMERA_POSITION}
        >
          <div className="title">相机</div>
          <Form.Item label="x" name="x">
            <CustomSlider min={-1000} max={1000} />
          </Form.Item>
          <Form.Item label="y" name="y">
            <CustomSlider min={-1000} max={1000} />
          </Form.Item>
          <Form.Item label="z" name="z">
            <CustomSlider min={-1000} max={1000} />
          </Form.Item>
          <Form.Item label="自动旋转" name="rotate" valuePropName="checked">
            <Checkbox
              onChange={(e) => model.toggleAutoRotate(e.target.checked)}
            />
          </Form.Item>
        </Form>
        <Form
          onFieldsChange={handleLightChange}
          initialValues={CAMERA_POSITION}
        >
          <div className="title">点光源</div>
          <Form.Item label="x" name="x">
            <CustomSlider min={-1000} max={1000} />
          </Form.Item>
          <Form.Item label="y" name="y">
            <CustomSlider min={-1000} max={1000} />
          </Form.Item>
          <Form.Item label="z" name="z">
            <CustomSlider min={-1000} max={1000} />
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

export default App;
