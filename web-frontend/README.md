# Elysia 教育平台 - Web 前端

这是 Elysia 教育平台的 Web 前端项目，提供学生、教师、管理员三端的登录注册功能。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

服务将在 `http://localhost:3000` 启动

### 3. 构建生产版本

```bash
npm run build
```

## 📁 项目结构

```
web-frontend/
├── src/
│   ├── api/
│   │   └── index.js          # API 服务层
│   ├── components/
│   │   ├── AdminAuth.js      # 管理员登录注册组件
│   │   ├── StudentAuth.js    # 学生登录注册组件
│   │   └── TeacherAuth.js    # 教师登录注册组件
│   ├── styles/
│   │   └── global.css        # 全局样式
│   ├── index.html            # HTML 入口
│   └── main.js               # JavaScript 入口
├── package.json
├── vite.config.js            # Vite 配置
└── README.md
```

## 🎯 功能特性

### 管理员端
- ✅ 手机号 + 密码登录
- ✅ 手机号 + 验证码登录
- ✅ 手机号 + 验证码注册（默认密码：Admin@123）

### 教师端
- ✅ 工号 + 密码登录
- ✅ 手机号 + 验证码登录
- ✅ 注册申请（需管理员审核）

### 学生端
- ✅ 学号 + 密码登录
- ✅ 手机号 + 验证码登录
- ✅ 手机号 + 学号 + 密码注册

## 🔌 后端接口对接

### API 基础地址
- 开发环境：`http://localhost:8001/api`
- 生产环境：根据实际部署配置

### 管理员接口
- `POST /admin/auth/send-code-register` - 发送注册验证码
- `POST /admin/auth/send-code-login` - 发送登录验证码
- `POST /admin/auth/register-sms` - 验证码注册
- `POST /admin/auth/login-sms` - 验证码登录
- `POST /admin/auth/login-password` - 密码登录

### 教师接口
- `POST /register` - 教师注册申请
- `POST /teacher/auth/send-code-login` - 发送登录验证码
- `POST /teacher/auth/login-sms` - 验证码登录
- `POST /teacher/auth/login-password` - 密码登录

### 学生接口
- `POST /student/auth/send-code-register` - 发送注册验证码
- `POST /student/auth/send-code-login` - 发送登录验证码
- `POST /student/auth/register-sms` - 验证码注册
- `POST /student/auth/login-sms` - 验证码登录
- `POST /student/auth/login-password` - 密码登录

## 🎨 界面设计

- 采用现代化渐变色设计（紫色主题）
- 响应式布局，支持移动端和桌面端
- 流畅的动画效果和交互体验
- 清晰的表单验证和错误提示

## 🔐 认证流程

1. 用户选择身份（管理员/教师/学生）
2. 选择登录方式（密码登录/验证码登录/注册）
3. 填写表单信息
4. 提交后获取 token 和用户信息
5. 保存到 localStorage
6. 跳转到对应的后台页面

## 📝 注意事项

1. **验证码功能**：需要后端配置短信服务才能正常使用
2. **教师注册**：需要管理员审核通过后才能登录
3. **Token 管理**：登录成功后 token 会自动保存到 localStorage
4. **跨域问题**：开发环境已配置代理，生产环境需要后端配置 CORS

## 🛠️ 技术栈

- **构建工具**：Vite
- **HTTP 客户端**：Axios
- **样式**：原生 CSS（渐变色 + 动画）
- **JavaScript**：ES6+ 模块化

## 📱 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 🤝 开发建议

1. 确保后端服务已启动（`http://localhost:8001`）
2. 使用 Chrome DevTools 查看网络请求
3. 检查 localStorage 中的 token 和 userInfo
4. 遇到问题查看浏览器控制台错误信息

## 📄 License

MIT
