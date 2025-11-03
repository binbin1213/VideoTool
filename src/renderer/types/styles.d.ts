declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.scss';
declare module '*.css';

// 支持导入 .ass 文件为原始文本（用于字幕样式模板）
declare module '*.ass?raw' {
  const content: string;
  export default content;
}


