import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initPersonalization } from './utils/personalization';
import './index.css';
import './styles/editor-standard.css';
import './styles/products-directory.css';

initPersonalization();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
