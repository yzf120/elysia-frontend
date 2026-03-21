<template>
  <div class="login-container">
    <div class="login-card">
      <!-- 顶部角色图标和标题 -->
      <div class="login-header">
        <div class="role-icon">{{ roleIcon }}</div>
        <h1 class="login-title">{{ roleTitle }}</h1>
        <p class="login-subtitle">{{ roleSubtitle }}</p>
      </div>

      <!-- 登录方式切换 -->
      <div class="login-tabs">
        <div 
          class="tab-item" 
          :class="{ active: loginType === 'password' }"
          @click="loginType = 'password'"
        >
          密码登录
        </div>
        <div 
          v-if="userRole !== 'student'"
          class="tab-item" 
          :class="{ active: loginType === 'sms' }"
          @click="loginType = 'sms'"
        >
          验证码登录
        </div>
      </div>

      <!-- 登录表单 -->
      <div class="login-form">
        <!-- 密码登录 -->
        <template v-if="loginType === 'password'">
          <div class="form-item">
            <input
              v-model="loginForm.account"
              :placeholder="accountPlaceholder"
              class="form-input"
              type="text"
            />
          </div>

          <div class="form-item password-item">
            <input
              v-model="loginForm.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入密码"
              class="form-input password-input"
              @keyup.enter="handleLogin"
            />
            <button
              type="button"
              class="password-toggle"
              @click="togglePasswordVisibility"
            >
              {{ showPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
        </template>

        <!-- 验证码登录 -->
        <template v-else>
          <div class="form-item">
            <input
              v-model="loginForm.phone_number"
              placeholder="请输入手机号"
              class="form-input"
              type="tel"
            />
          </div>

          <div class="form-item code-item">
            <input
              v-model="loginForm.code"
              placeholder="请输入验证码"
              class="form-input code-input"
              type="text"
              maxlength="6"
              @keyup.enter="handleLogin"
            />
            <button
              class="send-code-btn"
              :disabled="countdown > 0"
              @click="sendCode"
            >
              {{ countdown > 0 ? `${countdown}秒` : '发送验证码' }}
            </button>
          </div>
        </template>

        <button
          class="login-button"
          :disabled="loading"
          @click="handleLogin"
        >
          {{ loading ? '登录中...' : '登录' }}
        </button>

        <div class="login-footer">
          <span class="back-link" @click="goBack">
            ← 返回选择身份
          </span>
          <span v-if="userRole !== 'admin'" class="register-link" @click="goToRegister">
            立即注册
          </span>
        </div>
      </div>
    </div>

    <!-- Toast 提示 -->
    <div v-if="toast.show" class="toast" :class="toast.type">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '../api/index';

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const loginType = ref('password'); // password 或 sms
const countdown = ref(0);
const showPassword = ref(false); // 密码可见性
let countdownTimer = null;

// Toast 提示
const toast = reactive({
  show: false,
  message: '',
  type: 'success' // success, error, warning
});

const showToast = (message, type = 'success') => {
  toast.message = message;
  toast.type = type;
  toast.show = true;
  setTimeout(() => {
    toast.show = false;
  }, 2000);
};

// 从URL获取角色类型
const userRole = ref(route.query.role || 'student');

// 登录表单数据
const loginForm = reactive({
  account: '', // 手机号/工号/学号
  password: '',
  phone_number: '',
  code: ''
});

// 角色配置
const roleConfig = computed(() => {
  const configs = {
    admin: {
      icon: '👨‍💼',
      title: '管理员登录',
      subtitle: '系统管理与配置',
      accountPlaceholder: '请输入手机号',
      accountField: 'phone_number'
    },
    teacher: {
      icon: '👨‍🏫',
      title: '教师登录',
      subtitle: '课程管理与教学',
      accountPlaceholder: '请输入工号',
      accountField: 'employee_number'
    },
    student: {
      icon: '👨‍🎓',
      title: '学生登录',
      subtitle: '在线学习与考试',
      accountPlaceholder: '请输入学号',
      accountField: 'student_number'
    }
  };
  return configs[userRole.value] || configs.student;
});

const roleIcon = computed(() => roleConfig.value.icon);
const roleTitle = computed(() => roleConfig.value.title);
const roleSubtitle = computed(() => roleConfig.value.subtitle);
const accountPlaceholder = computed(() => roleConfig.value.accountPlaceholder);

// 发送验证码
const sendCode = async () => {
  if (!loginForm.phone_number) {
    showToast('请先输入手机号', 'warning');
    return;
  }

  if (!/^1[3-9]\d{9}$/.test(loginForm.phone_number)) {
    showToast('请输入正确的手机号', 'warning');
    return;
  }

  try {
    const endpoint = userRole.value === 'admin' 
      ? '/admin/auth/send-code-login'
      : '/teacher/auth/send-code-login';

    await api.post(endpoint, {
      phone_number: loginForm.phone_number
    });

    showToast('验证码已发送', 'success');
    
    // 开始倒计时
    countdown.value = 60;
    countdownTimer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(countdownTimer);
      }
    }, 1000);
  } catch (error) {
    console.error('发送验证码失败:', error);
    showToast(error.message || '发送验证码失败', 'error');
  }
};

