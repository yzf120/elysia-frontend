#!/bin/bash

echo "🚀 启动 Elysia 教育平台前端（调试模式）..."
echo ""

# 检查后端服务是否运行
echo "📡 检查后端服务..."
if curl -s http://localhost:8001/api > /dev/null 2>&1; then
    echo "✅ 后端服务正常运行 (http://localhost:8001)"
else
    echo "⚠️  警告: 后端服务未启动 (http://localhost:8001)"
    echo "   请先启动后端服务，否则登录功能将无法使用"
fi
echo ""

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
    echo ""
fi

# 检查关键文件
echo "🔍 检查关键文件..."
files=(
    "src/index.html"
    "src/main.js"
    "src/styles/global.css"
    "src/services/index.js"
    "src/components/AdminAuth.js"
    "src/components/StudentAuth.js"
    "src/components/TeacherAuth.js"
    "vite.config.js"
)

all_files_exist=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (缺失)"
        all_files_exist=false
    fi
done
echo ""

if [ "$all_files_exist" = false ]; then
    echo "❌ 有文件缺失，请检查项目结构"
    exit 1
fi

# 清理旧的进程
echo "🧹 清理旧的进程..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
echo ""

# 启动开发服务器
echo "✅ 启动前端开发服务器..."
echo "   访问地址: http://localhost:3000"
echo "   按 Ctrl+C 停止服务"
echo ""
echo "📝 如果浏览器显示空白页面，请："
echo "   1. 打开浏览器开发者工具 (F12)"
echo "   2. 查看 Console 面板的错误信息"
echo "   3. 查看 Network 面板的请求状态"
echo ""

npm run dev
