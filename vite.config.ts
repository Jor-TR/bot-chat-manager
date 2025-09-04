import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    // 打包为库模式
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'), // 入口文件
      name: 'bot-chat-manager',
      fileName: (format) => `index.${format}.js`, // 输出文件名
      formats: ['es', 'cjs', 'umd'] // 输出格式：ES模块、CommonJS、UMD
    },
    outDir: 'dist', // 输出目录
    rollupOptions: {
      // 外部依赖（不打包进库）
      external: ['react'], // 如果有依赖如 React，可添加 ['react', 'react-dom']
      output: {
        // 全局变量映射（UMD 模式下）
        globals: { react: 'React' }
      }
    },
  }
});
