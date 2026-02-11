<template>
  <div class="student-profile-page">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      title="个人信息"
      left-arrow
      @click-left="goBack"
      fixed
      placeholder
    />

    <!-- 个人信息卡片 -->
    <div class="profile-header">
      <div class="avatar-section">
        <van-image
          round
          width="80"
          height="80"
          :src="userInfo.avatar"
        >
          <template #default>
            <div class="avatar-placeholder">{{ userInfo.name?.charAt(0) || 'S' }}</div>
          </template>
        </van-image>
        <van-button size="small" plain round @click="uploadAvatar">更换头像</van-button>
      </div>
      <div class="user-basic-info">
        <h2>{{ userInfo.name || '学生' }}</h2>
        <p>学号：{{ userInfo.student_id || '-' }}</p>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <div class="stat-card">
        <div class="stat-value">{{ stats.courseCount }}</div>
        <div class="stat-label">学习课程</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.taskCount }}</div>
        <div class="stat-label">完成任务</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.studyHours }}</div>
        <div class="stat-label">学习时长(h)</div>
      </div>
    </div>

    <!-- 信息表单 -->
    <van-form @submit="onSubmit">
      <van-cell-group inset>
        <van-field
          v-model="formData.name"
          name="name"
          label="姓名"
          placeholder="请输入姓名"
          :rules="[{ required: true, message: '请输入姓名' }]"
        />
        <van-field
          v-model="formData.student_id"
          name="student_id"
          label="学号"
          placeholder="请输入学号"
          disabled
        />
        <van-field
          v-model="formData.email"
          name="email"
          label="邮箱"
          placeholder="请输入邮箱"
          type="email"
          :rules="[{ required: true, message: '请输入邮箱' }]"
        />
        <van-field
          v-model="formData.phone"
          name="phone"
          label="手机号"
          placeholder="请输入手机号"
          type="tel"
          maxlength="11"
          :rules="[{ required: true, message: '请输入手机号' }]"
        />
        <van-field
          v-model="formData.class_name"
          name="class_name"
          label="班级"
          placeholder="请输入班级"
        />
        <van-field
          v-model="formData.major"
          name="major"
          label="专业"
          placeholder="请输入专业"
        />
      </van-cell-group>

      <!-- 修改密码 -->
      <van-cell-group inset title="安全设置" style="margin-top: 16px;">
        <van-field
          v-model="passwordData.oldPassword"
          type="password"
          name="oldPassword"
          label="原密码"
          placeholder="请输入原密码"
        />
        <van-field
          v-model="passwordData.newPassword"
          type="password"
          name="newPassword"
          label="新密码"
          placeholder="请输入新密码"
        />
        <van-field
          v-model="passwordData.confirmPassword"
          type="password"
          name="confirmPassword"
          label="确认密码"
          placeholder="请再次输入新密码"
        />
      </van-cell-group>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <van-button
          round
          block
          type="primary"
          native-type="submit"
          :loading="submitting"
        >
          保存修改
        </van-button>
        <van-button
          round
          block
          type="warning"
          @click="changePassword"
          :disabled="!canChangePassword"
        >
          修改密码
        </van-button>
        <van-button
          round
          block
          type="danger"
          @click="logout"
        >
          退出登录
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog, showImagePreview } from 'vant'

const router = useRouter()

// 用户信息
const userInfo = ref({
  name: '',
  student_id: '',
  email: '',
  phone: '',
  class_name: '',
  major: '',
  avatar: ''
})

// 统计数据
const stats = ref({
  courseCount: 0,
  taskCount: 0,
  studyHours: 0
})

// 表单数据
const formData = ref({
  name: '',
  student_id: '',
  email: '',
  phone: '',
  class_name: '',
  major: ''
})

// 密码数据
const passwordData = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 提交状态
const submitting = ref(false)

// 是否可以修改密码
const canChangePassword = computed(() => {
  return passwordData.value.oldPassword &&
         passwordData.value.newPassword &&
         passwordData.value.confirmPassword
})

// 加载用户信息
const loadUserInfo = async () => {
  try {
    // 从localStorage获取用户信息
    const info = localStorage.getItem('userInfo')
    if (info && info !== 'undefined' && info !== 'null') {
      try {
        const parsedInfo = JSON.parse(info)
        userInfo.value = parsedInfo
        formData.value = { ...parsedInfo }
      } catch (error) {
        console.error('解析用户信息失败:', error)
      }
    }

    // TODO: 调用API获取完整用户信息和统计数据
    await new Promise(resolve => setTimeout(resolve, 500))

    // 模拟统计数据
    stats.value = {
      courseCount: 5,
      taskCount: 23,
      studyHours: 48
    }
  } catch (error) {
    console.error('加载用户信息失败:', error)
    showToast('加载失败')
  }
}

// 上传头像
const uploadAvatar = () => {
  showToast('头像上传功能开发中')
  // TODO: 实现头像上传
}

// 提交表单
const onSubmit = async (values) => {
  submitting.value = true

  try {
    // TODO: 调用API更新用户信息
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 更新localStorage
    localStorage.setItem('userInfo', JSON.stringify(formData.value))
    localStorage.setItem('userName', formData.value.name)

    showToast({
      type: 'success',
      message: '保存成功'
    })
  } catch (error) {
    console.error('保存失败:', error)
    showToast('保存失败')
  } finally {
    submitting.value = false
  }
}

// 修改密码
const changePassword = async () => {
  // 验证密码
  if (passwordData.value.newPassword.length < 6) {
    showToast('新密码长度不能少于6位')
    return
  }

  if (passwordData.value.newPassword !== passwordData.value.confirmPassword) {
    showToast('两次输入的密码不一致')
    return
  }

  try {
    await showConfirmDialog({
      title: '确认修改',
      message: '确定要修改密码吗？'
    })

    // TODO: 调用API修改密码
    await new Promise(resolve => setTimeout(resolve, 1000))

    showToast({
      type: 'success',
      message: '密码修改成功，请重新登录'
    })

    // 清空密码输入
    passwordData.value = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    }

    // 延迟跳转到登录页
    setTimeout(() => {
      logout()
    }, 1500)
  } catch {
    // 用户取消
  }
}

// 退出登录
const logout = async () => {
  try {
    await showConfirmDialog({
      title: '提示',
      message: '确定要退出登录吗？'
    })

    // TODO: 调用API退出登录

    // 清除本地存储
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userType')
    localStorage.removeItem('userName')

    showToast({
      type: 'success',
      message: '已退出登录'
    })

    // 跳转到角色选择页
    router.push('/')
  } catch {
    // 用户取消
  }
}

// 返回
const goBack = () => {
  router.back()
}

// 页面加载
onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.student-profile-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #e3f2fd 0%, #f5f5f5 100%);
  padding-bottom: 20px;
}

/* 个人信息头部 */
.profile-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  text-align: center;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 600;
  color: white;
}

.user-basic-info h2 {
  margin: 0 0 8px 0;
  font-size: 22px;
  font-weight: 600;
}

.user-basic-info p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

/* 统计卡片 */
.stats-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 16px;
  margin-top: -30px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

/* 操作按钮 */
.action-buttons {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 表单样式优化 */
:deep(.van-cell-group__title) {
  padding-left: 16px;
  font-weight: 600;
  color: #303133;
}

:deep(.van-field__label) {
  width: 80px;
  color: #606266;
}
</style>
