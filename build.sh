#!/bin/bash

# EPM Better 构建脚本 (支持 TypeScript)

echo "� 开始构建 EPM Better..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 错误: 未找到 Node.js，请先安装 Node.js${NC}"
    exit 1
fi

# 检查 CMake
if ! command -v cmake &> /dev/null; then
    echo -e "${RED}❌ 错误: 未找到 CMake，请先安装 CMake${NC}"
    exit 1
fi

# 安装 Node.js 依赖
echo "📦 安装 Node.js 依赖..."
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ npm 依赖安装失败${NC}"
    exit 1
fi

# 编译 TypeScript
echo "🔨 编译 TypeScript..."
npm run build:ts
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ TypeScript 编译失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ TypeScript 编译完成${NC}"

# 构建 C++ 后端
echo "🔨 构建 C++ 后端..."
cd backend

# 创建构建目录
mkdir -p build
cd build

# 运行 CMake
cmake .. -DCMAKE_BUILD_TYPE=Release

# 编译
make

# 创建 Release 目录
mkdir -p Release

# 复制生成的 .node 文件
if [ -f "system_monitor.node" ]; then
    cp system_monitor.node Release/
    echo -e "${GREEN}✅ C++ 后端构建成功${NC}"
else
    echo -e "${RED}❌ C++ 后端构建失败${NC}"
    exit 1
fi

cd ../..

# 检查输出文件
echo "🔍 检查输出文件..."

if [ ! -d "dist/main" ]; then
    echo -e "${YELLOW}⚠️  警告: TypeScript 主进程编译输出不存在${NC}"
fi

if [ ! -d "dist/renderer" ]; then
    echo -e "${YELLOW}⚠️  警告: TypeScript 渲染进程编译输出不存在${NC}"
fi

if [ ! -f "backend/build/Release/system_monitor.node" ]; then
    echo -e "${YELLOW}⚠️  警告: C++ 模块未找到，将使用 Node.js 后备实现${NC}"
fi

echo ""
echo -e "${GREEN}🎉 构建完成！${NC}"
echo ""
echo "运行应用:"
echo "  npm start       # 生产模式"
echo "  npm run dev     # 开发模式"
echo ""
echo "其他命令:"
echo "  npm run watch   # 监听 TypeScript 变化"
echo "  npm run clean   # 清理编译输出"

echo "✅ 构建完成！"
echo ""
echo "运行以下命令启动应用:"
echo "  npm start"
