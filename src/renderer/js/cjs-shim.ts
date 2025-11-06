/**
 * Renderer 端 CommonJS 兼容层，确保 tsc 输出的 CommonJS
 * 代码在浏览器环境可运行。
 */
const globalScope = globalThis as unknown as {
  exports?: Record<string, unknown>;
  module?: {exports?: Record<string, unknown>};
};

if (typeof globalScope.exports === 'undefined') {
  globalScope.exports = {};
}

if (typeof globalScope.module === 'undefined') {
  globalScope.module = {exports: globalScope.exports};
} else if (typeof globalScope.module.exports === 'undefined') {
  globalScope.module.exports = globalScope.exports;
}
