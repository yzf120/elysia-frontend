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

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
      >
        <!-- 密码登录 -->
        <template v-if="loginType === 'password'">
          <el-form-item prop="account">
            <el-input
              v-model="loginForm.account"
              :placeholder="accountPlaceholder"
              prefix-icon="User"
              clearable
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              prefix-icon="Lock"
              show-password
              clearable
              @keyup.enter="handleLogin"
            />
          </el-form-item>
        </template>

        <!-- 验证码登录 -->
        <template v-else>
          <el-form-item prop="phone_number">
            <el-input
              v-model="loginForm.phone_number"
              placeholder="请输入手机号"
              prefix-icon="Phone"
              clearable
            />
          </el-form-item>

          <el-form-item prop="code">
            <div class="code-input-wrapper">
              <el-input
                v-model="loginForm.code"
                placeholder="请输入验证码"
                prefix-icon="Message"
                clearable
                @keyup.enter="handleLogin"
              />
              <el-button
                class="send-code-btn"
                :disabled="countdown > 0"
                @click="sendCode"
              >
                {{ countdown > 0 ? `${countdown}秒后重试` : '发送验证码' }}
              </el-button>
            </div>
          </el-form-item>
        </template>

        <el-form-item>
          <el-button
            type="primary"
            class="login-button"
            :loading="loading"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>

        <div class="login-footer">
          <span class="back-link" @click="goBack">
            ← 返回选择身份
          </span>
          <span v-if="userRole !== 'admin'" class="register-link" @click="goToRegister">
            还没有账号？立即注册
          </span>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import api from '../services/index';

const router = useRouter();
const route = useRoute();
const loginFormRef = ref(null);
const loading = ref(false);
const loginType = ref('password'); // password 或 sms
const countdown = ref(0);
let countdownTimer = null;

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

// 表单验证规则
const loginRules = computed(() => {
  if (loginType.value === 'password') {
    const rules = {
      account: [
        { required: true, message: `请输入${accountPlaceholder.value.replace('请输入', '')}`, trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
      ]
    };
    
    // 管理员需要验证手机号格式
    if (userRole.value === 'admin') {
      rules.account.push({
        pattern: /^1[3-9]\d{9}$/,
        message: '请输入正确的手机号',
        trigger: 'blur'
      });
    }
    
    return rules;
  } else {
    return {
      phone_number: [
        { required: true, message: '请输入手机号', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
      ],
      code: [
        { required: true, message: '请输入验证码', trigger: 'blur' },
        { len: 6, message: '验证码为6位数字', trigger: 'blur' }
      ]
    };
  }
});

// 发送验证码
const sendCode = async () => {
  if (!loginForm.phone_number) {
    ElMessage.warning('请先输入手机号');
    return;
  }

  if (!/^1[3-9]\d{9}$/.test(loginForm.phone_number)) {
    ElMessage.warning('请输入正确的手机号');
    return;
  }

  try {
    const endpoint = userRole.value === 'admin' 
      ? '/admin/auth/send-code-login'
      : '/teacher/auth/send-code-login';

    await api.post(endpoint, {
      phone_number: loginForm.phone_number
    });

    ElMessage.success('验证码已发送');
    
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
  }
};

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return;

  try {
    await loginFormRef.value.validate();
    loading.value = true;

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

    // 保存用户信息和token
    localStorage.setItem('token', response.token);
    localStorage.setItem('userType', userRole.value);
    localStorage.setItem('userInfo', JSON.stringify(response.user_info));

    ElMessage.success('登录成功！');

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

// 组件卸载时清除定时器
onMounted(() => {
  return () => {
    if (countdownTimer) {
      clearInterval(countdownTimer);
    }
  };
});
</script>

<style scoped lang="scss">
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 480px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 40px;
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
  margin-bottom: 30px;

  .role-icon {
    font-size: 64px;
    margin-bottom: 15px;
  }

  .login-title {
    font-size: 24px;
    font-weight: 600;
    color: #333;
    margin: 0 0 8px 0;
  }

  .login-subtitle {
    font-size: 14px;
    color: #999;
    margin: 0;
  }
}

.login-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 25px;
  border-bottom: 2px solid #f0f0f0;

  .tab-item {
    flex: 1;
    text-align: center;
    padding: 12px 0;
    font-size: 15px;
    color: #666;
    cursor: pointer;
    position: relative;
    transition: all 0.3s;

    &.active {
      color: #667eea;
      font-weight: 500;

      &::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
    }

    &:hover:not(.active) {
      color: #333;
    }
  }
}

.login-form {
  :deep(.el-form-item__label) {
    display: none;
  }

  :deep(.el-input__wrapper) {
    border-radius: 8px;
    padding: 12px 15px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 2px 12px rgba(102, 126, 234, 0.2);
    }
  }

  :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 2px 12px rgba(102, 126, 234, 0.3);
  }

  .code-input-wrapper {
    display: flex;
    gap: 10px;

    :deep(.el-input) {
      flex: 1;
    }

    .send-code-btn {
      flex-shrink: 0;
      width: 120px;
      border-radius: 8px;
    }
  }
}

.login-button {
  width: 100%;
  height: 45px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
}

.login-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;

  .back-link,
  .register-link {
    color: #667eea;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      color: #764ba2;
      text-decoration: underline;
    }
  }
}
</style>
