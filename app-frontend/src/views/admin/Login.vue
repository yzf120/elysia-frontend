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
    
    if (result.token) {
      localStorage.setItem('token', result.token)
    }
    if (result.user_info) {
      localStorage.setItem('userInfo', JSON.stringify(result.user_info))
      localStorage.setItem('userType', 'admin')
    }
    
    showToast({ type: 'success', message: result.message || '登录成功' })
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
    
    if (result.token) {
      localStorage.setItem('token', result.token)
    }
    if (result.user_info) {
      localStorage.setItem('userInfo', JSON.stringify(result.user_info))
      localStorage.setItem('userType', 'admin')
    }
    
    showToast({ type: 'success', message: result.message || '登录成功' })
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
}

.login-container {
  min-height: 100vh;
  padding-bottom: 20px;
}

.nav-bar {
  background: transparent;
  :deep(.van-nav-bar__title) {
    color: white;
  }
  :deep(.van-icon) {
    color: white;
  }
}

.login-card {
  margin: 20px;
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  text-align: center;
  margin-bottom: 24px;
}

.icon {
  font-size: 64px;
  margin-bottom: 12px;
}

.card-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.form-footer {
  padding: 16px;
}
</style>
