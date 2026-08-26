import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { warnConsole } from './lib/consoleGuard';
import './index.css';

warnConsole();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