// 处理登录
const handleLogin = async () => {
  // 表单验证
  if (loginType.value === 'password') {
    if (!loginForm.account) {
      showToast(`请输入${accountPlaceholder.value.replace('请输入', '')}`, 'warning');
      return;
    }
    if (!loginForm.password) {
      showToast('请输入密码', 'warning');
      return;
    }
    if (loginForm.password.length < 6) {
      showToast('密码长度不能少于6位', 'warning');
      return;
    }
    if (userRole.value === 'admin' && !/^1[3-9]\d{9}$/.test(loginForm.account)) {
      showToast('请输入正确的手机号', 'warning');
      return;
    }
  } else {
    if (!loginForm.phone_number) {
      showToast('请输入手机号', 'warning');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(loginForm.phone_number)) {
      showToast('请输入正确的手机号', 'warning');
      return;
    }
    if (!loginForm.code) {
      showToast('请输入验证码', 'warning');
      return;
    }
    if (loginForm.code.length !== 6) {
      showToast('验证码为6位数字', 'warning');
      return;
    }
  }

  loading.value = true;

  try {
    let response;
    let endpoint;
    let requestData;

    if (loginType.value === 'password') {
      // 密码登录
      if (userRole.value === 'admin') {
        endpoint = '/admin/auth/login-password';
        requestData = {
          phone_number: loginForm.account,
          password: loginForm.password
        };
      } else if (userRole.value === 'teacher') {
        endpoint = '/teacher/auth/login-password';
        requestData = {
          employee_number: loginForm.account,
          password: loginForm.password
        };
      } else {
        endpoint = '/student/auth/login-password';
        requestData = {
          student_number: loginForm.account,
          password: loginForm.password
        };
      }
    } else {
      // 验证码登录
      endpoint = userRole.value === 'admin'
        ? '/admin/auth/login-sms'
        : '/teacher/auth/login-sms';
      requestData = {
        phone_number: loginForm.phone_number,
        code: loginForm.code
      };
    }

    response = await api.post(endpoint, requestData);

    // 后端返回结构为 { data: { token, user_info, message } }
    const respData = response.data || response;
    const token = respData.token;
    const userInfo = respData.user_info;

    // 保存用户信息和token
    localStorage.setItem('token', token);
    localStorage.setItem('userType', userRole.value);
    localStorage.setItem('userInfo', userInfo ? JSON.stringify(userInfo) : '{}');
    // 存储 userId，供各页面统一使用（模仿 web 端）
    if (userInfo) {
      const uid = userInfo.student_id || userInfo.teacher_id || userInfo.admin_id || userInfo.id || '';
      localStorage.setItem('userId', uid);
      localStorage.setItem('userName', userInfo.teacher_name || userInfo.student_name || userInfo.admin_name || userInfo.name || '');
    }

    showToast('登录成功！', 'success');

    // 延迟跳转
    setTimeout(() => {
      if (userRole.value === 'admin') {
        router.push('/admin/dashboard');
      } else if (userRole.value === 'teacher') {
        router.push('/teacher/dashboard');
      } else {
        router.push('/student/dashboard');
      }
    }, 500);
  } catch (error) {
    console.error('登录失败:', error);
    showToast(error.message || '登录失败', 'error');
  } finally {
    loading.value = false;
  }
};

