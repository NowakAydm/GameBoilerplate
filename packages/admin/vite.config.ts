
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      three: path.resolve(__dirname, '../../node_modules/three'),
    },
  },
  server: {
    host: 'localhost', // old IP (default)
    port: 3002 // static port
  }
});
