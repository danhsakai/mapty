import { defineConfig } from 'vite';

// Tự động xử lý base path cho GitHub Pages hoặc Vercel
export default defineConfig(({ command }) => {
  // Nếu deploy trên Vercel hoặc môi trường khác, dùng root '/'
  // Nếu deploy trên GitHub Pages, dùng '/mapty/'
  const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';

  return {
    base: command === 'build' && isGitHubPages ? '/mapty/' : '/',
  };
});
