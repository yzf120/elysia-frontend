<template>
  <div class="profile-page">
    <van-nav-bar title="个人信息" left-arrow @click-left="$router.back()" class="fresh-nav-bar" />
    
    <div class="page-container">
      <!-- 用户信息卡片 -->
      <div class="user-card fade-in">
        <div class="user-avatar">
          <div class="avatar-icon">👨‍💼</div>
          <div class="avatar-ring"></div>
        </div>
        <div class="user-info">
          <h3>{{ userInfo.real_name || '管理员' }}</h3>
          <p>{{ userInfo.phone_number || '-' }}</p>
        </div>
      </div>

      <!-- 账号信息 -->
      <div class="info-section fade-in">
        <h4 class="section-title">账号信息</h4>
        <van-cell-group inset class="info-group">
          <van-cell title="手机号" :value="userInfo.phone_number || '-'" />
          <van-cell title="邮箱" :value="userInfo.email || '-'" />
          <van-cell title="真实姓名" :value="userInfo.real_name || '-'" />
          <van-cell title="最后登录" :value="userInfo.last_login_time || '-'" />
          <van-cell title="账号状态">
            <template #value>
              <van-tag :type="userInfo.status === 1 ? 'success' : 'danger'">
                {{ userInfo.status === 1 ? '正常' : '已禁用' }}
              </van-tag>
            </template>
          </van-cell>
        </van-cell-group>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons fade-in">
        <van-button round block type="primary" class="action-btn" @click="showPasswordDialog = true">
          修改密码
        </van-button>
        <van-button round block type="primary" class="action-btn" @click="showEmailDialog = true">
          绑定邮箱
        </van-button>
        <van-button round block type="danger" class="logout-btn" @click="handleLogout">
          退出登录
        </van-button>
      </div>
    </div>

    <!-- 修改密码弹窗 -->
    <van-dialog
      v-model:show="showPasswordDialog"
      title="修改密码"
      show-cancel-button
      @confirm="handleChangePassword"
      :before-close="handleBeforeClose"
    >
      <van-form ref="passwordFormRef" style="padding: 16px;">
        <van-field
          v-model="passwordForm.oldPassword"
          type="password"
          label="当前密码"
          placeholder="请输入当前密码"
          :rules="[{ required: true, message: '请输入当前密码' }]"
        />
        <van-field
          v-model="passwordForm.newPassword"
          type="password"
          label="新密码"
          placeholder="8-20位，包含字母和数字"
          :rules="[
            { required: true, message: '请输入新密码' },
            { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/, message: '密码格式不正确' }
          ]"
        />
        <van-field
          v-model="passwordForm.confirmPassword"
          type="password"
          label="确认密码"
          placeholder="请再次输入新密码"
          :rules="[
            { required: true, message: '请再次输入新密码' },
            { validator: validateConfirmPassword, message: '两次密码不一致' }
          ]"
        />
      </van-form>
    </van-dialog>

    <!-- 绑定邮箱弹窗 -->
    <van-dialog
      v-model:show="showEmailDialog"
      title="绑定邮箱"
      show-cancel-button
      @confirm="handleBindEmail"
      :before-close="handleBeforeClose"
    >
      <van-form ref="emailFormRef" style="padding: 16px;">
        <van-field
          v-model="emailForm.email"
          label="邮箱地址"
          placeholder="请输入邮箱地址"
          :rules="[
            { required: true, message: '请输入邮箱地址' },
            { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '邮箱格式不正确' }
          ]"
        >
          <template #button>
            <van-button size="small" type="primary" :disabled="emailCodeCountdown > 0" @click="handleSendEmailCode">
              {{ emailCodeCountdown > 0 ? `${emailCodeCountdown}秒` : '发送验证码' }}
            </van-button>
          </template>
        </van-field>
        <van-field
          v-model="emailForm.code"
          label="验证码"
          placeholder="请输入验证码"
          maxlength="6"
          :rules="[{ required: true, message: '请输入验证码' }]"
        />
      </van-form>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { adminAPI } from '@/api'

const router = useRouter()

const userInfo = ref({})
const showPasswordDialog = ref(false)
const showEmailDialog = ref(false)

// 修改密码表单
const passwordFormRef = ref(null)
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 绑定邮箱表单
const emailFormRef = ref(null)
const emailForm = ref({
  email: '',
  code: ''
})
const emailCodeCountdown = ref(0)
let emailCodeTimer = null

// 验证确认密码
const validateConfirmPassword = (val) => {
  return val === passwordForm.value.newPassword
}

// 加载用户信息
const loadUserInfo = async () => {
  try {
    const result = await adminAPI.getProfile()
    if (result.data && result.data.user_info) {
      userInfo.value = result.data.user_info
    }
  } catch (error) {
    showToast('加载用户信息失败')
    console.error('加载用户信息失败:', error)
  }
}

