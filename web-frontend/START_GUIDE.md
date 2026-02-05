# 🚀 快速启动和测试指南

## ✅ 问题已修复

已修复浏览器空白页面的问题，主要修复内容：

1. **修复了 DOM 加载时机问题** - 确保在 DOM 完全加载后再初始化
2. **优化了角色选择按钮样式** - 更大、更醒目的按钮设计
3. **添加了调试日志** - 方便排查问题
4. **改进了响应式布局** - 支持移动端显示

---

## 🎯 启动步骤

### 1. 确保后端服务已启动

```bash
# 在后端目录
cd /Users/sylvainyang/project/elysia/elysia-backend
go run main.go
```

后端应该运行在：`http://localhost:8001`

### 2. 启动前端服务

```bash
# 在前端目录
cd /Users/sylvainyang/project/elysia/elysia-frontend/web-frontend

# 方式一：使用启动脚本（推荐）
./start.sh

# 方式二：直接使用 npm
npm run dev
```

前端将运行在：`http://localhost:3000`

---

## 🧪 测试步骤

### 测试 1：快速测试页面

访问：`http://localhost:3000/quick-test.html`

**应该看到**：
- ✅ 紫色渐变背景
- ✅ 白色卡片容器
- ✅ 三个大的角色选择按钮（管理员、教师、学生）
- ✅ 按钮有悬停效果

**如果这个页面正常显示**，说明 Vite 服务器和基本样式都没问题。

### 测试 2：主页面

访问：`http://localhost:3000` 或 `http://localhost:3000/index.html`

**应该看到**：
- ✅ 紫色渐变背景
- ✅ "🎓 Elysia 教育平台" 标题
- ✅ "请选择您的身份" 提示
- ✅ 三个角色选择按钮

**打开浏览器控制台（F12）**，应该看到：
```
main.js 加载成功
初始化应用
当前角色参数: null
渲染角色选择页面
角色选择页面渲染完成
```

### 测试 3：选择角色

点击任意角色按钮（例如"管理员"），页面应该：
- ✅ URL 变为 `http://localhost:3000/?role=admin`
- ✅ 显示管理员登录页面
- ✅ 有三个标签：密码登录、验证码登录、注册账号
- ✅ 有表单输入框

**控制台应该显示**：
```
选择角色: admin
渲染登录页面，角色: admin
创建管理员登录组件
登录页面渲染完成
```

### 测试 4：登录功能

#### 管理员密码登录
1. 选择"密码登录"标签
2. 输入手机号：`13800138000`
3. 输入密码：`123456Admin`
4. 点击"登录"按钮

**预期结果**：
- ✅ 显示"登录成功"消息
- ✅ 保存 token 到 localStorage
- ✅ 尝试跳转到 `/admin/dashboard.html`（如果页面不存在会显示 404，这是正常的）

#### 学生密码登录
1. 访问 `http://localhost:3000/?role=student`
2. 选择"密码登录"标签
3. 输入学号和密码
4. 点击"登录"按钮

#### 教师密码登录
1. 访问 `http://localhost:3000/?role=teacher`
2. 选择"密码登录"标签
3. 输入工号和密码
4. 点击"登录"按钮

---

## 🔍 问题排查

### 问题 1：页面完全空白

**检查步骤**：

1. **打开浏览器控制台（F12）**
   - 切换到 Console 面板
   - 查看是否有错误信息

2. **检查 Network 面板**
   - 刷新页面（F5）
   - 查看所有资源是否成功加载（状态码 200）
   - 特别注意：
     - `index.html` - 200 OK
     - `main.js` - 200 OK
     - `global.css` - 200 OK

3. **检查 DOM 元素**
   - 在 Console 中输入：
     ```javascript
     document.getElementById('root')
     ```
   - 应该返回一个 div 元素

4. **访问快速测试页面**
   - `http://localhost:3000/quick-test.html`
   - 如果这个页面能正常显示，说明服务器没问题

### 问题 2：看到背景但没有内容

**可能原因**：
- JavaScript 执行出错
- 组件导入失败

**解决方案**：
1. 查看浏览器控制台的错误信息
2. 确认所有组件文件都存在：
   ```bash
   ls -la src/components/
   ```
