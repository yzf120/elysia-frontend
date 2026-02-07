<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <div class="role-icon">{{ roleIcon }}</div>
        <h1 class="register-title">{{ roleTitle }}</h1>
        <p class="register-subtitle">{{ roleSubtitle }}</p>
      </div>

      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        class="register-form"
        label-position="top"
      >
        <!-- 学生注册 -->
        <template v-if="userRole === 'student'">
          <el-form-item label="手机号" prop="phone_number">
            <div class="code-input-wrapper">
              <el-input
                v-model="registerForm.phone_number"
                placeholder="请输入手机号"
                prefix-icon="Phone"
                clearable
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

          <el-form-item label="验证码" prop="code">
            <el-input
              v-model="registerForm.code"
              placeholder="请输入验证码"
              prefix-icon="Message"
              clearable
            />
          </el-form-item>

          <el-form-item label="学号" prop="student_number">
            <el-input
              v-model="registerForm.student_number"
              placeholder="请输入学号"
              prefix-icon="User"
              clearable
            />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="请输入密码（至少6位）"
              prefix-icon="Lock"
              show-password
              clearable
            />
          </el-form-item>

          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              prefix-icon="Lock"
              show-password
              clearable
            />
          </el-form-item>
        </template>

        <!-- 教师注册 -->
        <template v-else>
          <el-form-item label="工号" prop="employee_number">
            <el-input
              v-model="registerForm.employee_number"
              placeholder="请输入工号"
              prefix-icon="User"
              clearable
            />
          </el-form-item>

          <el-form-item label="姓名" prop="name">
            <el-input
              v-model="registerForm.name"
              placeholder="请输入真实姓名"
              prefix-icon="UserFilled"
              clearable
            />
          </el-form-item>

          <el-form-item label="手机号" prop="phone_number">
            <el-input
              v-model="registerForm.phone_number"
              placeholder="请输入手机号"
              prefix-icon="Phone"
              clearable
            />
          </el-form-item>

          <el-form-item label="学校邮箱" prop="email">
            <el-input
              v-model="registerForm.email"
              placeholder="请输入学校邮箱"
              prefix-icon="Message"
              clearable
            />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="请输入密码（至少6位）"
              prefix-icon="Lock"
              show-password
              clearable
            />
          </el-form-item>

          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              prefix-icon="Lock"
              show-password
              clearable
            />
          </el-form-item>

          <el-alert
            title="教师账号需要管理员审核后才能使用"
            type="info"
            :closable="false"
            show-icon
            style="margin-bottom: 20px;"
          />
        </template>

        <el-form-item>
          <el-button
            type="primary"
            class="register-button"
            :loading="loading"
            @click="handleRegister"
          >
            {{ loading ? '注册中...' : '立即注册' }}
          </el-button>
        </el-form-item>

        <div class="register-footer">
          <span class="back-link" @click="goBack">
            ← 返回选择身份
          </span>
          <span class="login-link" @click="goToLogin">
            已有账号？立即登录
          </span>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '../services/index';

const router = useRouter();
const route = useRoute();
const registerFormRef = ref(null);
const loading = ref(false);
const countdown = ref(0);
let countdownTimer = null;

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

// 验证确认密码
const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'));
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

// 表单验证规则
const registerRules = computed(() => {
  const commonRules = {
    phone_number: [
      { required: true, message: '请输入手机号', trigger: 'blur' },
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
    ],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
    ],
    confirmPassword: [
      { required: true, validator: validateConfirmPassword, trigger: 'blur' }
    ]
  };

  if (userRole.value === 'student') {
    return {
      ...commonRules,
      code: [
        { required: true, message: '请输入验证码', trigger: 'blur' },
        { len: 6, message: '验证码为6位数字', trigger: 'blur' }
      ],
      student_number: [
        { required: true, message: '请输入学号', trigger: 'blur' }
      ]
    };
  } else {
    return {
      ...commonRules,
      employee_number: [
        { required: true, message: '请输入工号', trigger: 'blur' }
      ],
      name: [
        { required: true, message: '请输入真实姓名', trigger: 'blur' },
        { min: 2, max: 10, message: '姓名长度在2-10个字符', trigger: 'blur' }
      ],
      email: [
        { required: true, message: '请输入学校邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
      ]
    };
  }
});

// 发送验证码（仅学生注册需要）
const sendCode = async () => {
  if (!registerForm.phone_number) {
    ElMessage.warning('请先输入手机号');
    return;
  }

  if (!/^1[3-9]\d{9}$/.test(registerForm.phone_number)) {
    ElMessage.warning('请输入正确的手机号');
    return;
  }

  try {
    await api.post('/student/auth/send-code-register', {
      phone_number: registerForm.phone_number
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

// 处理注册
const handleRegister = async () => {
  if (!registerFormRef.value) return;

  try {
    await registerFormRef.value.validate();
    loading.value = true;

    let response;
    let successMessage;

    if (userRole.value === 'student') {
      // 学生注册
      response = await api.post('/student/auth/register-sms', {
        phone_number: registerForm.phone_number,
        code: registerForm.code,
        student_number: registerForm.student_number,
        password: registerForm.password
      });
      successMessage = '注册成功！即将跳转到登录页面。';
    } else {
      // 教师注册
      response = await api.post('/register', {
        employee_number: registerForm.employee_number,
        name: registerForm.name,
        phone_number: registerForm.phone_number,
        email: registerForm.email,
        password: registerForm.password
      });
      successMessage = '注册成功！教师账号需要管理员审核后才能登录，请耐心等待。';
    }

    // 注册成功，弹窗提示
    await ElMessageBox.alert(
      successMessage,
      '注册成功',
      {
        confirmButtonText: '确定',
        type: 'success',
        callback: () => {
          // 跳转到登录页面
          router.push({
            path: '/login',
            query: { role: userRole.value }
          });
        }
      }
    );
  } catch (error) {
    console.error('注册失败:', error);
  } finally {
    loading.value = false;
  }
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
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-card {
  width: 100%;
  max-width: 500px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 40px;
  animation: slideUp 0.5s ease-out;
  max-height: 90vh;
  overflow-y: auto;

  /* 美化滚动条 */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;

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
  margin-bottom: 30px;

  .role-icon {
    font-size: 64px;
    margin-bottom: 15px;
  }

  .register-title {
    font-size: 24px;
    font-weight: 600;
    color: #333;
    margin: 0 0 8px 0;
  }

  .register-subtitle {
    font-size: 14px;
    color: #999;
    margin: 0;
  }
}

.register-form {
  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #333;
    padding-bottom: 8px;
  }

  :deep(.el-input__wrapper) {
    border-radius: 8px;
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

.register-button {
  width: 100%;
  height: 45px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s;
  margin-top: 10px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }

  &:active {
    transform: translateY(0);
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
