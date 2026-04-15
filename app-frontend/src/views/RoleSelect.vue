<template>
  <div class="role-select-container">
    <div class="role-select-content">
      <!-- 顶部标题 -->
      <div class="header">
        <div class="logo">
          <span class="icon">🎓</span>
          <h1>Elysia 教育平台</h1>
        </div>
        <p class="subtitle">请选择您的身份</p>
      </div>

      <!-- 角色卡片 - 移动端竖向布局 -->
      <div class="role-cards">
        <!-- 管理员 -->
        <div class="role-card" @click="selectRole('admin')">
          <div class="role-icon">👨‍💼</div>
          <div class="role-info">
            <h2 class="role-title">管理员</h2>
            <p class="role-desc">系统管理与配置</p>
          </div>
        </div>

        <!-- 教师 -->
        <div class="role-card" @click="selectRole('teacher')">
          <div class="role-icon">👨‍🏫</div>
          <div class="role-info">
            <h2 class="role-title">教师</h2>
            <p class="role-desc">课程管理与教学</p>
          </div>
        </div>

        <!-- 学生 -->
        <div class="role-card" @click="selectRole('student')">
          <div class="role-icon">👨‍🎓</div>
          <div class="role-info">
            <h2 class="role-title">学生</h2>
            <p class="role-desc">在线学习与考试</p>
          </div>
        </div>
      </div>

      <!-- 底部版权 -->
      <div class="footer">
        <p>© 2026 Elysia 教育平台</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const selectRole = (role) => {
  // 跳转到对应角色的登录页面
  router.push({
    path: '/login',
    query: { role }
  });
};
</script>

<style scoped lang="scss">
.role-select-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4F6EF7 0%, #60A5FA 100%);
  padding: 20px;
  overflow-y: auto;
}

.role-select-content {
  width: 100%;
  max-width: 500px; // 移动端适配
  animation: fadeIn 0.6s ease-out;
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

.header {
  text-align: center;
  margin-bottom: 40px;

  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 15px;

    .icon {
      font-size: 40px;
    }

    h1 {
      font-size: 28px;
      font-weight: 600;
      color: white;
      margin: 0;
    }
  }

  .subtitle {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
  }
}

.role-cards {
  display: flex;
  flex-direction: column; // 移动端竖向布局
  gap: 20px;
  margin-bottom: 40px;
}

.role-card {
  background: white;
  border-radius: 16px;
  padding: 30px 20px;
  display: flex;
  flex-direction: row; // 移动端横向排列图标和文字
  align-items: center;
  gap: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  min-height: 100px;

  // 移动端触摸反馈
  &:active {
    transform: scale(0.98);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  }

  .role-icon {
    font-size: 60px;
    line-height: 1;
    flex-shrink: 0;
  }

  .role-info {
    text-align: left;
    flex: 1;

    .role-title {
      font-size: 24px;
      font-weight: 600;
      color: #333;
      margin: 0 0 8px 0;
    }

    .role-desc {
      font-size: 14px;
      color: #666;
      margin: 0;
    }
  }
}

.footer {
  text-align: center;
  padding-top: 20px;

  p {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
  }
}

// 小屏幕适配
@media (max-width: 360px) {
  .header .logo h1 {
    font-size: 24px;
  }

  .header .subtitle {
    font-size: 16px;
  }

  .role-card {
    padding: 25px 15px;

    .role-icon {
      font-size: 50px;
    }

    .role-info .role-title {
      font-size: 20px;
    }
  }
}
</style>
