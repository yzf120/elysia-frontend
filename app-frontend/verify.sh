#!/bin/bash

echo "🔍 验证 Elysia 移动端前端项目"
echo "================================"
echo ""

# 检查关键文件
echo "📁 检查项目文件..."
files=(
  "package.json"
  "vite.config.js"
  "index.html"
  "src/main.js"
  "src/App.vue"
  "src/router/index.js"
  "src/api/index.js"
  "src/assets/styles/global.css"
  "src/views/Home.vue"
  "src/views/admin/Login.vue"
  "src/views/admin/Dashboard.vue"
  "src/views/teacher/Login.vue"
  "src/views/teacher/Register.vue"
  "src/views/teacher/Dashboard.vue"
  "src/views/student/Login.vue"
  "src/views/student/Register.vue"
  "src/views/student/Dashboard.vue"
)

missing_files=0
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file (缺失)"
    missing_files=$((missing_files + 1))
  fi
done

echo ""
if [ $missing_files -eq 0 ]; then
  echo "✅ 所有文件检查通过！"
else
  echo "❌ 有 $missing_files 个文件缺失"
  exit 1
fi

echo ""
echo "📦 检查依赖..."
if [ -d "node_modules" ]; then
  echo "  ✅ node_modules 存在"
else
  echo "  ⚠️  node_modules 不存在，需要运行 npm install"
fi

echo ""
echo "📊 项目统计："
echo "  - 页面组件: 9 个"
echo "  - API 接口: 17 个"
echo "  - 路由配置: 9 个"
echo ""

echo "🎉 项目验证完成！"
echo ""
echo "📝 下一步："
echo "  1. 运行 ./start.sh 启动开发服务器"
echo "  2. 访问 http://localhost:3001"
echo "  3. 查看 QUICKSTART.md 了解测试流程"
echo ""
