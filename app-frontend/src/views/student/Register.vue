<template>
  <div class="register-page gradient-bg">
    <div class="register-container">
      <!-- 返回按钮 -->
      <van-nav-bar
        title="学生注册"
        left-arrow
        @click-left="$router.push('/student/login')"
        class="nav-bar"
      />

      <div class="register-card fade-in">
        <div class="card-header">
          <div class="icon">👨‍🎓</div>
          <h2>学生注册</h2>
        </div>

        <van-form @submit="handleRegister">
          <van-cell-group inset>
            <van-field
              v-model="form.phoneNumber"
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
              v-model="form.studentNumber"
              name="studentNumber"
              label="学号"
              placeholder="请输入学号"
              :rules="[{ required: true, message: '请输入学号' }]"
            />
            <van-field
              v-model="form.password"
              type="password"
              name="password"
              label="密码"
              placeholder="请设置密码（至少6位）"
              :rules="[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6位' }
              ]"
            />
            <van-field
              v-model="form.code"
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
              注册
            </van-button>
            <div class="link-text">
              已有账号？<span @click="$router.push('/student/login')">立即登录</span>
            </div>
          </div>
        </van-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { studentAPI } from '@/api'

const router = useRouter()
const loading = ref(false)
const countdown = ref(0)
let countdownTimer = null

const form = ref({
  phoneNumber: '',
  studentNumber: '',
  password: '',
  code: ''
})

// 注册
const handleRegister = async () => {
  loading.value = true
  try {
    const result = await studentAPI.registerWithSMS(
      form.value.phoneNumber,
      form.value.code,
      form.value.studentNumber,
      form.value.password
    )
    
    showToast({ type: 'success', message: result.message || '注册成功' })
    setTimeout(() => {
      router.push('/student/login')
    }, 1000)
  } catch (error) {
    console.error('注册失败:', error)
  } finally {
    loading.value = false
  }
}

// 发送验证码
const handleSendCode = async () => {
  if (!form.value.phoneNumber) {
    showToast('请输入手机号')
    return
  }
  if (!/^1[3-9]\d{9}$/.test(form.value.phoneNumber)) {
    showToast('手机号格式不正确')
    return
  }
  
  try {
    await studentAPI.sendRegisterCode(form.value.phoneNumber)
    showToast({ type: 'success', message: '验证码已发送' })
    startCountdown()
  } catch (error) {
    console.error('发送验证码失败:', error)
  }
}

// 倒计时
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
.register-page {
  min-height: 100vh;
}

.register-container {
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

.register-card {
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

.link-text {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: #666;
}

.link-text span {
  color: #667eea;
  cursor: pointer;
}
</style>
