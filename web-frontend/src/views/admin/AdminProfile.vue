<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <el-aside width="240px" class="admin-sidebar">
      <div class="sidebar-logo">
        <el-icon style="margin-right: 8px;"><Platform /></el-icon>
        Elysia 管理端
      </div>
      <el-menu
        :default-active="activeMenu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <span>管理员首页</span>
        </el-menu-item>
        <el-menu-item index="/admin/knowledge">
          <el-icon><Reading /></el-icon>
          <span>知识库管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/models">
          <el-icon><Setting /></el-icon>
          <span>模型管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

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
          <el-tabs v-model="activeTab" type="card">
            <!-- 基本信息 Tab -->
            <el-tab-pane label="基本信息" name="basic">
              <el-card class="card-shadow" style="margin-bottom: 24px;">
                <template #header>
                  <span style="font-weight: 600;">账号信息</span>
                </template>

                <el-descriptions :column="2" border>
                  <el-descriptions-item label="手机号">{{ userInfo.phoneNumber }}</el-descriptions-item>
                  <el-descriptions-item label="角色">
                    <el-tag type="danger">管理员</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="注册时间">{{ userInfo.registerTime }}</el-descriptions-item>
                  <el-descriptions-item label="最后登录">{{ userInfo.lastLoginTime }}</el-descriptions-item>
                  <el-descriptions-item label="账号状态" :span="2">
                    <el-tag type="success">正常</el-tag>
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
            </el-tab-pane>

            <!-- 安全设置 Tab -->
            <el-tab-pane label="安全设置" name="security">
              <el-card class="card-shadow" style="margin-bottom: 24px;">
                <template #header>
                  <span style="font-weight: 600;">SSO TOKEN 状态</span>
                </template>

                <el-descriptions :column="1" border>
                  <el-descriptions-item label="Token状态">
                    <el-tag :type="tokenInfo.valid ? 'success' : 'danger'">
                      {{ tokenInfo.valid ? '有效' : '已失效' }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="Token创建时间">{{ tokenInfo.createTime }}</el-descriptions-item>
                  <el-descriptions-item label="Token过期时间">{{ tokenInfo.expireTime }}</el-descriptions-item>
                  <el-descriptions-item label="剩余有效期">{{ tokenInfo.remainingDays }} 天</el-descriptions-item>
                </el-descriptions>

                <div style="margin-top: 20px;">
                  <el-button type="warning" @click="handleRefreshToken" :loading="refreshingToken">
                    <el-icon><RefreshRight /></el-icon>
                    刷新Token
                  </el-button>
                  <el-alert
                    title="Token即将过期时系统会自动刷新，无需手动操作"
                    type="info"
                    :closable="false"
                    style="margin-top: 12px;"
                  />
                </div>
              </el-card>

              <el-card class="card-shadow">
                <template #header>
                  <span style="font-weight: 600;">登录日志</span>
                </template>

                <el-table :data="loginLogs" stripe>
                  <el-table-column prop="time" label="登录时间" width="180" />
                  <el-table-column prop="ip" label="IP地址" width="150" />
                  <el-table-column prop="location" label="登录地点" min-width="150" />
                  <el-table-column prop="device" label="设备" min-width="200" />
                  <el-table-column prop="status" label="状态" width="100">
                    <template #default="{ row }">
                      <el-tag :type="row.status === '成功' ? 'success' : 'danger'">
                        {{ row.status }}
                      </el-tag>
                    </template>
                  </el-table-column>
                </el-table>

                <el-pagination
                  v-model:current-page="logPage"
                  v-model:page-size="logPageSize"
                  :total="logTotal"
                  :page-sizes="[10, 20, 50]"
                  layout="total, sizes, prev, pager, next, jumper"
                  style="margin-top: 20px;"
                />
              </el-card>
            </el-tab-pane>
          </el-tabs>

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
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();
const activeTab = ref('basic');
const activeMenu = computed(() => router.currentRoute.value.path);

// 用户信息
const userInfo = ref({
  phoneNumber: '13800138000',
  registerTime: '2025-01-01 10:00:00',
  lastLoginTime: '2026-02-07 19:30:00'
});

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

// Token信息
const tokenInfo = ref({
  valid: true,
  createTime: '2026-02-07 10:00:00',
  expireTime: '2026-03-07 10:00:00',
  remainingDays: 28
});
const refreshingToken = ref(false);

// 登录日志
const loginLogs = ref([
  {
    time: '2026-02-07 19:30:00',
    ip: '192.168.1.100',
    location: '北京市',
    device: 'Chrome 120 / macOS',
    status: '成功'
  },
  {
    time: '2026-02-06 09:15:00',
    ip: '192.168.1.100',
    location: '北京市',
    device: 'Chrome 120 / macOS',
    status: '成功'
  }
]);
const logPage = ref(1);
const logPageSize = ref(10);
const logTotal = ref(2);

const loggingOut = ref(false);

// 修改密码
const handleChangePassword = async () => {
  if (!passwordFormRef.value) return;

  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      changingPassword.value = true;
      try {
        // TODO: 调用API修改密码
        await new Promise(resolve => setTimeout(resolve, 1000));
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
    // TODO: 调用API发送验证码
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
        // TODO: 调用API绑定邮箱
        await new Promise(resolve => setTimeout(resolve, 1000));
        ElMessage.success('邮箱绑定成功');
        resetEmailForm();
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

// 刷新Token
const handleRefreshToken = () => {
  ElMessageBox.confirm(
    '确定要刷新Token吗？刷新后需要重新登录。',
    '确认刷新',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    refreshingToken.value = true;
    try {
      // TODO: 调用API刷新Token
      await new Promise(resolve => setTimeout(resolve, 1000));
      ElMessage.success('Token刷新成功，请重新登录');
      
      setTimeout(() => {
        handleLogout();
      }, 1500);
    } catch (error) {
      ElMessage.error('刷新失败：' + error);
    } finally {
      refreshingToken.value = false;
    }
  });
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
      // TODO: 调用API退出登录
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
  // 加载用户信息
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
