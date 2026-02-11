# Elysia 教育平台 - 学生端Web系统

## 📋 项目概述

基于Vue3 + Vite + Element Plus开发的编程教育智能助教系统学生端Web页面，提供完整的学习、作业、考试、AI辅导等功能。

## 🎨 设计特点

### 视觉风格
- **主色调**：清新浅蓝 (#409eff) + 白色背景
- **辅助色**：浅绿（成功）、浅橙（提醒）、浅红（警示）
- **设计理念**：清新易用，符合学习类产品的视觉体验

### 交互规范
- 所有操作都有即时反馈（loading状态、成功/失败提示）
- 页面跳转流畅无卡顿
- 支持响应式布局（适配1366px及以上主流屏幕）

## 📁 项目结构

```
src/
├── views/
│   └── student/              # 学生端页面
│       ├── Dashboard.vue     # 学生首页（核心入口）
│       ├── AIChat.vue        # AI对话界面
│       ├── CourseStudy.vue   # 课程学习页面
│       ├── TaskComplete.vue  # 任务完成页面
│       ├── WrongBook.vue     # 错题本页面
│       ├── StudentProfile.vue # 个人信息中心
│       ├── SessionCollection.vue # 会话收藏页面
│       └── StudyPlan.vue     # AI学习方案页面
├── router/
│   └── index.js              # 路由配置（已添加学生端路由）
├── styles/
│   └── student.css           # 学生端专用样式
└── main.js                   # 应用入口（已引入学生端样式）
```

## 🚀 核心功能

### 1. 学生首页 (Dashboard.vue)
**路由**: `/student/dashboard`

**功能模块**：
- **顶部导航栏**：面包屑导航 + "我的"入口
- **欢迎语区域**：根据时间自适应显示问候语
- **Tab切换区**：
  - 待办事项Tab：展示未完成的讨论/作业/考试
  - 班级公告Tab：展示班级公告列表
  - 系统公告Tab：展示系统公告列表
- **快捷入口区**：5个卡片式按钮
  - AI对话
  - 课程学习
  - 错题本
  - 我的收藏
  - 学习方案

**跳转逻辑**：
- 点击待办事项"去完成" → 跳转至任务完成页面
- 点击快捷入口 → 跳转至对应功能页面
- 点击"我的" → 跳转至个人信息中心

### 2. AI对话界面 (AIChat.vue)
**路由**: `/student/ai-chat`

**功能模块**：
- **左侧会话管理栏**：
  - 新会话按钮
  - 历史会话列表（支持关键词搜索）
- **顶部功能区**：
  - 模型选择（deepseek/doubao/qwen/gemini3）
  - 联网搜索开关
  - 深度思考开关
- **中间对话区**：
  - 自适应欢迎语
  - 对话气泡式展示
  - 支持Markdown格式
- **底部输入区**：
  - 多行文本输入
  - 文件上传（支持图片/PDF/Word，OCR识别）
  - 发送按钮
- **右侧功能栏**：
  - 收藏会话
  - 导出会话（Markdown/文本格式）
  - 生成/修改标题

**特殊功能**：
- 从任务完成页面跳转时，自动携带题目信息填充至输入框

### 3. 课程学习页面 (CourseStudy.vue)
**路由**: `/student/course`

**功能模块**：
- **左侧课程目录**：树形结构展示章节（支持视频/PDF/Word）
- **右侧学习区**：
  - 视频播放器（支持进度跟踪）
  - 文档预览（PDF/Word在线预览）
- **功能按钮区**：
  - AI章节总结（弹窗展示，支持下载）
  - 生成知识网络图（ECharts可视化）
  - 生成学习/复习方案

**跳转逻辑**：
- 点击"生成学习/复习方案" → 跳转至学习方案页面（携带章节信息）

### 4. 任务完成页面 (TaskComplete.vue)
**路由**: `/student/task`

**功能模块**：
- **题目展示区**：
  - 题目内容（支持文本/图片）
  - 任务类型标签（讨论/作业/考试）
  - 截止日期提醒
  - 题目信息（科目、教师、分值）
- **答题区**：
  - 多行文本输入框
  - 字数统计
  - 保存草稿按钮
  - 提交答案按钮
- **AI问询按钮**：快速跳转至AI对话

**交互逻辑**：
- 草稿自动保存至localStorage
- 提交前弹出确认弹窗
- 提交成功后跳转回首页

### 5. 错题本页面 (WrongBook.vue)
**路由**: `/student/wrong-book`

**功能模块**：
- **左侧错题列表**：
  - 筛选器（按科目/章节）
  - 错题卡片（含错误原因）
  - 查看详情/取消收藏按钮
  - 分享至班级按钮
- **右侧AI分析**：
  - 错题统计（总数/涉及科目/涉及章节）
  - 薄弱知识点分析
  - 改进建议

**跳转逻辑**：
- 点击"查看详情" → 跳转至任务完成页面（标注"错题"标签）

### 6. 个人信息中心 (StudentProfile.vue)
**路由**: `/student/profile`

**功能模块**：
- **基本信息Tab**：修改姓名/邮箱/专业/年级/兴趣爱好
- **学习进度Tab**：展示学习统计数据
  - 已完成课程数
  - 已完成作业数
  - AI对话次数
  - 学习时长
- **安全设置Tab**：修改密码
- **退出登录按钮**

### 7. 会话收藏页面 (SessionCollection.vue)
**路由**: `/student/collection`

**功能模块**：
- 分类标签切换
- 收藏的会话列表
- 编辑分类功能
- 查看/取消收藏按钮

### 8. AI学习方案页面 (StudyPlan.vue)
**路由**: `/student/study-plan`

**功能模块**：
- 学习目标列表
- 时间安排（时间轴展示）
- 学习资源推荐
- 学习建议
- 下载方案按钮（Markdown格式）

## 🔧 技术实现

### 核心技术栈
- **框架**：Vue 3 (Composition API)
- **构建工具**：Vite
- **UI组件库**：Element Plus
- **路由**：Vue Router 4
- **图表库**：ECharts 5
- **样式**：SCSS + CSS3

### 关键特性
1. **响应式设计**：支持1366px及以上屏幕，兼顾笔记本/台式机
2. **组件化开发**：每个页面独立组件，便于维护
3. **路由守卫**：统一的权限验证和角色检查
4. **状态管理**：使用localStorage存储用户信息和草稿
5. **错误处理**：统一的错误提示和异常处理
6. **加载状态**：所有异步操作都有loading反馈

### 代码规范
- 使用Composition API编写组件
- 所有关键逻辑添加中文注释
- 遵循Vue 3最佳实践
- 统一的代码风格和命名规范

## 📝 使用说明

### 开发环境启动

```bash
# 进入项目目录
cd /Users/sylvainyang/project/elysia/elysia-frontend/web-frontend

# 安装依赖（如果还没安装）
npm install

# 启动开发服务器
npm run dev

# 或使用启动脚本
./start.sh
```

### 访问地址
- 开发环境：http://localhost:5173
- 学生端首页：http://localhost:5173/student/dashboard

### 测试账号
```
用户类型：student
用户名：student001
密码：123456
```

## 🎯 页面跳转流程图

```
学生首页 (Dashboard)
├── AI对话 (AIChat)
│   └── 返回首页
├── 课程学习 (CourseStudy)
│   ├── AI学习方案 (StudyPlan)
│   │   └── 返回课程学习
│   └── 返回首页
├── 任务完成 (TaskComplete)
│   ├── AI问询 → AI对话 (携带题目信息)
│   └── 提交后返回首页
├── 错题本 (WrongBook)
│   ├── 查看详情 → 任务完成 (标注错题)
│   └── 返回首页
├── 我的收藏 (SessionCollection)
│   ├── 查看会话 → AI对话
│   └── 返回首页
├── 学习方案 (StudyPlan)
│   └── 返回首页
└── 个人信息中心 (StudentProfile)
    ├── 退出登录 → 角色选择页
    └── 返回首页
```

## 🔍 API接口说明

所有页面中标注了`TODO: 调用API`的地方需要对接后端接口：

### 学生首页
- `GET /api/student/todos` - 获取待办事项列表
- `GET /api/student/announcements/class` - 获取班级公告
- `GET /api/student/announcements/system` - 获取系统公告

### AI对话
- `GET /api/student/sessions` - 获取历史会话列表
- `GET /api/student/sessions/:id` - 获取会话详情
- `POST /api/student/chat` - 发送消息
- `POST /api/student/sessions/:id/collect` - 收藏会话
- `POST /api/student/sessions/:id/export` - 导出会话

### 课程学习
- `GET /api/student/courses/tree` - 获取课程树
- `POST /api/student/courses/summary` - 生成AI章节总结
- `POST /api/student/courses/knowledge-map` - 生成知识网络图

### 任务完成
- `GET /api/student/tasks/:id` - 获取任务详情
- `POST /api/student/tasks/:id/draft` - 保存草稿
- `POST /api/student/tasks/:id/submit` - 提交答案

### 错题本
- `GET /api/student/wrong-questions` - 获取错题列表
- `POST /api/student/wrong-questions/analyze` - 生成AI分析
- `DELETE /api/student/wrong-questions/:id` - 取消收藏

### 个人信息
- `GET /api/student/profile` - 获取个人信息
- `PUT /api/student/profile` - 更新个人信息
- `PUT /api/student/password` - 修改密码

## 🎨 样式定制

学生端使用独立的样式文件 `src/styles/student.css`，定义了：

- CSS变量（颜色、间距等）
- 通用组件样式
- 响应式布局规则
- 动画效果
- 工具类

可根据需要修改CSS变量来调整整体风格。

## 📱 响应式适配

- **桌面端** (≥1366px)：完整功能展示
- **笔记本** (1024px-1366px)：自适应布局调整
- **平板** (768px-1024px)：部分布局改为单列
- **移动端** (<768px)：基础功能支持

## ⚠️ 注意事项

1. **路由权限**：所有学生端页面都需要登录且角色为`student`
2. **数据持久化**：草稿等临时数据存储在localStorage
3. **文件上传**：需要配置文件大小限制（默认10MB）
4. **浏览器兼容**：建议使用Chrome、Edge、Firefox最新版本
5. **API对接**：所有TODO标注的地方需要对接真实API

## 🚧 待完成功能

- [ ] 实时消息推送（WebSocket）
- [ ] 离线缓存支持
- [ ] 更多AI功能（语音输入、图片识别等）
- [ ] 学习数据可视化报表
- [ ] 社交功能（班级讨论区）

## 📄 许可证

本项目为Elysia教育平台的一部分，版权所有。

## 👥 开发团队

- 前端开发：Vue3 + Element Plus
- UI设计：清新学习风格
- 交互设计：流畅易用体验

---

**最后更新时间**：2026-02-10
**版本**：v1.0.0
