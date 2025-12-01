# EPM Better - 高性能系统监视器

一个使用 Electron、TypeScript 和 C++ 构建的现代化系统性能监视器。

## 🌟 特性

- 🎨 现代化渐变 UI 设计，配合毛玻璃效果
- 🚀 C++后端，高性能系统监控
- 💪 TypeScript 类型安全，提升代码质量
- 🔄 前后端通过 IPC 分离
- 📊 实时监控 CPU、内存、磁盘、网络
- 🏗️ MVC 架构，代码清晰易维护

## 📁 项目结构

```
epm_better/
├── backend/              # C++ 后端服务
│   ├── src/             # C++ 源代码
│   │   ├── monitor/     # 监控模块
│   │   ├── models/      # 数据模型
│   │   └── controllers/ # 控制器
│   ├── include/         # 头文件
│   └── CMakeLists.txt   # CMake 配置
├── src/
│   ├── types/           # TypeScript 类型定义
│   │   └── global.d.ts  # 全局类型
│   ├── main/            # Electron 主进程
│   │   ├── main.ts      # 主进程入口 (TypeScript)
│   │   └── ipc/         # IPC 通信
│   │       └── systemMonitor.ts  # 系统监控器 (TypeScript)
│   ├── renderer/        # 渲染进程（前端）
│   │   ├── index.html   # 主页面
│   │   ├── js/          # TypeScript 文件
│   │   │   ├── app.ts   # UI 管理器
│   │   │   ├── chart.ts # 图表管理器
│   │   │   └── controller.ts # 应用控制器
│   │   └── css/         # 样式表
│   └── preload.ts       # 预加载脚本 (TypeScript)
├── dist/                # TypeScript 编译输出
├── assets/              # 资源文件
├── tsconfig.json        # TypeScript 配置
└── package.json
```

## 🔧 技术栈

- **前端**: Electron, HTML5, CSS3, TypeScript
- **后端**: Modern C++ (C++17), CMake
- **通信**: Node.js N-API, IPC
- **架构**: MVC 模式
- **类型系统**: TypeScript (严格模式)

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- TypeScript >= 5.3
- CMake >= 3.15
- GCC/Clang/MSVC (支持 C++17 以上)
- Linux/MacOS 开发环境(推荐), Windows 需安装适当的编译工具链

### 安装依赖

```bash
npm install
```

### 构建项目

```bash
# 构建 TypeScript 代码
npm run build:ts

# 构建 C++ 后端
npm run build:cpp

# 构建完整应用
npm run build
```

### 运行应用

```bash
npm start
```

### 开发模式

```bash
# 开发模式（自动编译 TypeScript）
npm run dev

# 监听 TypeScript 变化
npm run watch
```

## 📖 架构说明

### MVC 架构

- **Model (模型)**: C++ 实现的系统数据采集和处理
- **View (视图)**: Electron 渲染进程中的 UI 界面
- **Controller (控制器)**: C++ 控制器 + Electron IPC 桥接

### IPC 通信流程

```
Renderer Process (View)
    ↓ (IPC Request)
Main Process (Controller)
    ↓ (N-API)
C++ Backend (Model)
    ↓ (Data)
Main Process
    ↓ (IPC Response)
Renderer Process (Update UI)
```

## 📊 监控功能

- ✅ CPU 使用率和温度
- ✅ 内存使用情况
- ✅ 磁盘读写速度
- ✅ 网络流量统计
- ✅ 进程列表和管理

## 🎨 UI 设计

- 渐变色背景
- 毛玻璃效果（backdrop-filter）
- 流畅的动画过渡
- 响应式布局
- 深色主题

## 📝 许可证

MIT License




# Vue 3 重构说明

## 重构概览

本项目已从原生 TypeScript + DOM 操作重构为 **Vue 3 + Ant Design Vue** 架构，同时保持了原有的样式和功能。

## 技术栈

- **前端框架**: Vue 3 (Composition API)
- **UI 组件库**: Ant Design Vue 4.x
- **构建工具**: Vite 5.x
- **类型系统**: TypeScript 5.x
- **桌面框架**: Electron 28.x
- **C++ 插件**: Node-GYP (原生系统监控)

## 项目结构

```
src/
├── main/                    # Electron 主进程
│   ├── main.ts
│   └── ipc/
│       └── systemMonitor.ts
├── preload.ts              # Electron 预加载脚本
├── renderer/               # Vue 渲染进程 (新增)
│   ├── main.ts            # Vue 应用入口
│   ├── App.vue            # 根组件
│   ├── components/        # Vue 组件
│   │   ├── HeaderComponent.vue
│   │   ├── CpuMonitor.vue
│   │   ├── MemoryMonitor.vue
│   │   ├── DiskMonitor.vue
│   │   ├── NetworkMonitor.vue
│   │   ├── ProcessList.vue
│   │   ├── ChartComponent.vue
│   │   └── FooterComponent.vue
│   ├── composables/       # Vue Composables
│   │   ├── useMonitor.ts  # 监控逻辑
│   │   └── useChart.ts    # 图表逻辑
│   ├── utils/             # 工具函数
│   │   └── format.ts
│   ├── css/               # 样式文件 (保持原有)
│   │   ├── style.css
│   │   └── components.css
│   ├── index.html         # HTML 入口
│   └── env.d.ts          # TypeScript 类型声明
├── types/                 # 全局类型定义
│   └── global.d.ts
└── backend/              # C++ 原生模块 (保持不变)
```

## 组件说明

### 1. App.vue (根组件)
- 管理整体布局结构
- 协调各子组件通信
- 集成监控逻辑

### 2. HeaderComponent.vue
- 显示系统信息
- 控制按钮 (开始/停止监控, AI分析)
- 响应式状态管理

