<template>
  <div class="home-page gradient-bg">
    <div class="home-container">
      <div class="header fade-in">
        <h1 class="title">🎓 Elysia 教育平台</h1>
        <p class="subtitle">请选择您的身份</p>
      </div>

      <div class="role-cards">
        <div class="role-card fade-in" style="animation-delay: 0.1s" @click="goToRole('admin')">
          <div class="role-icon">👨‍💼</div>
          <div class="role-name">管理员</div>
          <div class="role-desc">系统管理与配置</div>
        </div>

        <div class="role-card fade-in" style="animation-delay: 0.2s" @click="goToRole('teacher')">
          <div class="role-icon">👨‍🏫</div>
          <div class="role-name">教师</div>
          <div class="role-desc">课程管理与教学</div>
        </div>

        <div class="role-card fade-in" style="animation-delay: 0.3s" @click="goToRole('student')">
          <div class="role-icon">👨‍🎓</div>
          <div class="role-name">学生</div>
          <div class="role-desc">在线学习与考试</div>
        </div>
      </div>

      <div class="footer fade-in" style="animation-delay: 0.4s">
        <p>© 2024 Elysia 教育平台</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToRole = (role) => {
  router.push(`/${role}/login`)
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.home-container {
  width: 100%;
  max-width: 500px;
}

.header {
  text-align: center;
  margin-bottom: 48px;
}

.title {
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin-bottom: 12px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.subtitle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.9);
}

.role-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
}

.role-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.role-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.role-card:active {
  transform: translateY(-2px);
}

.role-icon {
  font-size: 48px;
  flex-shrink: 0;
}

.role-name {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.role-desc {
  font-size: 14px;
  color: #666;
}

.footer {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

@media (max-width: 480px) {
  .title {
    font-size: 28px;
  }

  .role-icon {
    font-size: 40px;
  }

  .role-name {
    font-size: 18px;
  }
}
</style>
