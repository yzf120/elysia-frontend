<template>
  <div class="login-page gradient-bg">
    <div class="login-container">
      <van-nav-bar
        title="管理员登录"
        left-arrow
        @click-left="$router.push('/')"
        class="nav-bar"
      />

      <div class="login-card fade-in">
        <div class="card-header">
          <div class="icon">👨‍💼</div>
          <h2>管理员登录</h2>
        </div>

        <van-tabs v-model:active="activeTab" animated>
          <van-tab title="密码登录" name="password">
            <van-form @submit="handlePasswordLogin">
              <van-cell-group inset>
                <van-field
                  v-model="passwordForm.phoneNumber"
                  name="phoneNumber"
                  label="手机号"
                  placeholder="请输入手机号"
                  maxlength="11"
                  :rules="[
                    { required: true, message: '请输入手机号' },
                    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
                  ]"
                />
                <van-field
                  v-model="passwordForm.password"
                  type="password"
                  name="password"
                  label="密码"
                  placeholder="请输入密码"
                  :rules="[{ required: true, message: '请输入密码' }]"
                />
              </van-cell-group>
              <div class="form-footer">
                <van-button round block type="primary" native-type="submit" :loading="loading">
                  登录
                </van-button>
              </div>
            </van-form>
          </van-tab>

          <van-tab title="验证码登录" name="sms">
            <van-form @submit="handleSmsLogin">
              <van-cell-group inset>
                <van-field
                  v-model="smsForm.phoneNumber"
                  name="phoneNumber"
                  label="手机号"
                  placeholder="请输入手机号"
                  maxlength="11"
                  :rules="[
                    { required: true, message: '请输入手机号' },
                    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
                  ]"
                />
                <van-field
                  v-model="smsForm.code"
                  name="code"
                  label="验证码"
                  placeholder="请输入验证码"
                  maxlength="6"
                  :rules="[{ required: true, message: '请输入验证码' }]"
                >
                  <template #button>
                    <van-button
                      size="small"
                      type="primary"
                      :disabled="countdown > 0"
                      @click="handleSendCode"
                    >
                      {{ countdown > 0 ? `${countdown}秒后重试` : '获取验证码' }}
                    </van-button>
                  </template>
                </van-field>
              </van-cell-group>
              <div class="form-footer">
                <van-button round block type="primary" native-type="submit" :loading="loading">
                  登录
                </van-button>
              </div>
            </van-form>
          </van-tab>
        </van-tabs>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { adminAPI } from '@/api'

const router = useRouter()
const activeTab = ref('password')
const loading = ref(false)
const countdown = ref(0)
let countdownTimer = null

const passwordForm = ref({
  phoneNumber: '',
  password: ''
})

const smsForm = ref({
  phoneNumber: '',
  code: ''
})

const handlePasswordLogin = async () => {
  loading.value = true
  try {
    const result = await adminAPI.loginWithPassword(
      passwordForm.value.phoneNumber,
      passwordForm.value.password
    )
    
    // 后端返回结构为 { data: { token, user_info, message } }
    const respData = result.data || result
    const token = respData.token
    const userInfo = respData.user_info

    localStorage.setItem('token', token)
    localStorage.setItem('userType', 'admin')
    localStorage.setItem('userInfo', userInfo ? JSON.stringify(userInfo) : '{}')
    // 存储 userId，供各页面统一使用（模仿 web 端）
    if (userInfo) {
      const uid = userInfo.student_id || userInfo.teacher_id || userInfo.admin_id || userInfo.id || ''
      localStorage.setItem('userId', uid)
      localStorage.setItem('userName', userInfo.admin_name || userInfo.name || '')
    }
    
    showToast({ type: 'success', message: respData.message || '登录成功' })
    setTimeout(() => {
      router.push('/admin/dashboard')
    }, 1000)
  } catch (error) {
    console.error('登录失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSmsLogin = async () => {
  loading.value = true
  try {
    const result = await adminAPI.loginWithSMS(
      smsForm.value.phoneNumber,
      smsForm.value.code
    )
    
    // 后端返回结构为 { data: { token, user_info, message } }
    const respData = result.data || result
    const token = respData.token
    const userInfo = respData.user_info

    localStorage.setItem('token', token)
    localStorage.setItem('userType', 'admin')
    localStorage.setItem('userInfo', userInfo ? JSON.stringify(userInfo) : '{}')
    // 存储 userId，供各页面统一使用（模仿 web 端）
    if (userInfo) {
      const uid = userInfo.student_id || userInfo.teacher_id || userInfo.admin_id || userInfo.id || ''
      localStorage.setItem('userId', uid)
      localStorage.setItem('userName', userInfo.admin_name || userInfo.name || '')
    }
    
    showToast({ type: 'success', message: respData.message || '登录成功' })
    setTimeout(() => {
      router.push('/admin/dashboard')
    }, 1000)
  } catch (error) {
    console.error('登录失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSendCode = async () => {
  if (!smsForm.value.phoneNumber) {
    showToast('请输入手机号')
    return
  }
  if (!/^1[3-9]\d{9}$/.test(smsForm.value.phoneNumber)) {
    showToast('手机号格式不正确')
    return
  }
  
  try {
    await adminAPI.sendLoginCode(smsForm.value.phoneNumber)
    showToast({ type: 'success', message: '验证码已发送' })
    startCountdown()
  } catch (error) {
    console.error('发送验证码失败:', error)
  }
}

const startCountdown = () => {
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
    }
  }, 1000)
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #F5F7FB 0%, #FFFFFF 55%, #EEF3FF 100%);
}

.login-container {
  min-height: 100vh;
  padding-bottom: 20px;
}

.nav-bar {
  background: #0F172A;
  :deep(.van-nav-bar__title) {
    color: white;
    font-weight: 600;
  }
  :deep(.van-icon) {
    color: white;
  }
}

.login-card {
  margin: 20px;
  background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFF 100%);
  border-radius: 24px;
  padding: 32px 24px;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
  border: 1px solid #EAF0F8;
}

.card-header {
  text-align: center;
  margin-bottom: 28px;
}

.icon {
  font-size: 72px;
  margin-bottom: 16px;
  filter: drop-shadow(0 4px 12px rgba(79, 110, 247, 0.22));
}

.card-header h2 {
  font-size: 26px;
  font-weight: 700;
  color: #0F172A;
}

.form-footer {
  padding: 20px 16px 8px;
}

.form-footer :deep(.van-button--primary) {
  background: linear-gradient(135deg, #4F6EF7 0%, #60A5FA 100%);
  border: none;
  box-shadow: 0 8px 16px rgba(79, 110, 247, 0.26);
  font-weight: 600;
  height: 48px;
}

:deep(.van-tabs__nav) {
  background: transparent;
}

:deep(.van-tab--active) {
  color: #4F6EF7;
  font-weight: 600;
}

:deep(.van-tabs__line) {
  background: linear-gradient(135deg, #4F6EF7, #60A5FA);
  height: 3px;
  border-radius: 3px;
}

:deep(.van-cell-group--inset) {
  margin: 16px 0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.04);
}

:deep(.van-field__button .van-button--primary) {
  background: linear-gradient(135deg, #4F6EF7, #60A5FA);
  border: none;
  font-weight: 600;
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
</style>