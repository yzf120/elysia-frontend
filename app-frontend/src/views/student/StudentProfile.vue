<template>
  <div class="student-profile-page">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      title="个人中心"
      left-arrow
      @click-left="goBack"
      fixed
      placeholder
      :border="false"
      class="custom-navbar"
    />

    <!-- 用户名片区 -->
    <div class="profile-hero">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <div class="avatar-wrap">
          <div class="avatar-ring">
            <div class="avatar-inner">
              <span class="avatar-letter">{{ (userInfo.name || '学').charAt(0) }}</span>
            </div>
          </div>
          <div class="online-badge"></div>
        </div>
        <h2 class="hero-name">{{ userInfo.name || '学生' }}</h2>
        <p class="hero-id">学号：{{ userInfo.student_id || '-' }}</p>
      </div>
    </div>

    <!-- 学习统计卡片 -->
    <div class="stats-row">
      <div class="stat-chip chip-course">
        <div class="chip-icon">
          <van-icon name="bookmark-o" size="20" />
        </div>
        <span class="chip-value">{{ stats.completedCourses }}/{{ stats.totalCourses }}</span>
        <span class="chip-label">课程</span>
      </div>
      <div class="stat-chip chip-chapter">
        <div class="chip-icon">
          <van-icon name="notes-o" size="20" />
        </div>
        <span class="chip-value">{{ stats.completedChapters }}/{{ stats.totalChapters }}</span>
        <span class="chip-label">章节</span>
      </div>
      <div class="stat-chip chip-ai">
        <div class="chip-icon">
          <van-icon name="chat-o" size="20" />
        </div>
        <span class="chip-value">{{ stats.aiSessions }}</span>
        <span class="chip-label">AI对话</span>
      </div>
    </div>

    <!-- 基本信息卡片 -->
    <div class="section-card">
      <div class="section-header">
        <div class="section-icon icon-profile">
          <van-icon name="user-o" size="18" />
        </div>
        <span class="section-title">基本信息</span>
      </div>
      <van-form @submit="onSubmit">
        <van-cell-group :border="false" class="form-group">
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
          />
          <van-field
            v-model="formData.major"
            name="major"
            label="专业"
            placeholder="请输入专业"
          />
        </van-cell-group>
        <div class="btn-area">
          <van-button round block type="primary" native-type="submit" :loading="submitting" class="save-btn">
            保存修改
          </van-button>
        </div>
      </van-form>
    </div>

    <!-- 安全设置卡片 -->
    <div class="section-card">
      <div class="section-header">
        <div class="section-icon icon-security">
          <van-icon name="shield-o" size="18" />
        </div>
        <span class="section-title">安全设置</span>
      </div>
      <van-cell-group :border="false" class="form-group">
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
          placeholder="请输入新密码（至少6位）"
        />
        <van-field
          v-model="passwordData.confirmPassword"
          type="password"
          name="confirmPassword"
          label="确认密码"
          placeholder="请再次输入新密码"
        />
      </van-cell-group>
      <div class="btn-area">
        <van-button round block type="warning" @click="changePassword" :disabled="!canChangePassword" class="pwd-btn">
          修改密码
        </van-button>
      </div>
    </div>

    <!-- 退出登录 -->
    <div class="logout-area">
      <van-button round block plain type="danger" @click="logout" class="logout-btn">
        <van-icon name="revoke" style="margin-right: 6px;" />
        退出登录
      </van-button>
    </div>

    <div class="page-bottom-space"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { studentAPI } from '@/api/index'

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
  completedCourses: 0,
  totalCourses: 0,
  completedChapters: 0,
  totalChapters: 0,
  aiSessions: 0
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
    const res = await studentAPI.getProfile()
    const student = res?.student
    if (student) {
      userInfo.value = {
        name: student.student_name || '',
        student_id: student.student_number || '',
        email: student.email || '',
        phone: student.phone_number || '',
        class_name: '',
        major: student.major || '',
        avatar: ''
      }
      formData.value = { ...userInfo.value }
    }
  } catch (error) {
    console.error('加载用户信息失败:', error)
    // 接口失败时从本地存储获取基本信息
    const info = localStorage.getItem('userInfo')
    if (info && info !== 'undefined' && info !== 'null') {
      try {
        const parsedInfo = JSON.parse(info)
        userInfo.value = parsedInfo
        formData.value = { ...parsedInfo }
      } catch (e) {
        console.error('解析用户信息失败:', e)
      }
    }
  }
}

