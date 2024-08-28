import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd';
import ChatWidget from './components/ChatWidget/ChatWidget';
import { ChatProvider } from './contexts/ChatContext.jsx';
import { CartProvider } from './contexts/CartContext.jsx';
import { SettingsProvider } from './contexts/SettingsContext.jsx';
import { API_BASE_URL } from './config/constants';

import 'antd/dist/reset.css';

// Definujeme globální proměnnou pro API endpoint
window.REACT_APP_API_ENDPOINT = window.REACT_APP_API_ENDPOINT || API_BASE_URL;

const root = createRoot(document.getElementById('root'));
root.render(
  <ConfigProvider>
    <ChatProvider>
      <CartProvider>
        <SettingsProvider>
          <ChatWidget 
            apiEndpoint={window.REACT_APP_API_ENDPOINT}
            onAddToCart={(cart) => console.log('Added to cart:', cart)}
          />
        </SettingsProvider>
      </CartProvider>
    </ChatProvider>
  </ConfigProvider>
);