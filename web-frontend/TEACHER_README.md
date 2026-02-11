[//]: # (# 教师端Web页面开发文档)

[//]: # ()
[//]: # (## 项目概述)

[//]: # ()
[//]: # (本项目为Elysia编程教育智能助教系统的教师端Web页面，基于Vue3 + Element Plus开发，提供完整的教学管理功能。)

[//]: # ()
[//]: # (## 技术栈)

[//]: # ()
[//]: # (- **前端框架**: Vue 3 &#40;Composition API&#41;)

[//]: # (- **UI组件库**: Element Plus 2.5.0)

[//]: # (- **路由管理**: Vue Router 4.2.0)

[//]: # (- **HTTP客户端**: Axios 1.6.0)

[//]: # (- **样式预处理**: Sass 1.70.0)

[//]: # (- **图表库**: ECharts 5.4.0)

[//]: # (- **Excel导出**: XLSX 0.18.0)

[//]: # (- **构建工具**: Vite 5.0.0)

[//]: # ()
[//]: # (## 目录结构)

[//]: # ()
[//]: # (```)

[//]: # (src/)

[//]: # (├── views/)

[//]: # (│   └── teacher/                    # 教师端页面)

[//]: # (│       ├── Dashboard.vue           # 教师首页)

[//]: # (│       ├── CreateClass.vue         # 创建班级)

[//]: # (│       ├── ClassDetail.vue         # 班级详情)

[//]: # (│       ├── CourseManagement.vue    # 课程章节管理)

[//]: # (│       ├── CodeReview.vue          # AI代码审核)

[//]: # (│       ├── TeacherProfile.vue      # 个人信息中心)

[//]: # (│       ├── PublishTask.vue         # 任务发布)

[//]: # (│       └── TeacherAIChat.vue       # AI对话（教师版）)

[//]: # (├── components/)

[//]: # (│   └── TeacherAuth.js              # 教师端认证组件)

[//]: # (├── styles/)

[//]: # (│   └── teacher.css                 # 教师端专用样式)

[//]: # (└── router/)

[//]: # (    └── index.js                    # 路由配置)

[//]: # (```)

[//]: # ()
[//]: # (## 核心页面功能)

[//]: # ()
[//]: # (### 1. 教师首页 &#40;Dashboard.vue&#41;)

[//]: # ()
[//]: # (**路由**: `/teacher/dashboard`)

[//]: # ()
[//]: # (**功能模块**:)

[//]: # (- **我的班级Tab**: 展示已创建班级列表，支持查看详情、删除班级)

[//]: # (- **待处理Tab**: )

[//]: # (  - 待审核学生申请（通过/拒绝）)

[//]: # (  - AI生成内容待确认)

[//]: # (- **系统公告Tab**: 展示管理员发布的系统公告)

[//]: # (- **快捷入口**: 创建班级、课程管理、AI对话、代码审核)

[//]: # ()
[//]: # (**核心功能**:)

[//]: # (```javascript)

[//]: # (// 加载班级列表)

[//]: # (const loadClassList = async &#40;&#41; => {)

[//]: # (  // TODO: 调用API获取班级列表)

[//]: # (})

[//]: # ()
[//]: # (// 审核学生申请)

[//]: # (const approveStudent = async &#40;id&#41; => {)

[//]: # (  // TODO: 调用API通过学生申请)

[//]: # (})

[//]: # (```)

[//]: # ()
[//]: # (### 2. 创建班级 &#40;CreateClass.vue&#41;)

[//]: # ()
[//]: # (**路由**: `/teacher/create-class`)

[//]: # ()
[//]: # (**功能**:)

[//]: # (- 班级名称输入)

[//]: # (- 授课科目选择（Python编程、Java编程、数据结构等）)

[//]: # (- 学期选择)

[//]: # (- 人数上限设置)

[//]: # (- 班级验证码生成（6位数字）)

[//]: # (- 表单验证和提交)

[//]: # ()
[//]: # (**表单验证规则**:)

[//]: # (```javascript)

[//]: # (const formRules = {)

[//]: # (  name: [)

[//]: # (    { required: true, message: '请输入班级名称', trigger: 'blur' },)

[//]: # (    { min: 2, max: 50, message: '班级名称长度在2-50个字符之间', trigger: 'blur' })

[//]: # (  ],)

[//]: # (  subject: [{ required: true, message: '请选择授课科目', trigger: 'change' }],)

[//]: # (  semester: [{ required: true, message: '请选择学期', trigger: 'change' }],)

[//]: # (  maxCount: [)

[//]: # (    { required: true, message: '请输入人数上限', trigger: 'blur' },)

[//]: # (    { type: 'number', min: 1, message: '人数上限至少为1', trigger: 'blur' })

[//]: # (  ])

[//]: # (})

[//]: # (```)

[//]: # ()
[//]: # (### 3. 班级详情 &#40;ClassDetail.vue&#41;)

[//]: # ()
[//]: # (**路由**: `/teacher/class/:id`)

[//]: # ()
[//]: # (**功能模块**:)

[//]: # (- **班级成员Tab**: )

[//]: # (  - 展示学生列表（姓名、学号、邮箱、加入时间）)

[//]: # (  - 支持关键词检索)

[//]: # (  - 移除学生功能)

[//]: # (- **班级公告Tab**:)

[//]: # (  - 发布新公告（标题+内容）)

[//]: # (  - 历史公告列表)

[//]: # (  - 编辑/删除公告)

[//]: # (- **任务管理Tab**:)

[//]: # (  - 发布讨论/作业/考试)

[//]: # (  - 任务列表（含完成情况）)

[//]: # (  - 查看/删除任务)

[//]: # ()
[//]: # (**核心功能**:)

[//]: # (```javascript)

[//]: # (// 发布公告)

[//]: # (const publishAnnouncement = async &#40;&#41; => {)

[//]: # (  if &#40;!announcementForm.value.title.trim&#40;&#41; || !announcementForm.value.content.trim&#40;&#41;&#41; {)

[//]: # (    ElMessage.warning&#40;'请填写完整信息'&#41;;)

[//]: # (    return;)

[//]: # (  })

[//]: # (  // TODO: 调用API发布公告)

[//]: # (})

[//]: # ()
[//]: # (// 发布任务)

[//]: # (const publishTask = &#40;type&#41; => {)

[//]: # (  router.push&#40;{)

[//]: # (    name: 'PublishTask',)

[//]: # (    query: { classId: classInfo.value.id, type })

[//]: # (  }&#41;;)

[//]: # (})

[//]: # (```)

[//]: # ()
[//]: # (### 4. 课程章节管理 &#40;CourseManagement.vue&#41;)

[//]: # ()
[//]: # (**路由**: `/teacher/course-management`)

[//]: # ()
[//]: # (**功能模块**:)

[//]: # (- **章节列表Tab**:)

[//]: # (  - 树形结构展示章节)

[//]: # (  - 区分文件类型（视频/PDF/Word）)

[//]: # (  - 新增/编辑/删除章节)

[//]: # (  - 文件上传（支持mp4/avi/pdf/doc/docx）)

[//]: # (- **AI教学资料生成Tab**:)

[//]: # (  - 知识点输入)

[//]: # (  - 生成格式选择（图片/文档）)

[//]: # (  - 生成结果预览)

[//]: # (  - 导入到对应章节)

[//]: # (- **AI出题Tab**:)

[//]: # (  - 出题场景选择（讨论/作业/考试）)

[//]: # (  - 知识点输入)

[//]: # (  - 难度选择（简单/中等/困难）)

[//]: # (  - 题目预览)

[//]: # (  - 发布至班级)

[//]: # ()
[//]: # (**AI功能示例**:)

[//]: # (```javascript)

[//]: # (// 生成教学资料)

[//]: # (const generateMaterial = async &#40;&#41; => {)

[//]: # (  if &#40;!materialForm.value.knowledge.trim&#40;&#41;&#41; {)

[//]: # (    ElMessage.warning&#40;'请输入知识点'&#41;;)

[//]: # (    return;)

[//]: # (  })

[//]: # (  generatingMaterial.value = true;)

[//]: # (  // TODO: 调用AI API生成教学资料)

[//]: # (  // 模拟生成结果)

[//]: # (  materialResult.value = '生成的教学资料内容...';)

[//]: # (  ElMessage.success&#40;'生成成功'&#41;;)

[//]: # (  generatingMaterial.value = false;)

[//]: # (})

[//]: # ()
[//]: # (// 生成题目)

[//]: # (const generateQuestion = async &#40;&#41; => {)

[//]: # (  // 验证表单)

[//]: # (  // TODO: 调用AI API生成题目)

[//]: # (  questionResult.value = [)

[//]: # (    { title: '题目1', options: ['A', 'B', 'C', 'D'], answer: 'A' })

[//]: # (  ];)

[//]: # (})

[//]: # (```)

[//]: # ()
[//]: # (### 5. AI代码审核 &#40;CodeReview.vue&#41;)

[//]: # ()
[//]: # (**路由**: `/teacher/code-review`)

[//]: # ()
[//]: # (**功能模块**:)

[//]: # (- **待审核列表Tab**:)

[//]: # (  - 展示学生提交的代码作业)

[//]: # (  - 支持按班级/时间筛选)

[//]: # (  - 批量选择)

[//]: # (  - AI自动批改)

[//]: # (- **审核结果Tab**:)

[//]: # (  - 已审核记录列表)

[//]: # (  - 查看详情)

[//]: # (- **代码审核对话框**:)

[//]: # (  - 左侧：代码展示（语法高亮）)

[//]: # (  - 右侧：AI批改结果（预估分数、错误点、修改建议）)

[//]: # (  - 手动调整分数和意见)

[//]: # (- **导出审核报告**: 导出Excel格式报告)

[//]: # ()
[//]: # (**代码审核流程**:)

[//]: # (```javascript)

[//]: # (// 审核代码)

[//]: # (const reviewCode = async &#40;item&#41; => {)

[//]: # (  currentReviewItem.value = item;)

[//]: # (  reviewDialogVisible.value = true;)

[//]: # (  )
[//]: # (  // 加载代码)

[//]: # (  currentCode.value = '学生代码内容...';)

[//]: # (  )
[//]: # (  // AI批改)

[//]: # (  aiResult.value = {)

[//]: # (    score: 85,)

[//]: # (    errors: ['错误点1', '错误点2'],)

[//]: # (    suggestions: ['建议1', '建议2'])

[//]: # (  };)

[//]: # (  )
[//]: # (  reviewForm.value.score = aiResult.value.score;)

[//]: # (})

[//]: # ()
[//]: # (// 提交审核)

[//]: # (const submitReview = async &#40;&#41; => {)

[//]: # (  // TODO: 调用API提交审核结果)

[//]: # (  ElMessage.success&#40;'审核提交成功'&#41;;)

[//]: # (  activeTab.value = 'reviewed';)

[//]: # (})

[//]: # ()
[//]: # (// 导出报告)

[//]: # (const exportReport = &#40;&#41; => {)

[//]: # (  const data = reviewedList.value.map&#40;item => &#40;{)

[//]: # (    '班级名称': item.className,)

[//]: # (    '学生姓名': item.studentName,)

[//]: # (    '分数': item.score)

[//]: # (  }&#41;&#41;;)

[//]: # (  const ws = XLSX.utils.json_to_sheet&#40;data&#41;;)

[//]: # (  const wb = XLSX.utils.book_new&#40;&#41;;)

[//]: # (  XLSX.utils.book_append_sheet&#40;wb, ws, '审核报告'&#41;;)

[//]: # (  XLSX.writeFile&#40;wb, `代码审核报告_${new Date&#40;&#41;.toISOString&#40;&#41;.split&#40;'T'&#41;[0]}.xlsx`&#41;;)

[//]: # (})

[//]: # (```)

[//]: # ()
[//]: # (### 6. 个人信息中心 &#40;TeacherProfile.vue&#41;)

[//]: # ()
[//]: # (**路由**: `/teacher/profile`)

[//]: # ()
[//]: # (**功能模块**:)

[//]: # (- **基本信息Tab**: 修改姓名、邮箱、授课科目、教龄)

[//]: # (- **关联班级Tab**: 展示授课班级列表)

[//]: # (- **安全设置Tab**: 修改密码)

[//]: # (- **退出登录**: 清除本地存储，跳转到登录页)

[//]: # ()
[//]: # (### 7. 任务发布 &#40;PublishTask.vue&#41;)

[//]: # ()
[//]: # (**路由**: `/teacher/publish-task`)

[//]: # ()
[//]: # (**功能**:)

[//]: # (- 任务名称输入)

[//]: # (- 截止日期选择)

[//]: # (- 分数占比设置)

[//]: # (- 任务内容编辑（富文本）)

[//]: # (- 附件上传)

[//]: # (- 支持从AI出题页面携带题目内容)

[//]: # ()
[//]: # (### 8. AI对话（教师版） &#40;TeacherAIChat.vue&#41;)

[//]: # ()
[//]: # (**路由**: `/teacher/ai-chat`)

[//]: # ()
[//]: # (**功能**:)

[//]: # (- 会话管理（新建、搜索、加载历史）)

[//]: # (- 模型选择（DeepSeek、豆包、通义千问）)

[//]: # (- 联网搜索开关)

[//]: # (- 消息发送和接收)

[//]: # (- 快捷入口：AI教学资料生成、AI出题)

[//]: # (- 会话导出)

[//]: # (- 生成标题)

[//]: # ()
[//]: # (## 样式设计规范)

[//]: # ()
[//]: # (### 配色方案)

[//]: # ()
[//]: # (教师端采用「沉稳深蓝+浅灰+白色」主色调：)

[//]: # ()
[//]: # (```css)

[//]: # (:root {)

[//]: # (  --teacher-primary: #1e3a8a;        /* 深蓝色 */)

[//]: # (  --teacher-primary-light: #3b82f6;  /* 浅蓝色 */)

[//]: # (  --teacher-secondary: #64748b;      /* 灰蓝色 */)

[//]: # (  --teacher-success: #10b981;        /* 绿色 */)

[//]: # (  --teacher-warning: #f59e0b;        /* 橙色 */)

[//]: # (  --teacher-danger: #ef4444;         /* 红色 */)

[//]: # (  --teacher-bg: #f8fafc;             /* 浅灰背景 */)

[//]: # (  --teacher-card-bg: #ffffff;        /* 卡片背景 */)

[//]: # (  --teacher-border: #e2e8f0;         /* 边框颜色 */)

[//]: # (  --teacher-text-primary: #1e293b;   /* 主文本 */)

[//]: # (  --teacher-text-secondary: #64748b; /* 次要文本 */)

[//]: # (})

[//]: # (```)

[//]: # ()
[//]: # (### 通用组件样式)

[//]: # ()
[//]: # (- **顶部导航栏**: `.teacher-top-nav`)

[//]: # (- **欢迎区域**: `.teacher-welcome`)

[//]: # (- **主内容卡片**: `.teacher-card`)

[//]: # (- **快捷入口卡片**: `.teacher-access-card`)

[//]: # (- **按钮**: `.teacher-btn-primary`, `.teacher-btn-success`等)

[//]: # (- **表格**: `.teacher-table`)

[//]: # (- **表单**: `.teacher-form`)

[//]: # (- **Tab**: `.teacher-tabs`)

[//]: # ()
[//]: # (### 响应式布局)

[//]: # ()
[//]: # (- 主流屏幕：1366px及以上)

[//]: # (- 平板：768px - 1366px)

[//]: # (- 手机：< 768px)

[//]: # ()
[//]: # (```scss)

[//]: # (@media &#40;max-width: 768px&#41; {)

[//]: # (  .teacher-page {)

[//]: # (    padding: 12px;)

[//]: # (  })

[//]: # (  .teacher-quick-access {)

[//]: # (    grid-template-columns: repeat&#40;auto-fill, minmax&#40;160px, 1fr&#41;&#41;;)

[//]: # (  })

[//]: # (})

[//]: # (```)

[//]: # ()
[//]: # (## 路由配置)

[//]: # ()
[//]: # (```javascript)

[//]: # (// 教师端路由)

[//]: # ({)

[//]: # (  path: '/teacher',)

[//]: # (  redirect: '/teacher/dashboard')

[//]: # (},)

[//]: # ({)

[//]: # (  path: '/teacher/dashboard',)

[//]: # (  name: 'TeacherDashboard',)

[//]: # (  component: TeacherDashboard,)

[//]: # (  meta: { title: '教师首页', requiresAuth: true, role: 'teacher' })

[//]: # (},)

[//]: # (// ... 其他路由)

[//]: # (```)

[//]: # ()
[//]: # (## 路由守卫)

[//]: # ()
[//]: # (```javascript)

[//]: # (router.beforeEach&#40;&#40;to, from, next&#41; => {)

[//]: # (  const token = localStorage.getItem&#40;'token'&#41;;)

[//]: # (  const userType = localStorage.getItem&#40;'userType'&#41;;)

[//]: # (  )
[//]: # (  // 设置页面标题)

[//]: # (  if &#40;to.meta.title&#41; {)

[//]: # (    document.title = `${to.meta.title} - Elysia 教育平台`;)

[//]: # (  })

[//]: # (  )
[//]: # (  // 需要认证的页面)

[//]: # (  if &#40;to.meta.requiresAuth&#41; {)

[//]: # (    if &#40;!token&#41; {)

[//]: # (      ElMessage.warning&#40;'请先登录'&#41;;)

[//]: # (      next&#40;'/'&#41;;)

[//]: # (      return;)

[//]: # (    })

[//]: # (    )
[//]: # (    // 检查角色权限)

[//]: # (    if &#40;to.meta.role && to.meta.role !== userType&#41; {)

[//]: # (      ElMessage.error&#40;'权限不足'&#41;;)

[//]: # (      next&#40;false&#41;;)

[//]: # (      return;)

[//]: # (    })

[//]: # (  })

[//]: # (  )
[//]: # (  next&#40;&#41;;)

[//]: # (}&#41;;)

[//]: # (```)

[//]: # ()
[//]: # (## 交互规范)

[//]: # ()
[//]: # (### 1. 加载状态)

[//]: # ()
[//]: # (所有异步操作都需要显示loading状态：)

[//]: # ()
[//]: # (```javascript)

[//]: # (const loading = ref&#40;false&#41;;)

[//]: # ()
[//]: # (const handleSubmit = async &#40;&#41; => {)

[//]: # (  loading.value = true;)

[//]: # (  try {)

[//]: # (    // 异步操作)

[//]: # (  } finally {)

[//]: # (    loading.value = false;)

[//]: # (  })

[//]: # (})

[//]: # (```)

[//]: # ()
[//]: # (### 2. 消息提示)

[//]: # ()
[//]: # (使用Element Plus的Message组件：)

[//]: # ()
[//]: # (```javascript)

[//]: # (ElMessage.success&#40;'操作成功'&#41;;)

[//]: # (ElMessage.error&#40;'操作失败'&#41;;)

[//]: # (ElMessage.warning&#40;'请填写完整信息'&#41;;)

[//]: # (ElMessage.info&#40;'提示信息'&#41;;)

[//]: # (```)

[//]: # ()
[//]: # (### 3. 确认弹窗)

[//]: # ()
[//]: # (关键操作需要确认：)

[//]: # ()
[//]: # (```javascript)

[//]: # (await ElMessageBox.confirm&#40;'确定要删除吗？', '确认删除', {)

[//]: # (  confirmButtonText: '确定',)

[//]: # (  cancelButtonText: '取消',)

[//]: # (  type: 'warning')

[//]: # (}&#41;;)

[//]: # (```)

[//]: # ()
[//]: # (### 4. 表单验证)

[//]: # ()
[//]: # (使用Element Plus的Form验证：)

[//]: # ()
[//]: # (```javascript)

[//]: # (const formRef = ref&#40;null&#41;;)

[//]: # ()
[//]: # (const submitForm = async &#40;&#41; => {)

[//]: # (  await formRef.value.validate&#40;&#41;;)

[//]: # (  // 提交表单)

[//]: # (})

[//]: # (```)

[//]: # ()
[//]: # (## API接口规范)

[//]: # ()
[//]: # (### 教师端API)

[//]: # ()
[//]: # (```javascript)

[//]: # (// services/index.js)

[//]: # (export const teacherAPI = {)

[//]: # (  // 登录)

[//]: # (  loginWithPassword: &#40;teacherNumber, password&#41; => {},)

[//]: # (  loginWithSMS: &#40;phoneNumber, code&#41; => {},)

[//]: # (  )
[//]: # (  // 注册)

[//]: # (  registerWithSMS: &#40;phoneNumber, code, teacherNumber, password&#41; => {},)

[//]: # (  )
[//]: # (  // 班级管理)

[//]: # (  getClassList: &#40;&#41; => {},)

[//]: # (  createClass: &#40;data&#41; => {},)

[//]: # (  deleteClass: &#40;id&#41; => {},)

[//]: # (  getClassDetail: &#40;id&#41; => {},)

[//]: # (  )
[//]: # (  // 学生管理)

[//]: # (  getClassMembers: &#40;classId&#41; => {},)

[//]: # (  removeMember: &#40;classId, studentId&#41; => {},)

[//]: # (  approveStudent: &#40;id&#41; => {},)

[//]: # (  rejectStudent: &#40;id&#41; => {},)

[//]: # (  )
[//]: # (  // 公告管理)

[//]: # (  publishAnnouncement: &#40;classId, data&#41; => {},)

[//]: # (  getAnnouncements: &#40;classId&#41; => {},)

[//]: # (  deleteAnnouncement: &#40;id&#41; => {},)

[//]: # (  )
[//]: # (  // 任务管理)

[//]: # (  publishTask: &#40;classId, data&#41; => {},)

[//]: # (  getTasks: &#40;classId&#41; => {},)

[//]: # (  deleteTask: &#40;id&#41; => {},)

[//]: # (  )
[//]: # (  // 课程管理)

[//]: # (  getChapters: &#40;&#41; => {},)

[//]: # (  createChapter: &#40;data&#41; => {},)

[//]: # (  deleteChapter: &#40;id&#41; => {},)

[//]: # (  )
[//]: # (  // AI功能)

[//]: # (  generateMaterial: &#40;knowledge, format&#41; => {},)

[//]: # (  generateQuestion: &#40;scene, knowledge, difficulty&#41; => {},)

[//]: # (  )
[//]: # (  // 代码审核)

[//]: # (  getPendingReviews: &#40;&#41; => {},)

[//]: # (  getReviewedList: &#40;&#41; => {},)

[//]: # (  submitReview: &#40;id, data&#41; => {},)

[//]: # (  batchReview: &#40;ids&#41; => {})

[//]: # (})

[//]: # (```)

[//]: # ()
[//]: # (## 开发注意事项)

[//]: # ()
[//]: # (### 1. 代码规范)

[//]: # ()
[//]: # (- 使用Composition API)

[//]: # (- 组件名使用PascalCase)

[//]: # (- 变量名使用camelCase)

[//]: # (- 常量使用UPPER_CASE)

[//]: # (- 添加详细的中文注释)

[//]: # ()
[//]: # (### 2. 性能优化)

[//]: # ()
[//]: # (- 使用路由懒加载)

[//]: # (- 大列表使用虚拟滚动)

[//]: # (- 图片使用懒加载)

[//]: # (- 合理使用computed和watch)

[//]: # ()
[//]: # (### 3. 错误处理)

[//]: # ()
[//]: # (- 所有API调用都需要try-catch)

[//]: # (- 统一的错误提示)

[//]: # (- 记录错误日志)

[//]: # ()
[//]: # (### 4. 安全性)

[//]: # ()
[//]: # (- 敏感信息不存储在localStorage)

[//]: # (- API请求携带token)

[//]: # (- 防止XSS攻击)

[//]: # (- 表单输入验证)

[//]: # ()
[//]: # (## 部署说明)

[//]: # ()
[//]: # (### 开发环境)

[//]: # ()
[//]: # (```bash)

[//]: # (npm install)

[//]: # (npm run dev)

[//]: # (```)

[//]: # ()
[//]: # (### 生产构建)

[//]: # ()
[//]: # (```bash)

[//]: # (npm run build)

[//]: # (```)

[//]: # ()
[//]: # (### 环境变量)

[//]: # ()
[//]: # (```env)

[//]: # (VITE_API_BASE_URL=http://api.example.com)

[//]: # (VITE_APP_TITLE=Elysia 教育平台)

[//]: # (```)

[//]: # ()
[//]: # (## 浏览器兼容性)

[//]: # ()
[//]: # (- Chrome >= 90)

[//]: # (- Firefox >= 88)

[//]: # (- Edge >= 90)

[//]: # (- Safari >= 14)

[//]: # ()
[//]: # (## 更新日志)

[//]: # ()
[//]: # (### v1.0.0 &#40;2026-02-11&#41;)

[//]: # ()
[//]: # (- ✅ 完成教师端首页)

[//]: # (- ✅ 完成班级创建和详情页面)

[//]: # (- ✅ 完成课程章节管理页面)

[//]: # (- ✅ 完成AI代码审核页面)

[//]: # (- ✅ 完成个人信息中心)

[//]: # (- ✅ 完成任务发布页面)

[//]: # (- ✅ 完成教师版AI对话页面)

[//]: # (- ✅ 完成路由配置和权限控制)

[//]: # (- ✅ 完成教师端样式设计)

[//]: # ()
[//]: # (## 联系方式)

[//]: # ()
[//]: # (如有问题，请联系开发团队。)
