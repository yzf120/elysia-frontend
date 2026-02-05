import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/Home.vue')
    },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('@/views/admin/Login.vue')
    },
    {
      path: '/admin/dashboard',
      name: 'admin-dashboard',
      component: () => import('@/views/admin/Dashboard.vue'),
      meta: { requiresAuth: true, userType: 'admin' }
    },
    {
      path: '/teacher/login',
      name: 'teacher-login',
      component: () => import('@/views/teacher/Login.vue')
    },
    {
      path: '/teacher/register',
      name: 'teacher-register',
      component: () => import('@/views/teacher/Register.vue')
    },
    {
      path: '/teacher/dashboard',
      name: 'teacher-dashboard',
      component: () => import('@/views/teacher/Dashboard.vue'),
      meta: { requiresAuth: true, userType: 'teacher' }
    },
    {
      path: '/student/login',
      name: 'student-login',
      component: () => import('@/views/student/Login.vue')
    },
    {
      path: '/student/register',
      name: 'student-register',
      component: () => import('@/views/student/Register.vue')
    },
    {
      path: '/student/dashboard',
      name: 'student-dashboard',
      component: () => import('@/views/student/Dashboard.vue'),
      meta: { requiresAuth: true, userType: 'student' }
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const userType = localStorage.getItem('userType')

  if (to.meta.requiresAuth) {
    if (!token) {
      // 未登录，跳转到首页
      next('/')
    } else if (to.meta.userType && to.meta.userType !== userType) {
      // 用户类型不匹配
      next('/')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
