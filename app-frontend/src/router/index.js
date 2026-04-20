import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'role-select',
      component: () => import('@/views/RoleSelect.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/Register.vue')
    },
    {
      path: '/admin/dashboard',
      name: 'admin-dashboard',
      component: () => import('@/views/admin/Dashboard.vue'),
      meta: { requiresAuth: true, userType: 'admin' }
    },
    {
      path: '/admin/intent-dict',
      name: 'admin-intent-dict',
      component: () => import('@/views/admin/IntentDictManagement.vue'),
      meta: { requiresAuth: true, userType: 'admin' }
    },
    {
      path: '/admin/intent-prompt',
      name: 'admin-intent-prompt',
      component: () => import('@/views/admin/IntentPromptManagement.vue'),
      meta: { requiresAuth: true, userType: 'admin' }
    },
    {
      path: '/admin/intent-records',
      name: 'admin-intent-records',
      component: () => import('@/views/admin/IntentRecordManagement.vue'),
      meta: { requiresAuth: true, userType: 'admin' }
    },
    {
      path: '/admin/profile',
      name: 'admin-profile',
      component: () => import('@/views/admin/Profile.vue'),
      meta: { requiresAuth: true, userType: 'admin' }
    },
    {
      path: '/teacher/dashboard',
      name: 'teacher-dashboard',
      component: () => import('@/views/teacher/Dashboard.vue'),
      meta: { requiresAuth: true, userType: 'teacher' }
    },
    // 学生端路由
    {
      path: '/student/dashboard',
      name: 'student-dashboard',
      component: () => import('@/views/student/Dashboard.vue'),
      meta: { requiresAuth: true, userType: 'student' }
    },
    {
      path: '/student/ai-chat',
      name: 'student-ai-chat',
      component: () => import('@/views/student/AIChat.vue'),
      meta: { requiresAuth: true, userType: 'student' }
    },
    {
      path: '/student/course-study',
      name: 'student-course-study',
      component: () => import('@/views/student/CourseStudy.vue'),
      meta: { requiresAuth: true, userType: 'student' }
    },
    {
      path: '/student/task-complete',
      name: 'student-task-complete',
      component: () => import('@/views/student/TaskComplete.vue'),
      meta: { requiresAuth: true, userType: 'student' }
    },

    {
      path: '/student/profile',
      name: 'student-profile',
      component: () => import('@/views/student/StudentProfile.vue'),
      meta: { requiresAuth: true, userType: 'student' }
    },
    {
      path: '/student/session-collection',
      name: 'student-session-collection',
      component: () => import('@/views/student/SessionCollection.vue'),
      meta: { requiresAuth: true, userType: 'student' }
    },
    {
      path: '/student/study-plan',
      name: 'student-study-plan',
      component: () => import('@/views/student/StudyPlan.vue'),
      meta: { requiresAuth: true, userType: 'student' }
    },
    {
      path: '/student/problem/:problemId/code',
      name: 'student-problem-code',
      component: () => import('@/views/student/ProblemCode.vue'),
      meta: { requiresAuth: true, userType: 'student' }
    },
    // 班级相关路由（教师端）
    {
      path: '/teacher/class-management',
      name: 'teacher-class-management',
      component: () => import('@/views/teacher/ClassManagement.vue'),
      meta: { requiresAuth: true, userType: 'teacher' }
    },
    {
      path: '/teacher/class/:classId',
      name: 'teacher-class-detail',
      component: () => import('@/views/teacher/ClassDetail.vue'),
      meta: { requiresAuth: true, userType: 'teacher' }
    },
    {
      path: '/teacher/create-class',
      name: 'teacher-create-class',
      component: () => import('@/views/teacher/CreateClass.vue'),
      meta: { requiresAuth: true, userType: 'teacher' }
    },
    {
      path: '/teacher/course-management',
      name: 'teacher-course-management',
      component: () => import('@/views/teacher/CourseManagement.vue'),
      meta: { requiresAuth: true, userType: 'teacher' }
    },
    {
      path: '/teacher/code-review',
      name: 'teacher-code-review',
      component: () => import('@/views/teacher/CodeReview.vue'),
      meta: { requiresAuth: true, userType: 'teacher' }
    },
    {
      path: '/teacher/ai-chat',
      name: 'teacher-ai-chat',
      component: () => import('@/views/teacher/TeacherAIChat.vue'),
      meta: { requiresAuth: true, userType: 'teacher' }
    },
    {
      path: '/teacher/collection',
      name: 'teacher-session-collection',
      component: () => import('@/views/student/SessionCollection.vue'),
      meta: { requiresAuth: true, userType: 'teacher' }
    },
    {
      path: '/teacher/profile',
      name: 'teacher-profile',
      component: () => import('@/views/teacher/TeacherProfile.vue'),
      meta: { requiresAuth: true, userType: 'teacher' }
    },
    {
      path: '/teacher/publish-task',
      name: 'teacher-publish-task',
      component: () => import('@/views/teacher/PublishTask.vue'),
      meta: { requiresAuth: true, userType: 'teacher' }
    },
    // 班级相关路由（学生端）
    {
      path: '/student/class-list',
      name: 'student-class-list',
      component: () => import('@/views/student/ClassList.vue'),
      meta: { requiresAuth: true, userType: 'student' }
    },
    {
      path: '/student/class/:classId',
      name: 'student-class-detail',
      component: () => import('@/views/student/ClassDetail.vue'),
      meta: { requiresAuth: true, userType: 'student' }
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const userType = localStorage.getItem('userType')

  // 如果已登录，访问根路径时自动跳转到对应的 dashboard
  if (to.path === '/' && token && userType) {
    if (userType === 'admin') {
      next('/admin/dashboard')
    } else if (userType === 'teacher') {
      next('/teacher/dashboard')
    } else if (userType === 'student') {
      next('/student/dashboard')
    } else {
      next()
    }
    return
  }

  // 需要认证的路由
  if (to.meta.requiresAuth) {
    if (!token) {
      // 未登录，跳转到角色选择页面
      next('/')
    } else if (to.meta.userType && to.meta.userType !== userType) {
      // 用户类型不匹配，跳转到对应的 dashboard
      if (userType === 'admin') {
        next('/admin/dashboard')
      } else if (userType === 'teacher') {
        next('/teacher/dashboard')
      } else if (userType === 'student') {
        next('/student/dashboard')
      } else {
        next('/')
      }
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
