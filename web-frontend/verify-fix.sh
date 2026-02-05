#!/bin/bash

echo "🔍 验证 API 路径冲突修复情况..."
echo ""

# 检查目录是否正确重命名
echo "📁 检查目录结构："
if [ -d "src/services" ]; then
  echo "  ✅ src/services/ 目录存在"
else
  echo "  ❌ src/services/ 目录不存在"
fi

if [ -d "src/api" ]; then
  echo "  ⚠️  src/api/ 目录仍然存在（应该已被重命名）"
else
  echo "  ✅ src/api/ 目录已被移除"
fi

echo ""
echo "📄 检查文件是否存在："
files=(
  "src/services/index.js"
  "src/components/AdminAuth.js"
  "src/components/StudentAuth.js"
  "src/components/TeacherAuth.js"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file (不存在)"
  fi
done

echo ""
echo "🔍 检查导入路径："

# 检查 AdminAuth.js
echo ""
echo "📄 AdminAuth.js:"
grep "^import.*from.*index.js" src/components/AdminAuth.js || echo "  ⚠️  未找到导入语句"

# 检查 StudentAuth.js
echo ""
echo "📄 StudentAuth.js:"
grep "^import.*from.*index.js" src/components/StudentAuth.js || echo "  ⚠️  未找到导入语句"

# 检查 TeacherAuth.js
echo ""
echo "📄 TeacherAuth.js:"
grep "^import.*from.*index.js" src/components/TeacherAuth.js || echo "  ⚠️  未找到导入语句"

echo ""
echo "✅ 验证完成！"
echo ""
echo "📝 所有导入路径应该使用 '/services/index.js'"
echo "   例如：import { adminAPI } from '/services/index.js';"
echo ""
echo "🚀 现在可以刷新浏览器测试了！"
echo "   访问：http://localhost:3000"
echo ""
