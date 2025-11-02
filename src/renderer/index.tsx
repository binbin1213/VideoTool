import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n/config'; // 初始化 i18n
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/global.scss';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

