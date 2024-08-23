import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/ChatWidget.jsx'),
      name: 'ChatWidget',
      fileName: (format) => `chat-widget.${format}.js`
    },
    rollupOptions: {
        external: ['react', 'react-dom', 'antd', '@ant-design/icons'],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            antd: 'antd',
            '@ant-design/icons': 'AntDesignIcons'
          }
        }
      }
  }
});