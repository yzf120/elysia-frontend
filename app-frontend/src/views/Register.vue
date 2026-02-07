<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <div class="role-icon">{{ roleIcon }}</div>
        <h1 class="register-title">{{ roleTitle }}</h1>
        <p class="register-subtitle">{{ roleSubtitle }}</p>
      </div>

      <div class="register-form">
        <!-- 学生注册 -->
        <template v-if="userRole === 'student'">
          <div class="form-item code-item">
            <input
              v-model="registerForm.phone_number"
              placeholder="请输入手机号"
              class="form-input code-input"
              type="tel"
            />
            <button
              class="send-code-btn"
              :disabled="countdown > 0"
              @click="sendCode"
            >
              {{ countdown > 0 ? `${countdown}秒` : '发送验证码' }}
            </button>
          </div>

          <div class="form-item">
            <input
              v-model="registerForm.code"
              placeholder="请输入验证码"
              class="form-input"
              type="text"
              maxlength="6"
            />
          </div>

          <div class="form-item">
            <input
              v-model="registerForm.student_number"
              placeholder="请输入学号"
              class="form-input"
              type="text"
            />
          </div>

          <div class="form-item password-item">
            <input
              v-model="registerForm.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入密码（至少6位）"
              class="form-input password-input"
            />
            <button
              type="button"
              class="password-toggle"
              @click="togglePasswordVisibility"
            >
              {{ showPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>

          <div class="form-item password-item">
            <input
              v-model="registerForm.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="请再次输入密码"
              class="form-input password-input"
            />
            <button
              type="button"
              class="password-toggle"
              @click="toggleConfirmPasswordVisibility"
            >
              {{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
        </template>

        <!-- 教师注册 -->
        <template v-else>
          <div class="form-item">
            <input
              v-model="registerForm.employee_number"
              placeholder="请输入工号"
              class="form-input"
              type="text"
            />
          </div>

          <div class="form-item">
            <input
              v-model="registerForm.name"
              placeholder="请输入真实姓名"
              class="form-input"
              type="text"
            />
          </div>

          <div class="form-item">
            <input
              v-model="registerForm.phone_number"
              placeholder="请输入手机号"
              class="form-input"
              type="tel"
            />
          </div>

          <div class="form-item">
            <input
              v-model="registerForm.email"
              placeholder="请输入学校邮箱"
              class="form-input"
              type="email"
            />
          </div>

          <div class="form-item password-item">
            <input
              v-model="registerForm.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入密码（至少6位）"
              class="form-input password-input"
            />
            <button
              type="button"
              class="password-toggle"
              @click="togglePasswordVisibility"
            >
              {{ showPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>

          <div class="form-item password-item">
            <input
              v-model="registerForm.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="请再次输入密码"
              class="form-input password-input"
            />
            <button
              type="button"
              class="password-toggle"
              @click="toggleConfirmPasswordVisibility"
            >
              {{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>

          <div class="alert-info">
            ℹ️ 教师账号需要管理员审核后才能使用
          </div>
        </template>

        <button
          class="register-button"
          :disabled="loading"
          @click="handleRegister"
        >
          {{ loading ? '注册中...' : '立即注册' }}
        </button>

        <div class="register-footer">
          <span class="back-link" @click="goBack">
            ← 返回选择身份
          </span>
          <span class="login-link" @click="goToLogin">
            立即登录
          </span>
        </div>
      </div>
    </div>

    <!-- Toast 提示 -->
    <div v-if="toast.show" class="toast" :class="toast.type">
      {{ toast.message }}
    </div>

    <!-- 成功弹窗 -->
    <div v-if="showSuccessModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-icon success">✓</div>
        <h2 class="modal-title">注册成功</h2>
        <p class="modal-message">{{ successMessage }}</p>
        <button class="modal-button" @click="closeModal">确定</button>
      </div>
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
const countdown = ref(0);
const showSuccessModal = ref(false);
const successMessage = ref('');
const showPassword = ref(false); // 密码可见性
const showConfirmPassword = ref(false); // 确认密码可见性
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

// 注册表单数据
const registerForm = reactive({
  phone_number: '',
  code: '',
  student_number: '',
  employee_number: '',
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
});

// 角色配置
const roleConfig = computed(() => {
  const configs = {
    teacher: {
      icon: '👨‍🏫',
      title: '教师注册',
      subtitle: '课程管理与教学'
    },
    student: {
      icon: '👨‍🎓',
      title: '学生注册',
      subtitle: '在线学习与考试'
    }
  };
  return configs[userRole.value] || configs.student;
});

const roleIcon = computed(() => roleConfig.value.icon);
const roleTitle = computed(() => roleConfig.value.title);
const roleSubtitle = computed(() => roleConfig.value.subtitle);

// 发送验证码（仅学生注册需要）
const sendCode = async () => {
  if (!registerForm.phone_number) {
    showToast('请先输入手机号', 'warning');
    return;
  }

  if (!/^1[3-9]\d{9}$/.test(registerForm.phone_number)) {
    showToast('请输入正确的手机号', 'warning');
    return;
  }

  try {
    await api.post('/student/auth/send-code-register', {
      phone_number: registerForm.phone_number
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

// 处理注册
const handleRegister = async () => {
  // 表单验证
  if (userRole.value === 'student') {
    if (!registerForm.phone_number) {
      showToast('请输入手机号', 'warning');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(registerForm.phone_number)) {
      showToast('请输入正确的手机号', 'warning');
      return;
    }
    if (!registerForm.code) {
      showToast('请输入验证码', 'warning');
      return;
    }
    if (registerForm.code.length !== 6) {
      showToast('验证码为6位数字', 'warning');
      return;
    }
    if (!registerForm.student_number) {
      showToast('请输入学号', 'warning');
      return;
    }
  } else {
    if (!registerForm.employee_number) {
      showToast('请输入工号', 'warning');
      return;
    }
    if (!registerForm.name) {
      showToast('请输入真实姓名', 'warning');
      return;
    }
    if (registerForm.name.length < 2 || registerForm.name.length > 10) {
      showToast('姓名长度在2-10个字符', 'warning');
      return;
    }
    if (!registerForm.phone_number) {
      showToast('请输入手机号', 'warning');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(registerForm.phone_number)) {
      showToast('请输入正确的手机号', 'warning');
      return;
    }
    if (!registerForm.email) {
      showToast('请输入学校邮箱', 'warning');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email)) {
      showToast('请输入正确的邮箱格式', 'warning');
      return;
    }
  }

  if (!registerForm.password) {
    showToast('请输入密码', 'warning');
    return;
  }
  if (registerForm.password.length < 6) {
    showToast('密码长度不能少于6位', 'warning');
    return;
  }
  if (!registerForm.confirmPassword) {
    showToast('请再次输入密码', 'warning');
    return;
  }
  if (registerForm.password !== registerForm.confirmPassword) {
    showToast('两次输入的密码不一致', 'warning');
    return;
  }

  loading.value = true;

  try {
    let response;

    if (userRole.value === 'student') {
      // 学生注册
      response = await api.post('/student/auth/register-sms', {
        phone_number: registerForm.phone_number,
        code: registerForm.code,
        student_number: registerForm.student_number,
        password: registerForm.password
      });
      successMessage.value = '注册成功！即将跳转到登录页面。';
    } else {
      // 教师注册
      response = await api.post('/register', {
        employee_number: registerForm.employee_number,
        name: registerForm.name,
        phone_number: registerForm.phone_number,
        email: registerForm.email,
        password: registerForm.password
      });
      successMessage.value = '注册成功！教师账号需要管理员审核后才能登录，请耐心等待。';
    }

    // 显示成功弹窗
    showSuccessModal.value = true;
  } catch (error) {
    console.error('注册失败:', error);
    showToast(error.message || '注册失败', 'error');
  } finally {
    loading.value = false;
  }
};

// 关闭成功弹窗并跳转
const closeModal = () => {
  showSuccessModal.value = false;
  router.push({
    path: '/login',
    query: { role: userRole.value }
  });
};

// 返回角色选择
const goBack = () => {
  router.push('/');
};

// 跳转到登录页面
const goToLogin = () => {
  router.push({
    path: '/login',
    query: { role: userRole.value }
  });
};

// 切换密码可见性
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

// 切换确认密码可见性
const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value;
};

// 组件卸载时清除定时器
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
});
</script>

<style scoped lang="scss">
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  overflow-y: auto;
}

.register-card {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  padding: 30px 25px;
  animation: slideUp 0.5s ease-out;
  max-height: 90vh;
  overflow-y: auto;

  /* 美化滚动条 */
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 2px;

    &:hover {
      background: #555;
    }
  }
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

.register-header {
  text-align: center;
  margin-bottom: 25px;

  .role-icon {
    font-size: 56px;
    margin-bottom: 12px;
  }

  .register-title {
    font-size: 22px;
    font-weight: 600;
    color: #333;
    margin: 0 0 6px 0;
  }

  .register-subtitle {
    font-size: 13px;
    color: #999;
    margin: 0;
  }
}

.register-form {
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
      border-color: #667eea;
      background: white;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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
    color: #667eea;
    background: white;
    border: 1px solid #667eea;
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
      border-color: #667eea;
    }
  }

  .alert-info {
    padding: 12px;
    background: #e6f7ff;
    border: 1px solid #91d5ff;
    border-radius: 8px;
    color: #0050b3;
    font-size: 13px;
    margin-bottom: 15px;
    line-height: 1.5;
  }
}

.register-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.register-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;

  .back-link,
  .login-link {
    color: #667eea;
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

// 成功弹窗
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 30px;
  width: 90%;
  max-width: 320px;
  text-align: center;
  animation: scaleIn 0.3s ease-out;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin: 0 auto 20px;

  &.success {
    background: #52c41a;
    color: white;
  }
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.modal-message {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin: 0 0 24px 0;
}

.modal-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  &:active {
    transform: scale(0.98);
  }
}

// 小屏幕适配
@media (max-width: 360px) {
  .register-card {
    padding: 25px 20px;
  }

  .register-header .role-icon {
    font-size: 48px;
  }

  .register-header .register-title {
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
