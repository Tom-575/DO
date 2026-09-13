import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 部署到 GitHub Pages 项目站点 https://tom-575.github.io/DO/ ,
// base 必须与仓库路径一致,否则构建产物里的资源引用会指向域名根。
export default defineConfig({
  plugins: [react()],
  base: '/DO/',
  // 本机 fs 事件不可靠(编辑后 HMR 偶发不生效,供应过期模块),改用轮询监视
  server: {
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
});
