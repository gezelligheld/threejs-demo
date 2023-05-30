import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import App from './pages/keli';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <ConfigProvider componentSize="small">
    <App />
  </ConfigProvider>
);
