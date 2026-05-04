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
    api.post('/admin/auth/logout'),

  // 管理员个人信息接口
  getProfile: () => api.get('/admin/profile'),
  updatePassword: (oldPassword, newPassword) =>
    api.post('/admin/profile/password', { old_password: oldPassword, new_password: newPassword }),
  updateEmail: (email) =>
    api.post('/admin/profile/email', { email }),
  updateRealName: (realName) =>
    api.post('/admin/profile/real-name', { real_name: realName }),
  sendUpdatePhoneCode: (phoneNumber) =>
    api.post('/admin/profile/phone/send-code', { phone_number: phoneNumber }),
  updatePhone: (phoneNumber, code) =>
    api.post('/admin/profile/phone', { phone_number: phoneNumber, code }),

  // ==================== 意图管理接口 ====================
  // 意图字典
  listIntentDicts: (params = {}) =>
    api.get('/admin/intent/dict', { params }),
  createIntentDict: (data) =>
    api.post('/admin/intent/dict', data),
  getIntentDict: (id) =>
    api.get(`/admin/intent/dict/${id}`),
  updateIntentDict: (id, data) =>
    api.put(`/admin/intent/dict/${id}`, data),
  deleteIntentDict: (id) =>
    api.delete(`/admin/intent/dict/${id}`),
  updateIntentDictStatus: (id, data) =>
    api.post(`/admin/intent/dict/${id}/status`, data),

  // 意图提示词模板
  listIntentPromptTemplates: (params = {}) =>
    api.get('/admin/intent/prompt', { params }),
  createIntentPromptTemplate: (data) =>
    api.post('/admin/intent/prompt', data),
  getIntentPromptTemplate: (id) =>
    api.get(`/admin/intent/prompt/${id}`),
  updateIntentPromptTemplate: (id, data) =>
    api.put(`/admin/intent/prompt/${id}`, data),
  deleteIntentPromptTemplate: (id) =>
    api.delete(`/admin/intent/prompt/${id}`),
  updateIntentPromptTemplateStatus: (id, data) =>
    api.post(`/admin/intent/prompt/${id}/status`, data),

  // 意图记录与统计
  listIntentRecords: (params = {}) =>
    api.get('/admin/intent/records', { params }),
  getIntentStats: () =>
    api.get('/admin/intent/stats'),

  // Dashboard监控接口
  getDashboardStats: () =>
    api.get('/admin/dashboard/stats'),
  getInferenceUsage: (params = {}) =>
    api.get('/admin/dashboard/usage', { params })
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
    api.post('/teacher/class/update', { teacher_id: teacherId, class_id: classId, ...data }),

  // ---- 章节管理 ----
  // 查询班级章节列表（含小节，师生共用）
  getClassChapters: (classId) =>
    api.post('/class/chapters', { class_id: classId }),

  // 创建章节
  createChapter: (teacherId, classId, title, description) =>
    api.post('/teacher/chapter/create', { teacher_id: teacherId, class_id: classId, title, description }),

  // 更新章节
  updateChapter: (teacherId, chapterId, title, description) =>
    api.post('/teacher/chapter/update', { teacher_id: teacherId, chapter_id: chapterId, title, description }),

  // 删除章节
  deleteChapter: (teacherId, chapterId) =>
    api.post('/teacher/chapter/delete', { teacher_id: teacherId, chapter_id: chapterId }),

  // 创建小节
  createSection: (teacherId, chapterId, data) =>
    api.post('/teacher/section/create', { teacher_id: teacherId, chapter_id: chapterId, ...data }),

  // 删除小节
  deleteSection: (teacherId, sectionId) =>
    api.post('/teacher/section/delete', { teacher_id: teacherId, section_id: sectionId }),

  // ---- 学习资料管理 ----
  uploadMaterial: (formData) =>
    api.post('/teacher/material/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteMaterial: (teacherId, materialId) =>
    api.post('/teacher/material/delete', { teacher_id: teacherId, material_id: materialId }),
  getMaterials: (sectionId) =>
    api.post('/material/list', { section_id: sectionId }),
  viewMaterialFile: (materialId) =>
    api.get(`/material/file/${materialId}/view`, { responseType: 'blob' }),
  downloadMaterialFile: (materialId) =>
    api.get(`/material/file/${materialId}/download`, { responseType: 'blob' }),

  // ---- 公告管理 ----
  // 发布公告（仅教师）
  publishAnnouncement: (teacherId, classId, title, content) =>
    api.post('/teacher/class/announcement/publish', { teacher_id: teacherId, class_id: classId, title, content }),

  // 删除公告（仅教师）
  deleteAnnouncement: (teacherId, classId, announcementId) =>
    api.post('/teacher/class/announcement/delete', { teacher_id: teacherId, class_id: classId, announcement_id: announcementId }),

  // 查询公告列表（师生共用）
  getAnnouncements: (classId) =>
    api.post('/class/announcements', { class_id: classId }),

  // AI对话接口（SSE流式，返回fetch Response）
  aiChatStream: async (data, signal) => {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/teacher/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(data),
      signal
    })
    return response
  },

  // 查询用户AI会话列表（按时间倒序）
  getAISessions: (page = 1, pageSize = 50) =>
    api.get('/student/ai/sessions', { params: { page, page_size: pageSize } }),

  // 查询某会话的消息列表
  getAISessionMessages: (sessionId, page = 1, pageSize = 200) =>
    api.get(`/student/ai/sessions/${sessionId}/messages`, { params: { page, page_size: pageSize } }),

  // 查询支持的AI模型列表
  getAIModels: () => api.get('/student/ai/models'),

  // 收藏会话
  favoriteSession: (sessionId) =>
    api.post('/ai/favorite', { session_id: sessionId }),

  // 取消收藏会话
  unfavoriteSession: (sessionId) =>
    api.post('/ai/unfavorite', { session_id: sessionId }),

  // 查询收藏列表
  listFavorites: (page = 1, pageSize = 20) =>
    api.get('/ai/favorites', { params: { page, page_size: pageSize } }),

  // 检查会话是否已收藏
  checkFavorite: (sessionId) =>
    api.get('/ai/favorite/check', { params: { session_id: sessionId } })
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

  // 学生个人信息接口
  getProfile: () => api.get('/student/profile'),
  updateProfile: (data) => api.post('/student/profile', data),
  updatePassword: (oldPassword, newPassword) =>
    api.post('/student/profile/password', { old_password: oldPassword, new_password: newPassword }),
  getStudyStats: () => api.get('/student/profile/study-stats'),

  // 做题画像数据
  getCodingStats: () => api.get('/student/profile/coding-stats'),

  // 待办事项（未完成章节）
  getPendingChapters: () => api.get('/student/pending-chapters'),

  // 获取各班级完成度
  getClassProgress: () => api.get('/student/class-progress'),

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

  // 查询学生某题的运行记录列表（最新 10 条，倒序）
  getCodeRunRecords: (problemId) =>
    api.get('/student/code/records', { params: { problem_id: problemId } }),

  // 批量查询学生已完全通过的题目ID集合（用于课程目录打钩）
  getCodeProgress: (problemIds) =>
    api.get('/student/code/progress', { params: { problem_ids: problemIds.join(',') } }),

  // 根据验证码查询班级信息
  getClassByCode: (classCode) =>
    api.get('/class/get-by-code', { params: { class_code: classCode } }),

  // 加入班级
  joinClass: (studentId, classCode) =>
    api.post('/student/class/join', { student_id: studentId, class_code: classCode }),

  // 查询班级章节列表（含小节，师生共用）
  getClassChapters: (classId) =>
    api.post('/class/chapters', { class_id: classId }),

  // 学习资料（学生端）
  getMaterials: (sectionId) =>
    api.post('/material/list', { section_id: sectionId }),
  viewMaterialFile: (materialId) =>
    api.get(`/material/file/${materialId}/view`, { responseType: 'blob' }),
  downloadMaterialFile: (materialId) =>
    api.get(`/material/file/${materialId}/download`, { responseType: 'blob' }),

  // 查询班级公告列表（师生共用）
  getAnnouncements: (classId) =>
    api.post('/class/announcements', { class_id: classId }),

  // AI答疑接口（SSE流式，返回fetch Response）
  aiChatStream: async (data, signal) => {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/student/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(data),
      signal
    })
    return response
  },

  // 查询支持的AI模型列表（后端已过滤管理员禁用的模型）
  getAIModels: () => api.get('/student/ai/models'),

  // 查询用户AI会话列表（按时间倒序）
  getAISessions: (page = 1, pageSize = 50) =>
    api.get('/student/ai/sessions', { params: { page, page_size: pageSize } }),

  // 查询某会话的消息列表
  getAISessionMessages: (sessionId, page = 1, pageSize = 200) =>
    api.get(`/student/ai/sessions/${sessionId}/messages`, { params: { page, page_size: pageSize } }),

  // 收藏会话
  favoriteSession: (sessionId) =>
    api.post('/ai/favorite', { session_id: sessionId }),

  // 取消收藏会话
  unfavoriteSession: (sessionId) =>
    api.post('/ai/unfavorite', { session_id: sessionId }),

  // 查询收藏列表
  listFavorites: (page = 1, pageSize = 20) =>
    api.get('/ai/favorites', { params: { page, page_size: pageSize } }),

  // 检查会话是否已收藏
  checkFavorite: (sessionId) =>
    api.get('/ai/favorite/check', { params: { session_id: sessionId } })
}

// ==================== 题库接口 ====================
export const problemAPI = {
  // 查询题库列表（支持关键词搜索和难度筛选）
  listProblems: (keyword = '', difficulty = '', page = 1, pageSize = 20) =>
    api.get('/problem/list', { params: { keyword, difficulty, page, page_size: pageSize } }),

  // 查询单题详情
  getProblem: (id) =>
    api.get('/problem/get', { params: { id } })
}

export default api