// 修改密码
const handleChangePassword = async () => {
  try {
    await passwordFormRef.value?.validate()
    
    await adminAPI.updatePassword(
      passwordForm.value.oldPassword,
      passwordForm.value.newPassword
    )
    
    showToast({ type: 'success', message: '密码修改成功，请重新登录' })
    showPasswordDialog.value = false
    
    setTimeout(() => {
      handleLogout()
    }, 1500)
  } catch (error) {
    if (error !== 'cancel') {
      showToast('修改失败：' + error)
    }
  }
}

// 发送邮箱验证码
const handleSendEmailCode = async () => {
  if (!emailForm.value.email) {
    showToast('请先输入邮箱地址')
    return
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.value.email)) {
    showToast('邮箱格式不正确')
    return
  }

  try {
    // TODO: 调用发送邮箱验证码API
    await new Promise(resolve => setTimeout(resolve, 1000))
    showToast({ type: 'success', message: '验证码已发送' })
    
    // 开始倒计时
    emailCodeCountdown.value = 60
    emailCodeTimer = setInterval(() => {
      emailCodeCountdown.value--
      if (emailCodeCountdown.value <= 0) {
        clearInterval(emailCodeTimer)
        emailCodeTimer = null
      }
    }, 1000)
  } catch (error) {
    showToast('发送失败：' + error)
  }
}

// 绑定邮箱
const handleBindEmail = async () => {
  try {
    await emailFormRef.value?.validate()
    
    await adminAPI.updateEmail(emailForm.value.email, emailForm.value.code)
    
    showToast({ type: 'success', message: '邮箱绑定成功' })
    showEmailDialog.value = false
    
    // 重新加载用户信息
    loadUserInfo()
  } catch (error) {
    if (error !== 'cancel') {
      showToast('绑定失败：' + error)
    }
  }
}

// 弹窗关闭前处理
const handleBeforeClose = (action) => {
  if (action === 'cancel') {
    return true
  }
  return false
}

// 退出登录
const handleLogout = async () => {
  showConfirmDialog({
    title: '提示',
    message: '确定要退出登录吗？'
  }).then(async () => {
    try {
      await adminAPI.logout()
    } catch (error) {
      console.error('退出登录失败:', error)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('userType')
      localStorage.removeItem('userId')
      localStorage.removeItem('userName')
      showToast({ type: 'success', message: '已退出登录' })
      router.push('/')
    }
  }).catch(() => {})
}

onMounted(() => {
  loadUserInfo()
})

onUnmounted(() => {
  if (emailCodeTimer) {
    clearInterval(emailCodeTimer)
  }
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #F5F7FB 0%, #FFFFFF 100%);
}

.fresh-nav-bar {
  background: #0F172A;
  :deep(.van-nav-bar__title) {
    color: white;
    font-weight: 600;
  }
  :deep(.van-icon) {
    color: white;
  }
}

.page-container {
  padding: 16px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFF 100%);
  border-radius: 20px;
  padding: 24px 20px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
  border: 1px solid #EAF0F8;
}

.user-avatar {
  position: relative;
  width: 72px;
  height: 72px;
  flex-shrink: 0;
}

.avatar-icon {
  font-size: 48px;
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4F6EF7 0%, #60A5FA 100%);
  border-radius: 50%;
  position: relative;
  z-index: 1;
}

.avatar-ring {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(79, 110, 247, 0.24), rgba(96, 165, 250, 0.16));
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.4;
  }
}

.user-info h3 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 4px;
  color: #0F172A;
}

.user-info p {
  font-size: 14px;
  color: #64748B;
}

.info-section {
  margin-bottom: 20px;
  animation: fadeIn 0.5s ease-out 0.1s both;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 12px;
  padding-left: 4px;
}

.info-group {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05);
  background: white;
}

.action-buttons {
  margin-top: 32px;
  animation: fadeIn 0.5s ease-out 0.2s both;
}

.action-btn {
  background: linear-gradient(135deg, #4F6EF7 0%, #60A5FA 100%) !important;
  border: none !important;
  box-shadow: 0 8px 16px rgba(79, 110, 247, 0.24);
  font-weight: 600;
  height: 48px;
  margin-bottom: 12px;
  transition: all 0.3s;
}

.action-btn:active {
  transform: scale(0.98);
  box-shadow: 0 4px 10px rgba(79, 110, 247, 0.3);
}

.logout-btn {
  background: linear-gradient(135deg, #F87171 0%, #EF4444 100%) !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(248, 113, 113, 0.3);
  font-weight: 600;
  height: 48px;
  transition: all 0.3s;
}

.logout-btn:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(248, 113, 113, 0.4);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 0.5s ease-out;
}

:deep(.van-dialog) {
  border-radius: 16px;
}

:deep(.van-field__button .van-button--primary) {
  background: linear-gradient(135deg, #4F6EF7, #60A5FA);
  border: none;
  font-weight: 600;
}
</style>