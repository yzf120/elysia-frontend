#!/bin/bash

echo "🎓 启动 Elysia 教育平台 - 学生端"
echo "=================================="
echo ""

# 检查node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装依赖..."
    npm install
fi

echo "🚀 启动开发服务器..."
echo ""
echo "📝 访问地址："
echo "   - 首页: http://localhost:5173"
echo "   - 学生端: http://localhost:5173/student/dashboard"
echo ""
echo "🔑 测试账号："
echo "   用户类型: student"
echo "   用户名: student001"
echo "   密码: 123456"
echo ""
echo "💡 提示：首次访问需要先登录"
echo ""

npm run dev
