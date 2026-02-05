#!/bin/bash

echo "🔍 验证文件修复情况..."
echo ""

# 检查文件是否存在
echo "📁 检查文件是否存在："
files=(
  "src/main.js"
  "src/components/AdminAuth.js"
  "src/components/StudentAuth.js"
  "src/components/TeacherAuth.js"
  "src/api/index.js"
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

# 检查 main.js
echo ""
echo "📄 main.js:"
grep "^import.*from" src/main.js | head -3

# 检查 AdminAuth.js
echo ""
echo "📄 AdminAuth.js:"
grep "^import.*from" src/components/AdminAuth.js

# 检查 StudentAuth.js
echo ""
echo "📄 StudentAuth.js:"
grep "^import.*from" src/components/StudentAuth.js

# 检查 TeacherAuth.js
echo ""
echo "📄 TeacherAuth.js:"
grep "^import.*from" src/components/TeacherAuth.js

echo ""
echo "✅ 验证完成！"
echo ""
echo "📝 所有导入路径应该使用绝对路径（以 / 开头）"
echo "   例如：import { adminAPI } from '/api/index.js';"
echo ""
