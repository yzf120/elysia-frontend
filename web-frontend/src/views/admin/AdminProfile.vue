<template>
  <div class="admin-layout">
    <AdminSidebar :active-menu="activeMenu" />

    <!-- 主内容区 -->
    <div class="admin-main">
      <!-- 顶部导航栏 -->
      <el-header class="admin-header" height="60px">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/admin/dashboard' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>个人信息中心</el-breadcrumb-item>
        </el-breadcrumb>
        <div class="header-actions">
          <el-button @click="$router.push('/admin/dashboard')">
            <el-icon><Back /></el-icon>
            返回首页
          </el-button>
        </div>
      </el-header>

      <!-- 内容区域 -->
      <div class="admin-content">
        <div class="page-container fade-in">
          <!-- 基本信息卡片 -->
          <el-card class="card-shadow" style="margin-bottom: 24px;">
            <template #header>
              <span style="font-weight: 600;">账号信息</span>
            </template>

            <el-descriptions :column="2" border>
              <el-descriptions-item label="手机号">{{ userInfo.phone_number || '-' }}</el-descriptions-item>
              <el-descriptions-item label="角色">
                <el-tag type="danger">管理员</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="邮箱">{{ userInfo.email || '-' }}</el-descriptions-item>
              <el-descriptions-item label="真实姓名">{{ userInfo.real_name || '-' }}</el-descriptions-item>
              <el-descriptions-item label="最后登录时间">{{ userInfo.last_login_time || '-' }}</el-descriptions-item>
              <el-descriptions-item label="最后登录IP">{{ userInfo.last_login_ip || '-' }}</el-descriptions-item>
              <el-descriptions-item label="账号状态" :span="2">
                <el-tag :type="userInfo.status === 1 ? 'success' : 'danger'">
                  {{ userInfo.status === 1 ? '正常' : '已禁用' }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card class="card-shadow" style="margin-bottom: 24px;">
            <template #header>
              <span style="font-weight: 600;">修改密码</span>
            </template>

            <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="120px" style="max-width: 600px;">
              <el-form-item label="当前密码" prop="oldPassword">
                <el-input
                  v-model="passwordForm.oldPassword"
                  type="password"
                  placeholder="请输入当前密码"
                  show-password
                />
              </el-form-item>

              <el-form-item label="新密码" prop="newPassword">
                <el-input
                  v-model="passwordForm.newPassword"
                  type="password"
                  placeholder="请输入新密码（8-20位，包含字母和数字）"
                  show-password
                />
              </el-form-item>

              <el-form-item label="确认新密码" prop="confirmPassword">
                <el-input
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  placeholder="请再次输入新密码"
                  show-password
                />
              </el-form-item>

              <el-form-item>
                <el-button type="primary" @click="handleChangePassword" :loading="changingPassword">
                  <el-icon><Check /></el-icon>
                  修改密码
                </el-button>
                <el-button @click="resetPasswordForm">
                  <el-icon><Refresh /></el-icon>
                  重置
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>

          <el-card class="card-shadow">
            <template #header>
              <span style="font-weight: 600;">绑定邮箱</span>
            </template>

            <el-form :model="emailForm" :rules="emailRules" ref="emailFormRef" label-width="120px" style="max-width: 600px;">
              <el-form-item label="邮箱地址" prop="email">
                <el-input
                  v-model="emailForm.email"
                  placeholder="请输入邮箱地址"
                >
                  <template #append>
                    <el-button @click="handleSendEmailCode" :loading="sendingEmailCode" :disabled="emailCodeCountdown > 0">
                      {{ emailCodeCountdown > 0 ? `${emailCodeCountdown}秒后重试` : '发送验证码' }}
                    </el-button>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item label="验证码" prop="code">
                <el-input
                  v-model="emailForm.code"
                  placeholder="请输入邮箱验证码"
                  maxlength="6"
                />
              </el-form-item>

              <el-form-item>
                <el-button type="primary" @click="handleBindEmail" :loading="bindingEmail">
                  <el-icon><Check /></el-icon>
                  绑定邮箱
                </el-button>
                <el-button @click="resetEmailForm">
                  <el-icon><Refresh /></el-icon>
                  重置
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>

          <!-- 退出登录按钮 -->
          <el-card class="card-shadow" style="margin-top: 24px;">
            <el-button type="danger" @click="handleLogout" :loading="loggingOut" size="large">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-button>
            <span style="margin-left: 12px; color: #909399; font-size: 14px;">
              退出后将清除会话缓存，返回登录页
            </span>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import AdminSidebar from '@/components/admin/AdminSidebar.vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminAPI } from '@/services';

const router = useRouter();
const activeMenu = computed(() => router.currentRoute.value.path);

// 用户信息
const userInfo = ref({});
const loading = ref(false);

// 修改密码
const passwordFormRef = ref(null);
const changingPassword = ref(false);
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const validatePassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入新密码'));
  } else if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/.test(value)) {
    callback(new Error('密码必须为8-20位，包含字母和数字'));
  } else {
    if (passwordForm.value.confirmPassword !== '') {
      passwordFormRef.value?.validateField('confirmPassword');
    }
    callback();
  }
};

