import { createRouter, createWebHistory } from 'vue-router';
import { ElMessage } from 'element-plus';

// 登录注册页面组件
const RoleSelect = () => import('../views/RoleSelect.vue');
const Login = () => import('../views/Login.vue');
const Register = () => import('../views/Register.vue');

// 管理员页面组件
const AdminDashboard = () => import('../views/admin/Dashboard.vue');
const KnowledgeManagement = () => import('../views/admin/KnowledgeManagement.vue');
const BookshelfManagement = () => import('../views/admin/BookshelfManagement.vue');
const AnnouncementManagement = () => import('../views/admin/AnnouncementManagement.vue');
const UserManagement = () => import('../views/admin/UserManagement.vue');
const ModelManagement = () => import('../views/admin/ModelManagement.vue');
const TeacherAudit = () => import('../views/admin/TeacherAudit.vue');
const AdminProfile = () => import('../views/admin/AdminProfile.vue');
const IntentDictManagement = () => import('../views/admin/IntentDictManagement.vue');
const IntentPromptManagement = () => import('../views/admin/IntentPromptManagement.vue');
const IntentRecordManagement = () => import('../views/admin/IntentRecordManagement.vue');

// 教师端页面组件
const TeacherDashboard = () => import('../views/teacher/Dashboard.vue');
const CreateClass = () => import('../views/teacher/CreateClass.vue');
const ClassDetail = () => import('../views/teacher/ClassDetail.vue');
const CourseManagement = () => import('../views/teacher/CourseManagement.vue');
const CodeReview = () => import('../views/teacher/CodeReview.vue');
const TeacherProfile = () => import('../views/teacher/TeacherProfile.vue');
const PublishTask = () => import('../views/teacher/PublishTask.vue');
const TeacherAIChat = () => import('../views/teacher/TeacherAIChat.vue');

// 学生端页面组件
const StudentDashboard = () => import('../views/student/Dashboard.vue');
const AIChat = () => import('../views/student/AIChat.vue');
const CourseStudy = () => import('../views/student/CourseStudy.vue');
const TaskComplete = () => import('../views/student/TaskComplete.vue');

const StudentProfile = () => import('../views/student/StudentProfile.vue');
const SessionCollection = () => import('../views/student/SessionCollection.vue');
const StudyPlan = () => import('../views/student/StudyPlan.vue');
const ProblemCode = () => import('../views/student/ProblemCode.vue');

