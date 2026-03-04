import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:8001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        window.location.href = '/';
      }
      return Promise.reject(data.message || data.error || '请求失败');
    }
    return Promise.reject(error.message || '网络错误');
  }
);

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
};

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
  getTeacherClasses: (teacherId, page = 1, pageSize = 10) =>
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

  // 调整章节排序
  reorderChapters: (teacherId, classId, orders) =>
    api.post('/teacher/chapter/reorder', { teacher_id: teacherId, class_id: classId, orders }),

  // 创建小节
  createSection: (teacherId, chapterId, data) =>
    api.post('/teacher/section/create', { teacher_id: teacherId, chapter_id: chapterId, ...data }),

  // 更新小节
  updateSection: (teacherId, sectionId, title, description, refId) =>
    api.post('/teacher/section/update', { teacher_id: teacherId, section_id: sectionId, title, description, ref_id: refId }),

  // 删除小节
  deleteSection: (teacherId, sectionId) =>
    api.post('/teacher/section/delete', { teacher_id: teacherId, section_id: sectionId }),

  // 调整小节排序
  reorderSections: (teacherId, chapterId, orders) =>
    api.post('/teacher/section/reorder', { teacher_id: teacherId, chapter_id: chapterId, orders }),

  // ---- 公告管理 ----
  // 发布公告（仅教师）
  publishAnnouncement: (teacherId, classId, title, content) =>
    api.post('/teacher/class/announcement/publish', { teacher_id: teacherId, class_id: classId, title, content }),

  // 删除公告（仅教师）
  deleteAnnouncement: (teacherId, classId, announcementId) =>
    api.post('/teacher/class/announcement/delete', { teacher_id: teacherId, class_id: classId, announcement_id: announcementId }),

  // 查询公告列表（师生共用）
  getAnnouncements: (classId) =>
    api.post('/class/announcements', { class_id: classId })
};

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

  // 查询学生已加入的班级列表
  getStudentClasses: (studentId, page = 1, pageSize = 50) =>
    api.post('/class/student-classes', { student_id: studentId, page, page_size: pageSize }),

  // 根据验证码查询班级信息
  getClassByCode: (classCode) =>
    api.get('/class/get-by-code', { params: { class_code: classCode } }),

  // 加入班级
  joinClass: (studentId, classCode) =>
    api.post('/student/class/join', { student_id: studentId, class_code: classCode })
};

// ==================== 题库接口 ====================
export const problemAPI = {
  // 查询题库列表（支持关键词搜索和难度筛选）
  listProblems: (keyword = '', difficulty = '', page = 1, pageSize = 20) =>
    api.get('/problem/list', { params: { keyword, difficulty, page, page_size: pageSize } }),

  // 查询单题详情
  getProblem: (id) =>
    api.get('/problem/get', { params: { id } })
};

export default api;
