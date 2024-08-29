// src/demo.jsx
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd';
import ChatWidget from '../src/ChatWidget';
import { ChatProvider } from './contexts/ChatContext.jsx';
import { CartProvider } from './contexts/CartContext.jsx';
import { SettingsProvider } from './contexts/SettingsContext.jsx';
import { ChatIdProvider, useChatId } from './contexts/ChatIdContext.jsx';
import { API_BASE_URL } from './config/constants';

const AppContent = () => {
  const chatId = useChatId();

  return (
    <ChatProvider apiEndpoint={API_BASE_URL}>
      <CartProvider 
        apiEndpoint={API_BASE_URL}
        onAddToCart={(cart) => console.log('Added to cart:', cart)}
        chatId={chatId}
      >
        <SettingsProvider>
          <ChatWidget 
            apiEndpoint={API_BASE_URL}
            onAddToCart={(cart) => console.log('Added to cart:', cart)}
          />
        </SettingsProvider>
      </CartProvider>
    </ChatProvider>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(
  <ConfigProvider>
    <ChatIdProvider>
      <AppContent />
    </ChatIdProvider>
  </ConfigProvider>
);