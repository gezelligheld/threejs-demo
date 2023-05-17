import { useRef, useEffect, useState } from 'react';
import { Form, FormProps, Checkbox, InputNumber, Button } from 'antd';

import CustomSlider from './components/CustomSlider';
import Model from './model';
import {
  CAMERA_POSITION,
  EVENT_MAPS,
  POINT_LIGHT_POSITION,
  ANIMATION_POSITION,
} from './constants';
import './App.css';

function App() {
  const [animating, setAnimating] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<Model | null>(null);

  const [form] = Form.useForm();

  const handleCameraChange: FormProps['onFieldsChange'] = (_, allFields) => {
    const data = allFields.reduce(
      (res, item) =>
        Object.assign(res, {
          [(item.name as unknown as string[])[0]]:
            item.value === undefined ? 0 : item.value,
        }),
      {} as { x: number; y: number; z: number }
    );
    instanceRef.current?.moveCamera(data.x, data.y, data.z);
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
    instanceRef.current?.movePointLight(data.x, data.y, data.z);
  };

  const handleAnimationFinish: FormProps['onFinish'] = (values) => {
    instanceRef.current?.animate(values.x || 0, values.y || 0, values.z || 0);
  };

  useEffect(() => {
    instanceRef.current = new Model({ wrap: containerRef.current });
    instanceRef.current?.event.on(
      EVENT_MAPS.orbitControlsChange,
      (position) => {
        form.setFieldsValue(position);
      }
    );
    instanceRef.current?.event.on(EVENT_MAPS.animateStart, () => {
      setAnimating(true);
    });
    instanceRef.current?.event.on(EVENT_MAPS.animateEnd, () => {
      setAnimating(false);
    });
    return () => {
      instanceRef.current?.destroy();
    };
  }, [form]);

  return (
    <div className="container" ref={containerRef}>
      <div className="control">
        <div className="title">相机</div>
        <Form
          form={form}
          onFieldsChange={handleCameraChange}
          initialValues={CAMERA_POSITION}
        >
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
              onChange={(e) =>
                instanceRef.current?.toggleAutoRotate(e.target.checked)
              }
            />
          </Form.Item>
        </Form>
        <div className="title">点光源</div>
        <Form
          onFieldsChange={handleLightChange}
          initialValues={POINT_LIGHT_POSITION}
        >
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
        <div className="title">动画</div>
        <Form
          layout="inline"
          initialValues={ANIMATION_POSITION}
          onFinish={handleAnimationFinish}
        >
          <Form.Item label="x" name="x">
            <InputNumber width={100} min={-1000} max={1000} />
          </Form.Item>
          <Form.Item label="y" name="y">
            <InputNumber min={-1000} max={1000} />
          </Form.Item>
          <Form.Item label="z" name="z">
            <InputNumber min={-1000} max={1000} />
          </Form.Item>
          <Form.Item>
            <Button htmlType="submit" loading={animating}>
              {animating ? '运行中' : '开始'}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

export default App;