const routes = [
  {
    path: '/',
    name: 'RoleSelect',
    component: RoleSelect,
    meta: { title: '选择身份' }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { title: '注册' }
  },
  {
    path: '/admin',
    redirect: '/admin/dashboard'
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { title: '管理员首页', requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/knowledge',
    name: 'KnowledgeManagement',
    component: KnowledgeManagement,
    meta: { title: '知识库管理', requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/bookshelf',
    name: 'BookshelfManagement',
    component: BookshelfManagement,
    meta: { title: '平台书架', requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/announcements',
    name: 'AnnouncementManagement',
    component: AnnouncementManagement,
    meta: { title: '系统公告管理', requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/announcement',
    redirect: '/admin/announcements'
  },
  {
    path: '/admin/users',
    name: 'UserManagement',
    component: UserManagement,
    meta: { title: '用户管理', requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/models',
    name: 'ModelManagement',
    component: ModelManagement,
    meta: { title: '模型管理', requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/teacher-audit',
    name: 'TeacherAudit',
    component: TeacherAudit,
    meta: { title: '教师认证审核', requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/profile',
    name: 'AdminProfile',
    component: AdminProfile,
    meta: { title: '个人信息中心', requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/intent-dict',
    name: 'IntentDictManagement',
    component: IntentDictManagement,
    meta: { title: '意图字典管理', requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/intent-prompt',
    name: 'IntentPromptManagement',
    component: IntentPromptManagement,
    meta: { title: '提示词模板管理', requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/intent-records',
    name: 'IntentRecordManagement',
    component: IntentRecordManagement,
    meta: { title: '意图记录与统计', requiresAuth: true, role: 'admin' }
  },
  // 教师端路由
  {
    path: '/teacher',
    redirect: '/teacher/dashboard'
  },
  {
    path: '/teacher/dashboard',
    name: 'TeacherDashboard',
    component: TeacherDashboard,
    meta: { title: '教师首页', requiresAuth: true, role: 'teacher' }
  },
  {
    path: '/teacher/create-class',
    name: 'TeacherCreateClass',
    component: CreateClass,
    meta: { title: '创建班级', requiresAuth: true, role: 'teacher' }
  },
  {
    path: '/teacher/course-management',
    name: 'CourseManagement',
    component: CourseManagement,
    meta: { title: '课程章节管理', requiresAuth: true, role: 'teacher' }
  },
  {
    path: '/teacher/code-review',
    name: 'CodeReview',
    component: CodeReview,
    meta: { title: 'AI代码审核', requiresAuth: true, role: 'teacher' }
  },
  {
    path: '/teacher/profile',
    name: 'TeacherProfile',
    component: TeacherProfile,
    meta: { title: '个人信息中心', requiresAuth: true, role: 'teacher' }
  },
  {
    path: '/teacher/publish-task',
    name: 'PublishTask',
    component: PublishTask,
    meta: { title: '发布任务', requiresAuth: true, role: 'teacher' }
  },
  {
    path: '/teacher/ai-chat',
    name: 'TeacherAIChat',
    component: TeacherAIChat,
    meta: { title: 'AI对话', requiresAuth: true, role: 'teacher' }
  },
  {
    path: '/teacher/collection',
    name: 'TeacherSessionCollection',
    component: () => import('../views/teacher/TeacherSessionCollection.vue'),
    meta: { title: '我的收藏', requiresAuth: true, role: 'teacher' }
  },
  {
    path: '/teacher/class-management',
    name: 'ClassManagement',
    component: () => import('../views/teacher/ClassManagement.vue'),
    meta: { title: '班级管理', requiresAuth: true, role: 'teacher' }
  },
  {
    path: '/teacher/problem/:problemId/code',
    name: 'TeacherProblemCode',
    component: () => import('../views/teacher/ProblemCode.vue'),
    meta: { title: '题目编程调试', requiresAuth: true, role: 'teacher' }
  },
  {
    path: '/teacher/class/:classId',
    name: 'TeacherClassDetail',
    component: () => import('../views/teacher/ClassDetail.vue'),
    meta: { title: '班级详情', requiresAuth: true, role: 'teacher' }
  },
  // 学生端路由
  {
    path: '/student',
    redirect: '/student/dashboard'
  },
  {
    path: '/student/dashboard',
    name: 'StudentDashboard',
    component: StudentDashboard,
    meta: { title: '学生首页', requiresAuth: true, role: 'student' }
  },
  {
    path: '/student/ai-chat',
    name: 'AIChat',
    component: AIChat,
    meta: { title: 'AI对话', requiresAuth: true, role: 'student' }
  },
  {
    path: '/student/course',
    name: 'CourseStudy',
    component: CourseStudy,
    meta: { title: '课程学习', requiresAuth: true, role: 'student' }
  },
  {
    path: '/student/task',
    name: 'TaskComplete',
    component: TaskComplete,
    meta: { title: '任务完成', requiresAuth: true, role: 'student' }
  },

  {
    path: '/student/profile',
    name: 'StudentProfile',
    component: StudentProfile,
    meta: { title: '个人信息中心', requiresAuth: true, role: 'student' }
  },
  {
    path: '/student/collection',
    name: 'SessionCollection',
    component: SessionCollection,
    meta: { title: '我的收藏', requiresAuth: true, role: 'student' }
  },
  {
    path: '/student/study-plan',
    name: 'StudyPlan',
    component: StudyPlan,
    meta: { title: 'AI学习方案', requiresAuth: true, role: 'student' }
  },
  {
    path: '/student/problem/:problemId/code',
    name: 'ProblemCode',
    component: ProblemCode,
    meta: { title: '代码作答', requiresAuth: true, role: 'student' }
  },
  {
    path: '/student/class-list',
    name: 'StudentClassList',
    component: () => import('../views/student/ClassList.vue'),
    meta: { title: '我的班级', requiresAuth: true, role: 'student' }
  },
  {
    path: '/student/class/:classId',
    name: 'StudentClassDetail',
    component: () => import('../views/student/ClassDetail.vue'),
    meta: { title: '班级详情', requiresAuth: true, role: 'student' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - Elysia 教育平台`;
  }
  
  // 如果是公开页面（角色选择、登录、注册），直接放行
  if (to.path === '/' || to.path === '/login' || to.path === '/register') {
    // 如果已登录，根据角色跳转到对应首页
    if (token && userType) {
      if (userType === 'admin') {
        next('/admin/dashboard');
      } else if (userType === 'teacher') {
        next('/teacher/dashboard');
      } else if (userType === 'student') {
        next('/student/dashboard');
      } else {
        next();
      }
    } else {
      next();
    }
    return;
  }
  
  // 需要认证的页面
  if (to.meta.requiresAuth) {
    if (!token) {
      // 未登录，跳转到登录页
      ElMessage.warning('请先登录');
      next('/');
      return;
    }
    
    // 检查角色权限
    if (to.meta.role && to.meta.role !== userType) {
      // 角色不匹配
      ElMessage.error('权限不足');
      next(false);
      return;
    }
  }
  
  next();
});

export default router;
