# EPM Better 开发指南

## 项目架构

### MVC 架构设计 (TypeScript + C++)

```
┌─────────────────────────────────────────────────┐
│              View (前端 - Electron)              │
│  ┌──────────────────────────────────────────┐   │
│  │  HTML/CSS (渐变UI + 毛玻璃)               │   │
│  │  TypeScript (app.ts, chart.ts)           │   │
│  │  ✅ 类型安全、接口定义                    │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                      ↕ IPC
┌─────────────────────────────────────────────────┐
│       Controller (Electron 主进程 + C++)        │
│  ┌──────────────────────────────────────────┐   │
│  │  systemMonitor.ts (IPC 桥接 - TypeScript)│   │
│  │  main.ts (主进程 - TypeScript)           │   │
│  │  MonitorController.cpp (C++ 控制器)      │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                      ↕
┌─────────────────────────────────────────────────┐
│         Model (C++ 后端 - 数据层)               │
│  ┌──────────────────────────────────────────┐   │
│  │  CPUMonitor.cpp                          │   │
│  │  MemoryMonitor.cpp                       │   │
│  │  DiskMonitor.cpp                         │   │
│  │  NetworkMonitor.cpp                      │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## 目录结构详解

```
epm_better/
├── src/
│   ├── types/                   # TypeScript 类型定义
│   │   └── global.d.ts         # 全局类型、接口定义
│   ├── main/                    # Electron 主进程 (Controller)
│   │   ├── main.ts             # 应用入口 (TypeScript)
│   │   └── ipc/
│   │       └── systemMonitor.ts # IPC 通信桥接 (TypeScript)
│   ├── renderer/                # 渲染进程 (View)
│   │   ├── index.html          # 主界面
│   │   ├── css/                # 样式文件
│   │   │   ├── style.css       # 主样式(渐变+毛玻璃)
│   │   │   └── components.css  # 组件样式
│   │   └── js/                 # TypeScript 文件
│   │       ├── app.ts          # UI 管理 (TypeScript)
│   │       ├── chart.ts        # 图表管理 (TypeScript)
│   │       └── controller.ts   # 应用控制器 (TypeScript)
│   └── preload.ts              # 预加载脚本 (TypeScript)
├── backend/                     # C++ 后端 (Model)
│   ├── include/                # 头文件
│   │   ├── models/             # 数据模型
│   │   ├── monitor/            # 监控器
│   │   └── controllers/        # 控制器
│   ├── src/                    # 源文件
│   │   ├── addon.cpp           # Node.js 插件入口
│   │   ├── models/
│   │   ├── monitor/
│   │   └── controllers/
│   └── CMakeLists.txt          # CMake 配置
├── dist/                        # TypeScript 编译输出
├── tsconfig.json               # TypeScript 配置
└── package.json
```

## 开发流程

### 1. 环境准备

```bash
# 安装依赖
npm install

# 安装 C++ 构建工具
sudo apt-get install build-essential cmake

# 确保安装了 TypeScript
npm install -g typescript
```

### 2. TypeScript 开发

```bash
# 编译 TypeScript
npm run build:ts

# 监听模式（开发时推荐）
npm run watch

# 清理编译输出
npm run clean
```

### 3. 构建项目

```bash
# 使用构建脚本
./build.sh

# 或手动构建
npm run build:cpp  # 构建 C++ 后端
npm run build:ts   # 编译 TypeScript
```

### 4. 运行开发模式

```bash
npm run dev
```

### 5. 打包应用

```bash
npm run build
```

## TypeScript 类型系统

### 全局类型定义

项目在 `src/types/global.d.ts` 中定义了完整的类型系统：

- `SystemInfo`: 系统基本信息
- `CPUInfo`: CPU 信息
- `MemoryInfo`: 内存信息
- `DiskInfo`: 磁盘信息
- `NetworkInterface`: 网络接口信息
- `MonitoringData`: 监控数据
- `ElectronAPI`: Electron API 接口

### 严格模式

项目启用了 TypeScript 严格模式，包括：

- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `noUnusedLocals: true`
- `noImplicitReturns: true`

## 核心组件说明

### View 层 (前端)

#### 1. UI Manager (`app.js`)

- 负责更新所有UI元素
- 格式化数据显示
- 处理进度环动画

#### 2. Chart Manager (`chart.js`)

- 绘制实时监控图表
- Canvas 渲染
- 数据点管理

#### 3. App Controller (`controller.js`)

- 协调 View 和 Model
- 处理用户交互
- 管理监控状态

### Controller 层

#### 1. Electron IPC (`systemMonitor.js`)

- 加载 C++ 原生模块
- 提供 Node.js 后备实现
- 管理监控定时器

#### 2. C++ Controller (`MonitorController.cpp`)

- 统一的数据获取接口
- 数据格式转换 (C++ ↔ JavaScript)
- 错误处理

### Model 层 (C++ 后端)

#### 1. CPU Monitor

- 读取 `/proc/stat` 计算 CPU 使用率
- 获取 CPU 温度、频率、型号
- 多核心支持

#### 2. Memory Monitor

- 使用 `sysinfo` 获取内存信息
- 计算使用率

#### 3. Disk Monitor

- 遍历挂载点
- 使用 `statvfs` 获取磁盘状态

#### 4. Network Monitor

- 读取网络接口信息
- 统计网络流量

## 数据流

### 启动监控流程

```
1. 用户点击 "开始监控"
   ↓
2. controller.js 调用 electronAPI.startMonitoring()
   ↓
3. main.js 接收 IPC 消息
   ↓
4. systemMonitor.js 启动定时器
   ↓
5. 调用 C++ 原生模块获取数据
   ↓
6. MonitorController 协调各个 Monitor
   ↓
7. 数据通过 IPC 发送回渲染进程
   ↓
8. UIManager 更新界面
   ↓
9. ChartManager 更新图表
```

## UI 设计特点

### 渐变色方案

```css
--gradient-1: linear-gradient(135deg, #667eea 0%, #764ba2 100%); /* 紫色 */
--gradient-2: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); /* 粉红 */
--gradient-3: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); /* 蓝色 */
--gradient-4: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); /* 绿色 */
```

### 毛玻璃效果

```css
backdrop-filter: blur(20px);
background: rgba(255, 255, 255, 0.05);
border: 1px solid rgba(255, 255, 255, 0.1);
```

### 动画背景

- 3个漂浮的渐变球体
- 使用 `filter: blur()` 创建光晕效果
- 无限循环动画

## 性能优化

1. **C++ 后端**: 高性能系统调用
2. **数据缓存**: 避免频繁读取系统文件
3. **Canvas 优化**: 使用 requestAnimationFrame
4. **IPC 节流**: 控制数据传输频率

## 调试技巧

### 查看 C++ 模块是否加载成功

```javascript
console.log(this.nativeMonitor); // 应该有值
```

### 查看 IPC 通信

在开发者工具中查看 Console 输出

### 检查 C++ 编译错误

```bash
cd backend/build
cmake .. -DCMAKE_BUILD_TYPE=Debug
make VERBOSE=1
```

## 常见问题

### Q: C++ 模块加载失败

A: 检查是否已运行 `npm run build:cpp`，确保 `backend/build/Release/system_monitor.node` 存在

### Q: 监控数据不更新

A: 检查监控是否已启动，查看 Console 是否有错误信息

### Q: UI 显示异常

A: 清除浏览器缓存，重启应用

## 扩展功能

可以添加的功能：

- [ ] 历史数据记录
- [ ] 性能警报
- [ ] 进程管理
- [ ] 自定义主题
- [ ] 多语言支持
- [ ] 系统通知

## 许可证

MIT License
