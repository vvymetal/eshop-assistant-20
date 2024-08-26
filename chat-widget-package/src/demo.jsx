import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd';
import ChatWidget from './ChatWidget';

// Nový způsob importu stylů
import 'antd/dist/reset.css';

const root = createRoot(document.getElementById('root'));
root.render(
  <ConfigProvider>
    <ChatWidget 
      apiEndpoint="http://localhost:8000/chat" 
      onAddToCart={(cart) => console.log('Added to cart:', cart)}
    />
  </ConfigProvider>
);