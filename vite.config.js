import { defineConfig } from 'vite';

// Dùng base cho build (GitHub Pages), giữ dev chạy ở '/'
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/mapty/' : '/',
}));

