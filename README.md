# EPM Better - 高性能系统监视器

一个使用 Electron、TypeScript 和 C++ 构建的现代化系统性能监视器。

## 🌟 特性

- 🎨 现代化渐变UI设计，配合毛玻璃效果
- 🚀 C++后端，高性能系统监控
- 💪 TypeScript 类型安全，提升代码质量
- 🔄 前后端通过IPC分离
- 📊 实时监控CPU、内存、磁盘、网络
- 🏗️ MVC架构，代码清晰易维护

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
- **架构**: MVC模式
- **类型系统**: TypeScript (严格模式)

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- TypeScript >= 5.3
- CMake >= 3.15
- GCC/Clang (支持 C++17)
- Linux 开发环境

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