3. 重新启动服务：
   ```bash
   lsof -ti:3000 | xargs kill -9
   npm run dev
   ```

### 问题 3：样式不正确

**解决方案**：
1. 清除浏览器缓存（Ctrl+Shift+Delete）
2. 硬刷新页面（Ctrl+Shift+R 或 Cmd+Shift+R）
3. 检查 CSS 文件是否加载：
   - Network 面板查看 `global.css` 状态

### 问题 4：点击按钮没反应

**解决方案**：
1. 查看控制台是否有 JavaScript 错误
2. 确认事件监听器已绑定：
   ```javascript
   // 在控制台输入
   document.querySelectorAll('.role-btn').length
   ```
   应该返回 3

---

## 📊 后端接口说明

### 管理员接口

| 接口 | 方法 | 说明 | 请求参数 |
|------|------|------|----------|
| `/api/admin/auth/send-code-register` | POST | 发送注册验证码 | `phone_number` |
| `/api/admin/auth/send-code-login` | POST | 发送登录验证码 | `phone_number` |
| `/api/admin/auth/register-sms` | POST | 验证码注册 | `phone_number`, `code` |
| `/api/admin/auth/login-sms` | POST | 验证码登录 | `phone_number`, `code` |
| `/api/admin/auth/login-password` | POST | 密码登录 | `phone_number`, `password` |

### 学生接口

| 接口 | 方法 | 说明 | 请求参数 |
|------|------|------|----------|
| `/api/student/auth/send-code-register` | POST | 发送注册验证码 | `phone_number` |
| `/api/student/auth/send-code-login` | POST | 发送登录验证码 | `phone_number` |
| `/api/student/auth/register-sms` | POST | 验证码注册 | `phone_number`, `code`, `student_number`, `password` |
| `/api/student/auth/login-sms` | POST | 验证码登录 | `phone_number`, `code` |
| `/api/student/auth/login-password` | POST | 密码登录 | `student_number`, `password` |

### 教师接口

| 接口 | 方法 | 说明 | 请求参数 |
|------|------|------|----------|
| `/api/register` | POST | 教师注册申请 | `name`, `phone_number`, `employee_number`, `password`, `department`, `title` |
| `/api/teacher/auth/send-code-login` | POST | 发送登录验证码 | `phone_number` |
| `/api/teacher/auth/login-sms` | POST | 验证码登录 | `phone_number`, `code` |
| `/api/teacher/auth/login-password` | POST | 密码登录 | `employee_number`, `password` |

---

## 💡 测试账号

### 管理员
- 手机号：`13800138000`
- 密码：`123456Admin`

### 学生
- 需要先注册或由管理员创建

### 教师
- 需要先注册申请，等待管理员审核

---

## 🎨 页面效果

### 角色选择页面
- 紫色渐变背景
- 白色卡片容器
- 三个大按钮，带图标和文字
- 悬停时有动画效果

### 登录页面
- 顶部有角色标识
- 三个标签切换不同登录方式
- 表单输入框有聚焦效果
- 验证码按钮有倒计时
- 提交按钮有加载状态

---

## 📝 开发者工具使用

### 查看 localStorage

```javascript
// 查看保存的 token
localStorage.getItem('token')

// 查看用户信息
JSON.parse(localStorage.getItem('userInfo'))

// 查看用户类型
localStorage.getItem('userType')

// 清除所有数据
localStorage.clear()
```

### 测试 API 调用

```javascript
// 测试管理员登录
fetch('http://localhost:8001/api/admin/auth/login-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phone_number: '13800138000',
    password: '123456Admin'
  })
})
.then(r => r.json())
.then(console.log)
```

---

## ✅ 验证清单

- [ ] 后端服务已启动（http://localhost:8001）
- [ ] 前端服务已启动（http://localhost:3000）
- [ ] 快速测试页面正常显示
- [ ] 主页面显示角色选择按钮
- [ ] 点击按钮能跳转到登录页面
- [ ] 登录表单正常显示
- [ ] 可以切换不同的登录方式
- [ ] 密码登录功能正常
- [ ] 浏览器控制台没有错误

---

**最后更新**：2026-02-05 19:57
**状态**：✅ 所有问题已修复
