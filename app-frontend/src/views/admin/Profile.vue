<template>
  <div class="profile-page">
    <van-nav-bar title="个人中心" left-arrow @click-left="$router.back()" class="fresh-nav-bar" />
    
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

      <!-- Tab 切换 -->
      <van-tabs v-model:active="activeTab" animated swipeable class="profile-tabs fade-in">
        <!-- 个人信息 Tab -->
        <van-tab title="个人信息" name="profile">
          <div class="tab-content">
            <div class="info-section">
              <van-cell-group inset class="info-group">
                <van-cell title="手机号" :value="userInfo.phone_number || '-'" is-link @click="showPhoneDialog = true" />
                <van-cell title="真实姓名" :value="userInfo.real_name || '-'" is-link @click="showRealNameDialog = true" />
                <van-cell title="邮箱" :value="userInfo.email || '-'" is-link @click="showEmailDialog = true" />
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
          </div>
        </van-tab>

        <!-- 安全设置 Tab -->
        <van-tab title="安全设置" name="security">
          <div class="tab-content">
            <div class="security-section">
              <van-cell-group inset class="info-group">
                <van-cell title="修改密码" is-link @click="showPasswordDialog = true">
                  <template #label>
                    <span class="cell-hint">定期修改密码，保障账号安全</span>
                  </template>
                </van-cell>
              </van-cell-group>
            </div>
          </div>
        </van-tab>
      </van-tabs>
    </div>

    <!-- 修改手机号弹窗 -->
    <van-dialog
      v-model:show="showPhoneDialog"
      title="修改手机号"
      show-cancel-button
      @confirm="handleUpdatePhone"
      :before-close="handlePhoneDialogClose"
    >
      <van-form ref="phoneFormRef" style="padding: 16px;">
        <van-field
          v-model="phoneForm.phone_number"
          label="新手机号"
          placeholder="请输入新手机号"
          maxlength="11"
          type="tel"
          :rules="[
            { required: true, message: '请输入手机号' },
            { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
          ]"
        >
          <template #button>
            <van-button
              size="small"
              type="primary"
              :disabled="phoneCodeCountdown > 0 || !phoneForm.phone_number || phoneForm.phone_number.length !== 11"
              @click="handleSendPhoneCode"
              :loading="sendingPhoneCode"
            >
              {{ phoneCodeCountdown > 0 ? `${phoneCodeCountdown}秒` : '发送验证码' }}
            </van-button>
          </template>
        </van-field>
        <van-field
          v-model="phoneForm.code"
          label="验证码"
          placeholder="请输入验证码"
          maxlength="6"
          type="digit"
          :rules="[{ required: true, message: '请输入验证码' }]"
        />
      </van-form>
    </van-dialog>

    <!-- 修改真实姓名弹窗 -->
    <van-dialog
      v-model:show="showRealNameDialog"
      title="修改真实姓名"
      show-cancel-button
      @confirm="handleUpdateRealName"
      :before-close="handleRealNameDialogClose"
    >
      <van-form ref="realNameFormRef" style="padding: 16px;">
        <van-field
          v-model="realNameForm.real_name"
          label="真实姓名"
          placeholder="请输入真实姓名"
          :rules="[{ required: true, message: '请输入真实姓名' }]"
        />
      </van-form>
    </van-dialog>

    <!-- 修改邮箱弹窗 -->
    <van-dialog
      v-model:show="showEmailDialog"
      title="修改邮箱"
      show-cancel-button
      @confirm="handleUpdateEmail"
      :before-close="handleEmailDialogClose"
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
        />
      </van-form>
    </van-dialog>

    <!-- 修改密码弹窗 -->
    <van-dialog
      v-model:show="showPasswordDialog"
      title="修改密码"
      show-cancel-button
      @confirm="handleChangePassword"
      :before-close="handlePasswordDialogClose"
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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { adminAPI } from '@/api'

const router = useRouter()

const userInfo = ref({})
const activeTab = ref('profile')

// 弹窗显示状态
const showPhoneDialog = ref(false)
const showRealNameDialog = ref(false)
const showEmailDialog = ref(false)
const showPasswordDialog = ref(false)

// 修改手机号表单
const phoneFormRef = ref(null)
const phoneForm = ref({ phone_number: '', code: '' })
const sendingPhoneCode = ref(false)
const phoneCodeCountdown = ref(0)
let phoneCodeTimer = null

// 修改真实姓名表单
const realNameFormRef = ref(null)
const realNameForm = ref({ real_name: '' })

// 修改邮箱表单
const emailFormRef = ref(null)
const emailForm = ref({ email: '' })

