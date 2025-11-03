/// <reference types="vite/client" />

// 支持导入 .ass 文件为原始文本
declare module '*.ass?raw' {
  const content: string;
  export default content;
}

