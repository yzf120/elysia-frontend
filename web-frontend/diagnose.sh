#!/bin/bash

echo "🔍 Elysia 前端诊断工具"
echo "===================="
echo ""

# 1. 检查文件结构
echo "📁 检查文件结构..."
files=(
    "src/index.html"
    "src/main.js"
    "src/styles/global.css"
    "src/api/index.js"
    "src/components/AdminAuth.js"
    "src/components/StudentAuth.js"
    "src/components/TeacherAuth.js"
    "vite.config.js"
    "package.json"
)

all_ok=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (缺失)"
        all_ok=false
    fi
done
echo ""

# 2. 检查依赖
echo "📦 检查依赖..."
if [ -d "node_modules" ]; then
    echo "  ✅ node_modules 存在"
    if [ -d "node_modules/axios" ]; then
        echo "  ✅ axios 已安装"
    else
        echo "  ❌ axios 未安装"
        all_ok=false
    fi
    if [ -d "node_modules/vite" ]; then
        echo "  ✅ vite 已安装"
    else
        echo "  ❌ vite 未安装"
        all_ok=false
    fi
else
    echo "  ❌ node_modules 不存在，需要运行 npm install"
    all_ok=false
fi
echo ""

# 3. 检查端口
echo "🔌 检查端口..."
if lsof -i:3000 > /dev/null 2>&1; then
    echo "  ⚠️  端口 3000 已被占用"
    echo "  进程信息："
    lsof -i:3000
else
    echo "  ✅ 端口 3000 可用"
fi
echo ""

# 4. 检查后端服务
echo "🌐 检查后端服务..."
if curl -s http://localhost:8001/api > /dev/null 2>&1; then
    echo "  ✅ 后端服务运行正常 (http://localhost:8001)"
else
    echo "  ⚠️  后端服务未启动 (http://localhost:8001)"
fi
echo ""

# 5. 检查 index.html 中的路径
echo "🔗 检查资源路径..."
if grep -q 'href="/styles/global.css"' src/index.html; then
    echo "  ✅ CSS 路径正确"
else
    echo "  ❌ CSS 路径错误"
    all_ok=false
fi

if grep -q 'src="/main.js"' src/index.html; then
    echo "  ✅ JS 路径正确"
else
    echo "  ❌ JS 路径错误"
    all_ok=false
fi
echo ""

# 总结
echo "===================="
if [ "$all_ok" = true ]; then
    echo "✅ 所有检查通过！"
    echo ""
    echo "🚀 可以运行以下命令启动服务："
    echo "   ./start.sh"
    echo "   或"
    echo "   npm run dev"
else
    echo "❌ 发现问题，请根据上述提示修复"
    echo ""
    echo "💡 常见修复方法："
    echo "   1. 安装依赖: npm install"
    echo "   2. 清理端口: lsof -ti:3000 | xargs kill -9"
    echo "   3. 查看详细排查指南: cat TROUBLESHOOTING.md"
fi
echo ""