const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入新密码'));
  } else if (value !== passwordForm.value.newPassword) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [{ required: true, validator: validatePassword, trigger: 'blur' }],
  confirmPassword: [{ required: true, validator: validateConfirmPassword, trigger: 'blur' }]
};

// 绑定邮箱
const emailFormRef = ref(null);
const bindingEmail = ref(false);
const sendingEmailCode = ref(false);
const emailCodeCountdown = ref(0);
let emailCodeTimer = null;

const emailForm = ref({
  email: '',
  code: ''
});

const emailRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位数字', trigger: 'blur' }
  ]
};

const loggingOut = ref(false);

// 加载用户信息
const loadUserInfo = async () => {
  loading.value = true;
  try {
    const result = await adminAPI.getProfile();
    if (result.data && result.data.user_info) {
      userInfo.value = result.data.user_info;
    }
  } catch (error) {
    ElMessage.error('加载用户信息失败：' + error);
  } finally {
    loading.value = false;
  }
};

// 修改密码
const handleChangePassword = async () => {
  if (!passwordFormRef.value) return;

  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      changingPassword.value = true;
      try {
        await adminAPI.updatePassword(
          passwordForm.value.oldPassword,
          passwordForm.value.newPassword
        );
        ElMessage.success('密码修改成功，请重新登录');
        
        setTimeout(() => {
          handleLogout();
        }, 1500);
      } catch (error) {
        ElMessage.error('修改失败：' + error);
      } finally {
        changingPassword.value = false;
      }
    }
  });
};

// 重置密码表单
const resetPasswordForm = () => {
  passwordFormRef.value?.resetFields();
};

// 发送邮箱验证码
const handleSendEmailCode = async () => {
  if (!emailForm.value.email) {
    ElMessage.warning('请先输入邮箱地址');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.value.email)) {
    ElMessage.warning('请输入正确的邮箱地址');
    return;
  }

  sendingEmailCode.value = true;
  try {
    // TODO: 调用发送邮箱验证码API
    await new Promise(resolve => setTimeout(resolve, 1000));
    ElMessage.success('验证码已发送');
    
    // 开始倒计时
    emailCodeCountdown.value = 60;
    emailCodeTimer = setInterval(() => {
      emailCodeCountdown.value--;
      if (emailCodeCountdown.value <= 0) {
        clearInterval(emailCodeTimer);
        emailCodeTimer = null;
      }
    }, 1000);
  } catch (error) {
    ElMessage.error('发送失败：' + error);
  } finally {
    sendingEmailCode.value = false;
  }
};

// 绑定邮箱
const handleBindEmail = async () => {
  if (!emailFormRef.value) return;

  await emailFormRef.value.validate(async (valid) => {
    if (valid) {
      bindingEmail.value = true;
      try {
        await adminAPI.updateEmail(emailForm.value.email, emailForm.value.code);
        ElMessage.success('邮箱绑定成功');
        resetEmailForm();
        // 重新加载用户信息
        loadUserInfo();
      } catch (error) {
        ElMessage.error('绑定失败：' + error);
      } finally {
        bindingEmail.value = false;
      }
    }
  });
};

// 重置邮箱表单
const resetEmailForm = () => {
  emailFormRef.value?.resetFields();
};

// 退出登录
const handleLogout = () => {
  ElMessageBox.confirm(
    '确定要退出登录吗？',
    '确认退出',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    loggingOut.value = true;
    try {
      await adminAPI.logout();
      
      // 清除缓存
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('userType');
      
      ElMessage.success('已退出登录');
      
      // 跳转到登录页
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error) {
      ElMessage.error('退出失败：' + error);
      loggingOut.value = false;
    }
  }).catch(() => {
    // 取消退出
  });
};

onMounted(() => {
  loadUserInfo();
});

onUnmounted(() => {
  if (emailCodeTimer) {
    clearInterval(emailCodeTimer);
  }
});
</script>

<style scoped>
@import '@/styles/admin.css';
</style>
