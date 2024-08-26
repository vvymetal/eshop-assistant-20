import React from 'react';
import { createRoot } from 'react-dom/client';
import ChatWidget from '../src/ChatWidget'; // Upravte cestu podle vaší struktury projektu

// Tato funkce může být volána pro renderování ChatWidget komponenty
export function renderChatWidget(containerId, props) {
  const container = document.getElementById(containerId);
  if (container) {
    const root = createRoot(container);
    root.render(<ChatWidget {...props} />);
  } else {
    console.error(`Container with id "${containerId}" not found`);
  }
}

// Exportujeme také samotnou komponentu pro případné použití v jiných React aplikacích
export { default as ChatWidget } from '../src/ChatWidget';