### 3. CpuMonitor.vue
- CPU 使用率圆环进度条
- 核心数、频率、型号、温度信息
- 动态颜色变化 (根据使用率)

### 4. MemoryMonitor.vue
- 内存使用率圆环进度条
- 总计、已用、可用内存信息
- 响应式数据更新

### 5. DiskMonitor.vue
- 磁盘列表展示
- 进度条显示使用率
- 容量信息格式化

### 6. NetworkMonitor.vue
- 网络接口列表
- 上传/下载速度实时显示
- MAC 地址和 IP 信息

### 7. ProcessList.vue
- 进程列表 (按 CPU 使用率排序)
- 显示 PID、进程名、CPU、内存
- 限制显示前 50 个进程

### 8. ChartComponent.vue
- 实时监控图表 (Canvas)
- CPU 和内存使用率曲线
- 时间轴和图例

### 9. FooterComponent.vue
- 系统运行时间
- 更新间隔
- 监控状态

## Composables 说明

### useMonitor.ts
负责所有监控相关的逻辑:
- 系统信息加载
- 监控数据获取和更新
- 进程列表轮询
- 监控开始/停止控制
- 与 Electron IPC 通信

### useChart.ts
负责图表渲染逻辑:
- Canvas 初始化和缩放
- 数据点添加和管理
- 网格、坐标轴、图例绘制
- 实时动画更新
- 响应式窗口调整

## 安装依赖

```bash
npm install
```

## 开发模式

```bash
# 启动开发服务器 (Vite + Electron)
npm run dev
```

这将:
1. 编译 C++ 后端模块
2. 启动 Vite 开发服务器 (端口 5173)
3. 编译主进程 TypeScript
4. 启动 Electron 窗口

## 构建生产版本

```bash
# 构建所有模块
npm run build

# 构建 Linux 版本
npm run build:linux

# 构建 Windows 版本
npm run build:windows

# 构建 macOS 版本
npm run build:mac
```

## 样式保持

重构过程中完全保留了原有的样式系统:

- ✅ 玻璃态效果 (Glassmorphism)
- ✅ 渐变色主题
- ✅ 动画背景 (渐变球体)
- ✅ 圆环进度条
- ✅ 卡片布局
- ✅ 响应式设计
- ✅ 滚动条样式
- ✅ 动画过渡效果

## 主要改进

### 1. 组件化架构
- 原有的 DOM 操作分散在多个 TS 文件中
- 现在每个功能模块都是独立的 Vue 组件
- 更好的代码组织和复用性

### 2. 响应式数据流
- 原有的手动 DOM 更新
- 现在使用 Vue 的响应式系统自动更新
- 减少手动操作和潜在 bug

### 3. 类型安全
- 完整的 TypeScript 类型定义
- Props 和 Emits 的类型约束
- 更好的 IDE 支持和错误检查

### 4. Composition API
- 使用 Composables 封装逻辑
- 代码更模块化和可测试
- 更好的逻辑复用

### 5. Vite 构建
- 比 tsc 更快的开发体验
- 热模块替换 (HMR)
- 优化的生产构建

## 配置文件

### vite.config.ts
配置 Vite 构建渲染进程:
- Vue 插件
- 路径别名 (@, @types)
- 输出目录 (dist/renderer)

### tsconfig.json
渲染进程的 TypeScript 配置:
- ESNext 模块系统
- Vue JSX 支持
- 路径映射

### tsconfig.main.json
主进程的 TypeScript 配置:
- CommonJS 模块系统
- Node.js 环境
- 不包含渲染进程文件

## 注意事项

1. **C++ 模块**: 后端 C++ 监控模块保持不变，仍通过 Node-GYP 编译
2. **Electron API**: `window.electronAPI` 通过 preload 脚本暴露，在 Vue 组件中可直接使用
3. **样式隔离**: 组件使用 `scoped` 样式，全局样式在 main.ts 中导入
4. **类型定义**: 全局类型在 `src/types/global.d.ts` 中定义

## 开发建议

1. **添加新功能**: 创建新的 Vue 组件和 Composable
2. **修改样式**: 在对应组件的 `<style scoped>` 中修改，或更新全局 CSS
3. **数据流**: 通过 props 传递数据，通过 emits 触发事件
4. **状态管理**: 如果需要复杂状态管理，可以引入 Pinia

## 常见问题

### Q: 如何调试 Vue 组件?
A: 安装 Vue DevTools 浏览器扩展，或使用 `console.log` 和浏览器开发工具

### Q: 如何添加 Ant Design Vue 组件?
A: 已全局注册，可直接在组件中使用，如 `<a-button>`, `<a-table>` 等

### Q: 为什么有两个 tsconfig?
A: 主进程和渲染进程使用不同的模块系统和构建工具，需要分开配置

### Q: 样式没有生效?
A: 确保在 main.ts 中导入了 CSS 文件，并检查 scoped 样式的作用域

## 迁移检查清单

- ✅ 依赖更新 (Vue, Vite, Ant Design Vue)
- ✅ 配置文件 (vite.config.ts, tsconfig)
- ✅ HTML 入口简化
- ✅ Vue 主应用创建
- ✅ Composables 逻辑封装
- ✅ 所有功能组件创建
- ✅ 样式文件保留
- ✅ 类型定义完善
- ✅ 构建脚本更新

## 下一步

项目已完成 Vue 3 重构，可以开始:
1. 运行 `npm install` 安装依赖
2. 运行 `npm run dev` 启动开发模式
3. 测试所有功能是否正常
4. 根据需要添加更多功能

## 技术支持

如有问题，请检查:
- Node.js 版本 >= 18
- npm 版本 >= 9
- 系统已安装 node-gyp 所需的编译工具