// 修改密码表单
const passwordFormRef = ref(null)
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

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

// ==================== 修改手机号 ====================
const handleSendPhoneCode = async () => {
  if (!phoneForm.value.phone_number || phoneForm.value.phone_number.length !== 11) {
    showToast('请输入正确的11位手机号')
    return
  }

  sendingPhoneCode.value = true
  try {
    await adminAPI.sendUpdatePhoneCode(phoneForm.value.phone_number)
    showToast({ type: 'success', message: '验证码已发送' })

    // 开始倒计时
    phoneCodeCountdown.value = 60
    phoneCodeTimer = setInterval(() => {
      phoneCodeCountdown.value--
      if (phoneCodeCountdown.value <= 0) {
        clearInterval(phoneCodeTimer)
        phoneCodeTimer = null
      }
    }, 1000)
  } catch (error) {
    showToast('发送失败：' + error)
  } finally {
    sendingPhoneCode.value = false
  }
}

const handleUpdatePhone = async () => {
  try {
    await phoneFormRef.value?.validate()
    await adminAPI.updatePhone(phoneForm.value.phone_number, phoneForm.value.code)
    showToast({ type: 'success', message: '手机号修改成功' })
    showPhoneDialog.value = false
    phoneForm.value = { phone_number: '', code: '' }
    loadUserInfo()
  } catch (error) {
    if (error !== 'cancel') {
      showToast('修改失败：' + error)
    }
  }
}

const handlePhoneDialogClose = (action) => {
  if (action === 'cancel') {
    phoneForm.value = { phone_number: '', code: '' }
    return true
  }
  return false
}

// ==================== 修改真实姓名 ====================
const handleUpdateRealName = async () => {
  try {
    await realNameFormRef.value?.validate()
    await adminAPI.updateRealName(realNameForm.value.real_name)
    showToast({ type: 'success', message: '真实姓名修改成功' })
    showRealNameDialog.value = false
    realNameForm.value = { real_name: '' }
    loadUserInfo()
  } catch (error) {
    if (error !== 'cancel') {
      showToast('修改失败：' + error)
    }
  }
}

const handleRealNameDialogClose = (action) => {
  if (action === 'cancel') {
    realNameForm.value = { real_name: '' }
    return true
  }
  return false
}

// ==================== 修改邮箱 ====================
const handleUpdateEmail = async () => {
  try {
    await emailFormRef.value?.validate()
    await adminAPI.updateEmail(emailForm.value.email)
    showToast({ type: 'success', message: '邮箱修改成功' })
    showEmailDialog.value = false
    emailForm.value = { email: '' }
    loadUserInfo()
  } catch (error) {
    if (error !== 'cancel') {
      showToast('修改失败：' + error)
    }
  }
}

const handleEmailDialogClose = (action) => {
  if (action === 'cancel') {
    emailForm.value = { email: '' }
    return true
  }
  return false
}

// ==================== 修改密码 ====================
const handleChangePassword = async () => {
  try {
    await passwordFormRef.value?.validate()

    await adminAPI.updatePassword(
      passwordForm.value.oldPassword,
      passwordForm.value.newPassword
    )

    showToast({ type: 'success', message: '密码修改成功，请重新登录' })
    showPasswordDialog.value = false

    // 清除缓存并跳转到登录页
    setTimeout(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('userType')
      localStorage.removeItem('userId')
      localStorage.removeItem('userName')
      router.push('/')
    }, 1500)
  } catch (error) {
    if (error !== 'cancel') {
      showToast('修改失败：' + error)
    }
  }
}

const handlePasswordDialogClose = (action) => {
  if (action === 'cancel') {
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
    return true
  }
  return false
}

onMounted(() => {
  loadUserInfo()
})

onUnmounted(() => {
  if (phoneCodeTimer) {
    clearInterval(phoneCodeTimer)
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

.profile-tabs {
  border-radius: 16px;
  overflow: hidden;
}

.profile-tabs :deep(.van-tabs__nav) {
  background: white;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
}

.profile-tabs :deep(.van-tab--active) {
  color: #4F6EF7;
  font-weight: 600;
}

.profile-tabs :deep(.van-tabs__line) {
  background: linear-gradient(135deg, #4F6EF7, #60A5FA);
  height: 3px;
  border-radius: 3px;
}

.tab-content {
  padding: 16px 0;
}

.info-section {
  margin-bottom: 16px;
}

.security-section {
  margin-bottom: 16px;
}

.info-group {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05);
  background: white;
}

.cell-hint {
  font-size: 12px;
  color: #94A3B8;
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