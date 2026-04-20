<template>
  <div class="admin-layout">
    <AdminSidebar :active-menu="activeMenu" />

    <!-- 主内容区 -->
    <div class="admin-main">
      <!-- 顶部导航栏 -->
      <el-header class="admin-header" height="60px">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/admin/dashboard' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>个人中心</el-breadcrumb-item>
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
            <!-- 个人信息 Tab -->
            <el-tab-pane label="个人信息" name="profile">
              <el-card class="card-shadow" style="margin-bottom: 24px;">
                <template #header>
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <el-icon :size="18" color="#4F6EF7"><User /></el-icon>
                      <span style="font-weight: 600;">账号信息</span>
                    </div>
                    <el-button v-if="!editingProfile" type="primary" size="small" @click="startEditProfile">
                      <el-icon><Edit /></el-icon>
                      修改信息
                    </el-button>
                    <div v-else style="display: flex; gap: 8px;">
                      <el-button type="primary" size="small" @click="saveProfile" :loading="savingProfile">
                        <el-icon><Check /></el-icon>
                        保存
                      </el-button>
                      <el-button size="small" @click="cancelEditProfile">
                        <el-icon><Close /></el-icon>
                        取消
                      </el-button>
                    </div>
                  </div>
                </template>

                <div v-loading="loading">
                  <!-- 查看模式 -->
                  <el-descriptions v-if="!editingProfile" :column="2" border>
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

                  <!-- 编辑模式 -->
                  <el-form v-else :model="profileForm" label-width="120px" style="max-width: 700px;">
                    <!-- 手机号（需要验证码） -->
                    <el-form-item label="手机号">
                      <div style="display: flex; gap: 8px; width: 100%;">
                        <el-input
                          v-model="profileForm.phone_number"
                          placeholder="请输入新手机号"
                          maxlength="11"
                          style="flex: 1;"
                        />
                        <el-button
                          type="primary"
                          :disabled="phoneCodeCountdown > 0 || !profileForm.phone_number || profileForm.phone_number.length !== 11"
                          :loading="sendingPhoneCode"
                          @click="handleSendPhoneCode"
                        >
                          {{ phoneCodeCountdown > 0 ? `${phoneCodeCountdown}秒后重试` : '发送验证码' }}
                        </el-button>
                      </div>
                    </el-form-item>
                    <el-form-item label="手机验证码" v-if="phoneCodeSent">
                      <el-input
                        v-model="profileForm.phone_code"
                        placeholder="请输入手机验证码"
                        maxlength="6"
                        style="max-width: 300px;"
                      />
                    </el-form-item>

                    <!-- 真实姓名（直接编辑） -->
                    <el-form-item label="真实姓名">
                      <el-input
                        v-model="profileForm.real_name"
                        placeholder="请输入真实姓名"
                        style="max-width: 400px;"
                      />
                    </el-form-item>

                    <!-- 邮箱（直接编辑，不用验证） -->
                    <el-form-item label="邮箱">
                      <el-input
                        v-model="profileForm.email"
                        placeholder="请输入邮箱地址"
                        style="max-width: 400px;"
                      />
                    </el-form-item>

                    <!-- 以下为只读字段 -->
                    <el-form-item label="角色">
                      <el-tag type="danger">管理员</el-tag>
                    </el-form-item>
                    <el-form-item label="账号状态">
                      <el-tag :type="userInfo.status === 1 ? 'success' : 'danger'">
                        {{ userInfo.status === 1 ? '正常' : '已禁用' }}
                      </el-tag>
                    </el-form-item>
                  </el-form>
                </div>
              </el-card>
            </el-tab-pane>

            <!-- 安全设置 Tab -->
            <el-tab-pane label="安全设置" name="security">
              <!-- 修改密码 -->
              <el-card class="card-shadow" style="margin-bottom: 24px;">
                <template #header>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <el-icon :size="18" color="#E6A23C"><Lock /></el-icon>
                    <span style="font-weight: 600;">修改密码</span>
                  </div>
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
            </el-tab-pane>
          </el-tabs>
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
const activeTab = ref('profile');

