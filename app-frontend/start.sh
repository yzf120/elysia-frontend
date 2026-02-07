#!/bin/bash

echo "🚀 启动 Elysia 教育平台移动端前端..."
echo "========================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未安装 Node.js，请先安装 Node.js"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"
echo "✅ npm 版本: $(npm -v)"
echo ""

# 检查后端服务
echo "📡 检查后端服务..."
if curl -s http://localhost:8001 > /dev/null 2>&1; then
    echo "✅ 后端服务正常运行 (http://localhost:8001)"
else
    echo "⚠️  后端服务未运行，请先启动后端服务"
    echo "   cd /Users/sylvainyang/project/elysia/elysia-backend"
    echo "   go run main.go"
    echo ""
fi

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
    echo ""
fi

# 启动开发服务器
echo "🎯 启动开发服务器..."
echo "   访问地址：http://localhost:3001"
echo "   按 Ctrl+C 停止服务"
echo ""
echo "⚠️  如果直接跳转到管理员面板，请清除浏览器缓存："
echo "   在浏览器控制台执行: localStorage.clear(); location.reload();"
echo ""

npm run dev
