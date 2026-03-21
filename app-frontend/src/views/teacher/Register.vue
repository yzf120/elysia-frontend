<template>
  <div class="register-page gradient-bg">
    <div class="register-container">
      <van-nav-bar
        title="教师注册申请"
        left-arrow
        @click-left="$router.push('/teacher/login')"
        class="nav-bar"
      />

      <div class="register-card fade-in">
        <div class="card-header">
          <div class="icon">👨‍🏫</div>
          <h2>教师注册申请</h2>
          <p class="tip">注册后需等待管理员审核</p>
        </div>

        <van-form @submit="handleRegister">
          <van-cell-group inset>
            <van-field
              v-model="form.name"
              name="name"
              label="姓名"
              placeholder="请输入姓名"
              :rules="[{ required: true, message: '请输入姓名' }]"
            />
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
              v-model="form.employeeNumber"
              name="employeeNumber"
              label="工号"
              placeholder="请输入工号"
              :rules="[{ required: true, message: '请输入工号' }]"
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
              v-model="form.department"
              name="department"
              label="部门"
              placeholder="请输入部门"
              :rules="[{ required: true, message: '请输入部门' }]"
            />
            <van-field
              v-model="form.title"
              name="title"
              label="职称"
              placeholder="请输入职称"
              :rules="[{ required: true, message: '请输入职称' }]"
            />
          </van-cell-group>
          <div class="form-footer">
            <van-button round block type="primary" native-type="submit" :loading="loading">
              提交申请
            </van-button>
            <div class="link-text">
              已有账号？<span @click="$router.push('/teacher/login')">立即登录</span>
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
import { teacherAPI } from '@/api'

const router = useRouter()
const loading = ref(false)

const form = ref({
  name: '',
  phoneNumber: '',
  employeeNumber: '',
  password: '',
  department: '',
  title: ''
})

const handleRegister = async () => {
  loading.value = true
  try {
    const result = await teacherAPI.register(form.value)
    showToast({ type: 'success', message: result.message || '申请已提交，请等待审核' })
    setTimeout(() => {
      router.push('/teacher/login')
    }, 1500)
  } catch (error) {
    console.error('注册失败:', error)
  } finally {
    loading.value = false
  }
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
  margin-bottom: 8px;
}

.tip {
  font-size: 14px;
  color: #ff9800;
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
  color: #4F6EF7;
  cursor: pointer;
}
</style>
