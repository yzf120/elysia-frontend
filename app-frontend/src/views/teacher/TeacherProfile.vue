<template>
  <div class="teacher-profile-page">
    <van-nav-bar title="个人信息中心" left-arrow @click-left="$router.back()" />

    <van-tabs v-model:active="activeTab" sticky>
      <!-- 基本信息 -->
      <van-tab title="基本信息" name="basic">
        <div class="tab-content">
          <van-cell-group inset>
            <van-field v-model="profileForm.name" label="姓名" placeholder="请输入姓名" />
            <van-field v-model="profileForm.email" label="邮箱" placeholder="请输入邮箱" />
            <van-field v-model="profileForm.teachingYears" label="教龄" type="number" placeholder="请输入教龄" />
          </van-cell-group>
          <div class="action-wrap">
            <van-button type="primary" block round @click="saveProfile">保存修改</van-button>
          </div>
        </div>
      </van-tab>

      <!-- 关联班级 -->
      <van-tab title="关联班级" name="classes">
        <div class="tab-content">
          <van-loading v-if="classLoading" type="spinner" color="#667eea" class="loading-center" />
          <van-empty v-else-if="classList.length === 0" description="暂无关联班级" />
          <van-cell-group v-else inset>
            <van-cell
              v-for="cls in classList"
              :key="cls.classId"
              :title="cls.className"
              :label="`${cls.semester} · ${cls.currentStudents}/${cls.maxStudents}人`"
            />
          </van-cell-group>
        </div>
      </van-tab>

      <!-- 安全设置 -->
      <van-tab title="安全设置" name="security">
        <div class="tab-content">
          <van-cell-group inset>
            <van-field
              v-model="securityForm.oldPassword"
              label="原密码"
              type="password"
              placeholder="请输入原密码"
            />
            <van-field
              v-model="securityForm.newPassword"
              label="新密码"
              type="password"
              placeholder="请输入新密码"
            />
            <van-field
              v-model="securityForm.confirmPassword"
              label="确认密码"
              type="password"
              placeholder="请再次输入新密码"
            />
          </van-cell-group>
          <div class="action-wrap">
            <van-button type="primary" block round @click="changePassword">修改密码</van-button>
          </div>
        </div>
      </van-tab>
    </van-tabs>

    <!-- 退出登录 -->
    <div class="logout-wrap">
      <van-button type="danger" block round plain @click="handleLogout">退出登录</van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { teacherAPI } from '@/api'

const router = useRouter()
const activeTab = ref('basic')

const profileForm = ref({ name: '', email: '', teachingYears: '' })
const classList = ref([])
const classLoading = ref(false)
const securityForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })

const loadProfile = () => {
  const info = localStorage.getItem('userInfo')
  if (info && info !== 'undefined') {
    try {
      const parsed = JSON.parse(info)
      profileForm.value.name = parsed.name || parsed.teacher_name || ''
      profileForm.value.email = parsed.email || ''
      profileForm.value.teachingYears = parsed.teaching_years || ''
    } catch {}
  }
}

const loadClasses = async () => {
  classLoading.value = true
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const teacherId = userInfo.teacher_id || userInfo.id || ''
    const res = await teacherAPI.getTeacherClasses(teacherId)
    classList.value = res.classes || []
  } catch {
    showToast({ type: 'fail', message: '加载班级失败' })
  } finally {
    classLoading.value = false
  }
}

const saveProfile = async () => {
  try {
    // TODO: 调用API保存个人信息
    showToast({ type: 'success', message: '保存成功' })
  } catch {
    showToast({ type: 'fail', message: '保存失败' })
  }
}

const changePassword = async () => {
  const { oldPassword, newPassword, confirmPassword } = securityForm.value
  if (!oldPassword || !newPassword || !confirmPassword) {
    showToast({ type: 'fail', message: '请填写完整信息' })
    return
  }
  if (newPassword !== confirmPassword) {
    showToast({ type: 'fail', message: '两次输入的新密码不一致' })
    return
  }
  try {
    // TODO: 调用API修改密码
    showToast({ type: 'success', message: '密码修改成功' })
    securityForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  } catch {
    showToast({ type: 'fail', message: '密码修改失败' })
  }
}

const handleLogout = async () => {
  showConfirmDialog({ title: '提示', message: '确定要退出登录吗？' })
    .then(async () => {
      try { await teacherAPI.logout() } catch {}
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('userType')
      localStorage.removeItem('userName')
      localStorage.removeItem('userId')
      localStorage.removeItem('teacherId')
      showToast({ type: 'success', message: '已退出登录' })
      router.push('/')
    }).catch(() => {})
}

onMounted(() => {
  loadProfile()
  loadClasses()
})
</script>

<style scoped>
.teacher-profile-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 24px;
}

.tab-content {
  padding: 12px 0;
}

.loading-center {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.action-wrap {
  padding: 16px;
}

.logout-wrap {
  padding: 16px;
  margin-top: 8px;
}
</style>
