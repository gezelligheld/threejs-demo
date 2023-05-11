import React from 'react';

import './index.css';

const PanelCol: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="panel-box">
      <div>{title}</div>
      <div></div>
    </div>
  );
};

export default PanelCol;
