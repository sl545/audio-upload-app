// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: 'client', // 指定 Vite 项目的根目录
  build: {
    outDir: '../client/dist', // 输出目录仍为原来
    emptyOutDir: true,
  },
  plugins: [react()],
});
