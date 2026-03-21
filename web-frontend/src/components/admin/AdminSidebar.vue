<template>
  <div :class="['admin-sidebar', { 'is-collapsed': isCollapsed }]">
    <div class="sidebar-logo">
      <div class="logo-icon">E</div>
      <span v-show="!isCollapsed">Elysia 管理后台</span>
    </div>

    <div v-show="!isCollapsed" class="sidebar-group-title">导航</div>
    <el-menu
      :default-active="activeMenu"
      :collapse="isCollapsed"
      background-color="transparent"
      text-color="#64748B"
      active-text-color="#4F6EF7"
      router
      class="admin-menu"
    >
      <el-menu-item index="/admin/dashboard">
        <el-icon><HomeFilled /></el-icon>
        <template #title>Dashboard</template>
      </el-menu-item>
      <el-menu-item index="/admin/knowledge">
        <el-icon><Reading /></el-icon>
        <template #title>知识库管理</template>
      </el-menu-item>

      <div v-show="!isCollapsed" class="sidebar-group-title">意图管理</div>
      <el-menu-item index="/admin/intent-dict">
        <el-icon><Document /></el-icon>
        <template #title>意图字典配置</template>
      </el-menu-item>
      <el-menu-item index="/admin/intent-prompt">
        <el-icon><EditPen /></el-icon>
        <template #title>提示词模板</template>
      </el-menu-item>
      <el-menu-item index="/admin/intent-records">
        <el-icon><DataAnalysis /></el-icon>
        <template #title>意图记录</template>
      </el-menu-item>

      <div v-show="!isCollapsed" class="sidebar-group-title">运营管理</div>
      <el-menu-item index="/admin/bookshelf">
        <el-icon><Collection /></el-icon>
        <template #title>平台书架</template>
      </el-menu-item>
      <el-menu-item index="/admin/announcements">
        <el-icon><Bell /></el-icon>
        <template #title>系统公告</template>
      </el-menu-item>

      <div v-show="!isCollapsed" class="sidebar-group-title">设置</div>
      <el-menu-item index="/admin/users">
        <el-icon><User /></el-icon>
        <template #title>用户管理</template>
      </el-menu-item>
      <el-menu-item index="/admin/models">
        <el-icon><Setting /></el-icon>
        <template #title>模型管理</template>
      </el-menu-item>
    </el-menu>

    <div class="sidebar-footer-actions">
      <div class="sidebar-collapse-btn" @click="toggleCollapse">
        <el-icon>
          <DArrowRight v-if="isCollapsed" />
          <DArrowLeft v-else />
        </el-icon>
        <span v-show="!isCollapsed">{{ isCollapsed ? '展开侧边栏' : '收起侧边栏' }}</span>
      </div>
      <div class="sidebar-logout-btn" @click="handleLogout">
        <el-icon><SwitchButton /></el-icon>
        <span v-show="!isCollapsed">退出登录</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminAPI } from '@/services'

const SIDEBAR_COLLAPSED_KEY = 'adminSidebarCollapsed'
const router = useRouter()
const isCollapsed = ref(false)

const props = defineProps({
  activeMenu: {
    type: String,
    default: '/admin/dashboard'
  }
})

const syncSidebarStateClass = (collapsed) => {
  document.body.classList.toggle('admin-sidebar-collapsed', collapsed)
}

const loadSidebarState = () => {
  isCollapsed.value = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
}

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const clearLoginState = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  localStorage.removeItem('userType')
  localStorage.removeItem('userId')
  localStorage.removeItem('userName')
  localStorage.removeItem('teacherId')
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '确认退出', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    try {
      await adminAPI.logout()
    } catch (error) {
      console.error('退出登录失败:', error)
    }

    clearLoginState()
    ElMessage.success('已退出登录')
    router.replace('/')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('退出登录流程异常:', error)
    }
  }
}

watch(isCollapsed, (collapsed) => {
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed))
  syncSidebarStateClass(collapsed)
}, { immediate: true })

onMounted(() => {
  loadSidebarState()
  syncSidebarStateClass(isCollapsed.value)
})

onBeforeUnmount(() => {
  syncSidebarStateClass(false)
})
</script>

<style scoped>
.logo-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: linear-gradient(135deg, #4F6EF7, #7CB8FF);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 16px;
  color: #fff;
  margin-right: 10px;
  flex-shrink: 0;
  box-shadow: 0 8px 18px rgba(79, 110, 247, 0.18);
}

.admin-sidebar {
  padding-bottom: 108px;
}

.admin-sidebar.is-collapsed .sidebar-logo {
  justify-content: center;
  padding: 0 12px;
}

.admin-sidebar.is-collapsed .logo-icon {
  margin-right: 0;
}

.sidebar-group-title {
  padding: 20px 24px 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: rgba(100, 116, 139, 0.72);
  pointer-events: none;
}

/* 浅色菜单 */
.admin-menu :deep(.el-menu-item) {
  height: 42px;
  line-height: 42px;
  border-radius: 10px;
  margin: 4px 12px;
  padding-left: 20px !important;
  font-size: 14px;
  color: #475569;
  transition: all 0.2s ease;
}

.admin-menu :deep(.el-menu--collapse) {
  width: 100%;
  border-right: none;
}

.admin-menu :deep(.el-menu--collapse .el-menu-item) {
  padding: 0 !important;
  justify-content: center;
}

.admin-menu :deep(.el-menu--collapse .el-menu-item .el-tooltip__trigger) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.admin-menu :deep(.el-menu-item .el-icon) {
  font-size: 18px;
  margin-right: 10px;
  color: rgba(100, 116, 139, 0.88);
  transition: color 0.2s;
}

.admin-menu :deep(.el-menu--collapse .el-menu-item .el-icon) {
  margin-right: 0;
}

.admin-menu :deep(.el-menu-item:hover) {
  background: rgba(79, 110, 247, 0.08) !important;
  color: #0F172A !important;
}

.admin-menu :deep(.el-menu-item:hover .el-icon) {
  color: #4F6EF7;
}

.admin-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, #EEF4FF, #E4EEFF) !important;
  color: #4F6EF7 !important;
  box-shadow: inset 0 0 0 1px rgba(79, 110, 247, 0.14), 0 8px 18px rgba(79, 110, 247, 0.10);
}

.admin-menu :deep(.el-menu-item.is-active .el-icon) {
  color: #4F6EF7;
}

.sidebar-footer-actions {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(252, 253, 254, 0.96) 20%, rgba(247, 250, 255, 0.98) 100%);
  backdrop-filter: blur(6px);
}

.sidebar-collapse-btn,
.sidebar-logout-btn {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(100, 116, 139, 0.86);
  border-top: 1px solid rgba(226, 232, 240, 0.95);
  cursor: pointer;
  transition: all 0.2s;
}

.sidebar-collapse-btn:hover,
.sidebar-logout-btn:hover {
  color: #0F172A;
  background: rgba(79, 110, 247, 0.04);
}

.sidebar-logout-btn {
  color: #DC2626;
}

.sidebar-logout-btn:hover {
  color: #B91C1C;
  background: rgba(220, 38, 38, 0.04);
}
</style>