// 返回角色选择
const goBack = () => {
  router.push('/');
};

// 跳转到注册页面
const goToRegister = () => {
  router.push({
    path: '/register',
    query: { role: userRole.value }
  });
};

// 切换密码可见性
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

// 组件卸载时清除定时器
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
});
</script>

<style scoped lang="scss">
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4F6EF7 0%, #60A5FA 100%);
  padding: 20px;
  overflow-y: auto;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  padding: 30px 25px;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 25px;

  .role-icon {
    font-size: 56px;
    margin-bottom: 12px;
  }

  .login-title {
    font-size: 22px;
    font-weight: 600;
    color: #333;
    margin: 0 0 6px 0;
  }

  .login-subtitle {
    font-size: 13px;
    color: #999;
    margin: 0;
  }
}

.login-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;

  .tab-item {
    flex: 1;
    text-align: center;
    padding: 10px 0;
    font-size: 14px;
    color: #666;
    cursor: pointer;
    position: relative;
    transition: all 0.3s;
    user-select: none;
    -webkit-tap-highlight-color: transparent;

    &.active {
      color: #4F6EF7;
      font-weight: 500;

      &::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(135deg, #4F6EF7 0%, #60A5FA 100%);
      }
    }

    &:active {
      opacity: 0.7;
    }
  }
}

.login-form {
  .form-item {
    margin-bottom: 15px;

    &.code-item,
    &.password-item {
      display: flex;
      gap: 10px;
      position: relative;
    }
  }

  .form-input {
    width: 100%;
    height: 45px;
    padding: 0 15px;
    font-size: 15px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    outline: none;
    transition: all 0.3s;
    background: #f8f8f8;

    &:focus {
      border-color: #4F6EF7;
      background: white;
      box-shadow: 0 0 0 3px rgba(79, 110, 247, 0.1);
    }

    &::placeholder {
      color: #999;
    }
  }

  .code-input,
  .password-input {
    flex: 1;
  }

  .send-code-btn {
    flex-shrink: 0;
    width: 100px;
    height: 45px;
    font-size: 13px;
    color: #4F6EF7;
    background: white;
    border: 1px solid #4F6EF7;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    user-select: none;
    -webkit-tap-highlight-color: transparent;

    &:active:not(:disabled) {
      transform: scale(0.98);
      background: #f0f0ff;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .password-toggle {
    flex-shrink: 0;
    width: 45px;
    height: 45px;
    font-size: 18px;
    color: #999;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    -webkit-tap-highlight-color: transparent;

    &:active {
      transform: scale(0.95);
      background: #f8f8f8;
      border-color: #4F6EF7;
    }
  }
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  color: white;
  background: linear-gradient(135deg, #4F6EF7 0%, #60A5FA 100%);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 10px;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.login-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;

  .back-link,
  .register-link {
    color: #4F6EF7;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.3s;
    user-select: none;
    -webkit-tap-highlight-color: transparent;

    &:active {
      opacity: 0.7;
    }
  }
}

// Toast 提示
.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  z-index: 9999;
  animation: slideDown 0.3s ease-out;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  &.success {
    background: #52c41a;
  }

  &.error {
    background: #ff4d4f;
  }

  &.warning {
    background: #faad14;
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

// 小屏幕适配
@media (max-width: 360px) {
  .login-card {
    padding: 25px 20px;
  }

  .login-header .role-icon {
    font-size: 48px;
  }

  .login-header .login-title {
    font-size: 20px;
  }

  .form-input {
    height: 42px;
    font-size: 14px;
  }

  .send-code-btn {
    width: 90px;
    font-size: 12px;
  }
}
</style>
