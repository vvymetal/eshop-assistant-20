import React from 'react';
import ReactDOM from 'react-dom';
import { ConfigProvider } from 'antd';
import ChatWidget from './ChatWidget';

// Nový způsob importu stylů
import 'antd/dist/reset.css';

ReactDOM.render(
  <ConfigProvider>
    <ChatWidget 
      apiEndpoint="http://localhost:8000/chat" 
      onAddToCart={(cart) => console.log('Added to cart:', cart)}
    />
  </ConfigProvider>,
  document.getElementById('root')
);