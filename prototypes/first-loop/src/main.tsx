import { createRoot } from 'react-dom/client';
import './styles.css';
import { StoreProvider } from './store/store';
import App from './App';

createRoot(document.getElementById('app')!).render(
  <StoreProvider>
    <App />
  </StoreProvider>,
);
