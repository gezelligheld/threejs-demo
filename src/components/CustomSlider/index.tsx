import { Slider, SliderSingleProps } from 'antd';
import React from 'react';

import './index.css';

const CustomSlider: React.FC<SliderSingleProps> = ({
  value,
  onChange,
  ...rest
}) => {
  return (
    <div className="custom-silder">
      <Slider value={value} onChange={onChange} {...rest} />
      <span className="custom-silder-text">{value}</span>
    </div>
  );
};

export default CustomSlider;