// 加载学习统计
const loadStudyStats = async () => {
  try {
    const res = await studentAPI.getStudyStats()
    if (res) {
      stats.value = {
        completedCourses: res.completed_courses || 0,
        totalCourses: res.total_courses || 0,
        completedChapters: res.completed_chapters || 0,
        totalChapters: res.total_chapters || 0,
        aiSessions: res.ai_sessions || 0
      }
    }
  } catch (error) {
    console.error('加载学习统计失败:', error)
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
    await studentAPI.updateProfile({
      name: formData.value.name,
      email: formData.value.email,
      major: formData.value.major,
      grade: '',
      interests: ''
    })

    // 更新localStorage
    localStorage.setItem('userInfo', JSON.stringify(formData.value))
    localStorage.setItem('userName', formData.value.name)

    showToast({
      type: 'success',
      message: '保存成功'
    })
  } catch (error) {
    console.error('保存失败:', error)
    showToast(typeof error === 'string' ? error : '保存失败')
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

    // 调用API修改密码
    await studentAPI.updatePassword(passwordData.value.oldPassword, passwordData.value.newPassword)

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
    localStorage.removeItem('userId')
    localStorage.removeItem('teacherId')

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
  loadStudyStats()
})
</script>

<style scoped>
.student-profile-page {
  min-height: 100vh;
  background: #f5f5f7;
  padding-bottom: 40px;
}

/* 导航栏 */
.custom-navbar {
  background: transparent !important;
}

:deep(.van-nav-bar) {
  background: transparent !important;
}

:deep(.van-nav-bar__content) {
  height: 48px;
}

:deep(.van-nav-bar__title) {
  font-weight: 700;
  font-size: 17px;
  color: white;
}

:deep(.van-nav-bar .van-icon) {
  color: white !important;
}

/* 用户名片区 */
.profile-hero {
  position: relative;
  padding: 20px 0 50px;
  text-align: center;
  margin-bottom: -30px;
}

.hero-bg {
  position: absolute;
  top: -48px;
  left: 0;
  right: 0;
  height: 220px;
  background: linear-gradient(145deg, #4F6EF7 0%, #7CB8FF 50%, #BBD7FF 100%);
  border-radius: 0 0 32px 32px;
}

.hero-content {
  position: relative;
  z-index: 2;
}

.avatar-wrap {
  position: relative;
  display: inline-block;
  margin-bottom: 14px;
}

.avatar-ring {
  width: 82px;
  height: 82px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3px;
}

.avatar-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #7CB8FF 0%, #4F6EF7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid white;
}

.avatar-letter {
  font-size: 32px;
  font-weight: 700;
  color: white;
}

.online-badge {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 14px;
  height: 14px;
  background: #22c55e;
  border: 2.5px solid white;
  border-radius: 50%;
}

.hero-name {
  color: white;
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 4px;
}

.hero-id {
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  margin: 0;
}

/* 统计卡片行 */
.stats-row {
  display: flex;
  gap: 10px;
  padding: 0 16px;
  position: relative;
  z-index: 3;
  margin-bottom: 18px;
}

.stat-chip {
  flex: 1;
  background: white;
  border-radius: 16px;
  padding: 16px 12px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.chip-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chip-course .chip-icon {
  background: #eef2ff;
  color: #4F6EF7;
}

.chip-chapter .chip-icon {
  background: #fdf2f8;
  color: #ec4899;
}

.chip-ai .chip-icon {
  background: #ecfdf5;
  color: #10b981;
}

.chip-value {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

.chip-label {
  font-size: 11px;
  color: #9ca3af;
}

/* 分区卡片 */
.section-card {
  margin: 0 16px 16px;
  background: white;
  border-radius: 20px;
  padding: 20px 0 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px 14px;
  border-bottom: 1px solid #f3f4f6;
  margin-bottom: 4px;
}

.section-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.icon-profile {
  background: linear-gradient(135deg, #4F6EF7, #7CB8FF);
}

.icon-security {
  background: linear-gradient(135deg, #f59e0b, #f97316);
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
}

.form-group {
  padding: 0;
}

:deep(.van-cell) {
  padding: 14px 20px;
}

:deep(.van-field__label) {
  width: 70px;
  color: #6b7280;
  font-weight: 500;
}

:deep(.van-field__control) {
  color: #1f2937;
}

:deep(.van-field__control:disabled) {
  color: #9ca3af;
  -webkit-text-fill-color: #9ca3af;
}

/* 按钮区 */
.btn-area {
  padding: 12px 20px 16px;
}

.save-btn {
  background: linear-gradient(135deg, #4F6EF7, #7CB8FF) !important;
  border: none !important;
  font-weight: 600;
  font-size: 15px;
  height: 44px;
  box-shadow: 0 4px 14px rgba(79, 110, 247, 0.3);
}

.pwd-btn {
  font-weight: 600;
  font-size: 15px;
  height: 44px;
}

/* 退出登录 */
.logout-area {
  padding: 8px 16px;
}

.logout-btn {
  height: 44px;
  font-weight: 600;
  font-size: 15px;
  border-color: #fca5a5 !important;
  color: #ef4444 !important;
}

.page-bottom-space {
  height: 20px;
}
</style>