// 用户信息
const userInfo = ref({});
const loading = ref(false);

// 编辑个人信息
const editingProfile = ref(false);
const savingProfile = ref(false);
const profileForm = ref({
  phone_number: '',
  phone_code: '',
  real_name: '',
  email: ''
});

// 手机号验证码
const sendingPhoneCode = ref(false);
const phoneCodeCountdown = ref(0);
const phoneCodeSent = ref(false);
let phoneCodeTimer = null;

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

// 开始编辑个人信息
const startEditProfile = () => {
  profileForm.value = {
    phone_number: userInfo.value.phone_number || '',
    phone_code: '',
    real_name: userInfo.value.real_name || '',
    email: userInfo.value.email || ''
  };
  phoneCodeSent.value = false;
  editingProfile.value = true;
};

// 取消编辑
const cancelEditProfile = () => {
  editingProfile.value = false;
  phoneCodeSent.value = false;
  phoneCodeCountdown.value = 0;
  if (phoneCodeTimer) {
    clearInterval(phoneCodeTimer);
    phoneCodeTimer = null;
  }
};

// 发送修改手机号验证码
const handleSendPhoneCode = async () => {
  if (!profileForm.value.phone_number || profileForm.value.phone_number.length !== 11) {
    ElMessage.warning('请输入正确的11位手机号');
    return;
  }

  sendingPhoneCode.value = true;
  try {
    await adminAPI.sendUpdatePhoneCode(profileForm.value.phone_number);
    ElMessage.success('验证码已发送');
    phoneCodeSent.value = true;

    // 开始倒计时
    phoneCodeCountdown.value = 60;
    phoneCodeTimer = setInterval(() => {
      phoneCodeCountdown.value--;
      if (phoneCodeCountdown.value <= 0) {
        clearInterval(phoneCodeTimer);
        phoneCodeTimer = null;
      }
    }, 1000);
  } catch (error) {
    ElMessage.error('发送失败：' + error);
  } finally {
    sendingPhoneCode.value = false;
  }
};

// 保存个人信息
const saveProfile = async () => {
  savingProfile.value = true;
  try {
    const promises = [];
    let phoneChanged = false;

    // 检查手机号是否变更
    if (profileForm.value.phone_number !== userInfo.value.phone_number) {
      if (!profileForm.value.phone_code) {
        ElMessage.warning('修改手机号需要输入验证码');
        savingProfile.value = false;
        return;
      }
      phoneChanged = true;
      promises.push(
        adminAPI.updatePhone(profileForm.value.phone_number, profileForm.value.phone_code)
      );
    }

    // 检查真实姓名是否变更
    if (profileForm.value.real_name !== userInfo.value.real_name) {
      promises.push(adminAPI.updateRealName(profileForm.value.real_name));
    }

    // 检查邮箱是否变更
    if (profileForm.value.email !== userInfo.value.email) {
      promises.push(adminAPI.updateEmail(profileForm.value.email));
    }

    if (promises.length === 0) {
      ElMessage.info('没有需要修改的内容');
      savingProfile.value = false;
      return;
    }

    // 并行执行所有更新请求
    await Promise.all(promises);
    ElMessage.success('个人信息修改成功');
    editingProfile.value = false;
    phoneCodeSent.value = false;

    // 重新加载用户信息
    await loadUserInfo();
  } catch (error) {
    ElMessage.error('修改失败：' + error);
  } finally {
    savingProfile.value = false;
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

        // 清除缓存并跳转到登录页
        setTimeout(() => {
    localStorage.clear();
          window.location.href = '/';
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

onMounted(() => {
  loadUserInfo();
});

onUnmounted(() => {
  if (phoneCodeTimer) {
    clearInterval(phoneCodeTimer);
  }
});
</script>

<style scoped>
@import '@/styles/admin.css';
</style>