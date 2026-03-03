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
        localStorage.removeItem('userId')
        localStorage.removeItem('userName')
        localStorage.removeItem('teacherId')
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
    api.post('/teacher/auth/logout'),

  // 查询全量启用科目列表（创建班级时使用）
  listSubjects: () =>
    api.get('/class/subjects'),

  // 查询全量启用学期列表（创建班级时使用）
  listSemesters: () =>
    api.get('/class/semesters'),

  // 创建班级
  createClass: (data) =>
    api.post('/teacher/class/create', data),

  // 查询教师班级列表
  getTeacherClasses: (teacherId, page = 1, pageSize = 50) =>
    api.post('/class/teacher-classes', { teacher_id: teacherId, page, page_size: pageSize }),

  // 删除班级
  deleteClass: (teacherId, classId) =>
    api.post('/teacher/class/delete', { teacher_id: teacherId, class_id: classId }),

  // 查询班级成员
  getClassMembers: (classId, page = 1, pageSize = 20) =>
    api.post('/class/members', { class_id: classId, page, page_size: pageSize }),

  // 移除学生
  removeStudent: (teacherId, classId, studentId) =>
    api.post('/teacher/class/remove-student', { teacher_id: teacherId, class_id: classId, student_id: studentId }),

  // 更新班级信息
  updateClass: (teacherId, classId, data) =>
    api.post('/teacher/class/update', { teacher_id: teacherId, class_id: classId, ...data })
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
    api.post('/student/auth/logout'),

  // 查询题目详情
  getProblem: (id) =>
    api.get('/problem/get', { params: { id } }),

  // 查询学生已加入的班级列表
  getStudentClasses: (studentId, page = 1, pageSize = 50) =>
    api.post('/class/student-classes', { student_id: studentId, page, page_size: pageSize }),

  // 提交代码运行/测试任务
  submitCodeRun: (problemId, language, code, runType, testInput) =>
    api.post('/student/code/run', {
      problem_id: problemId,
      language,
      code,
      run_type: runType,       // 'test' 或 'submit'
      test_input: testInput || '' // 测试模式下的样例输入
    }),

  // 查询代码运行结果（轮询）
  getCodeRunResult: (runId) =>
    api.get('/student/code/result', { params: { run_id: runId } }),

  // 根据验证码查询班级信息
  getClassByCode: (classCode) =>
    api.get('/class/get-by-code', { params: { class_code: classCode } }),

  // 加入班级
  joinClass: (studentId, classCode) =>
    api.post('/student/class/join', { student_id: studentId, class_code: classCode })
}

export default api
