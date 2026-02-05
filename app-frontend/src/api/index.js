import axios from 'axios'
import { showToast } from 'vant'

// 创建 axios 实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    if (error.response) {
      const { status, data } = error.response
      if (status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        localStorage.removeItem('userType')
        window.location.href = '/'
      }
      const message = data.message || data.error || '请求失败'
      showToast(message)
      return Promise.reject(message)
    }
    showToast(error.message || '网络错误')
    return Promise.reject(error.message || '网络错误')
  }
)

// ==================== 管理员接口 ====================
export const adminAPI = {
  // 发送注册验证码
  sendRegisterCode: (phoneNumber) => 
    api.post('/admin/auth/send-code-register', { phone_number: phoneNumber }),
  
  // 发送登录验证码
  sendLoginCode: (phoneNumber) => 
    api.post('/admin/auth/send-code-login', { phone_number: phoneNumber }),
  
  // 短信验证码注册
  registerWithSMS: (phoneNumber, code) => 
    api.post('/admin/auth/register-sms', { phone_number: phoneNumber, code }),
  
  // 短信验证码登录
  loginWithSMS: (phoneNumber, code) => 
    api.post('/admin/auth/login-sms', { phone_number: phoneNumber, code }),
  
  // 密码登录
  loginWithPassword: (phoneNumber, password) => 
    api.post('/admin/auth/login-password', { phone_number: phoneNumber, password }),
  
  // 登出
  logout: () => 
    api.post('/admin/auth/logout')
}

// ==================== 教师接口 ====================
export const teacherAPI = {
  // 注册（需要审核）
  register: (data) => 
    api.post('/register', {
      phone_number: data.phoneNumber,
      password: data.password,
      name: data.name,
      employee_number: data.employeeNumber,
      department: data.department,
      title: data.title
    }),
  
  // 发送登录验证码
  sendLoginCode: (phoneNumber) => 
    api.post('/teacher/auth/send-code-login', { phone_number: phoneNumber }),
  
  // 短信验证码登录
  loginWithSMS: (phoneNumber, code) => 
    api.post('/teacher/auth/login-sms', { phone_number: phoneNumber, code }),
  
  // 密码登录
  loginWithPassword: (employeeNumber, password) => 
    api.post('/teacher/auth/login-password', { employee_number: employeeNumber, password }),
  
  // 登出
  logout: () => 
    api.post('/teacher/auth/logout')
}

// ==================== 学生接口 ====================
export const studentAPI = {
  // 发送注册验证码
  sendRegisterCode: (phoneNumber) => 
    api.post('/student/auth/send-code-register', { phone_number: phoneNumber }),
  
  // 发送登录验证码
  sendLoginCode: (phoneNumber) => 
    api.post('/student/auth/send-code-login', { phone_number: phoneNumber }),
  
  // 短信验证码注册
  registerWithSMS: (phoneNumber, code, studentNumber, password) => 
    api.post('/student/auth/register-sms', { 
      phone_number: phoneNumber, 
      code, 
      student_number: studentNumber,
      password 
    }),
  
  // 短信验证码登录
  loginWithSMS: (phoneNumber, code) => 
    api.post('/student/auth/login-sms', { phone_number: phoneNumber, code }),
  
  // 密码登录
  loginWithPassword: (studentNumber, password) => 
    api.post('/student/auth/login-password', { student_number: studentNumber, password }),
  
  // 登出
  logout: () => 
    api.post('/student/auth/logout')
}

export default api
