<template>
  <div class="student-profile-page">
    <!-- 顶部栏 -->
    <div class="top-bar">
      <el-button type="primary" @click="goBack" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
        返回首页
      </el-button>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>学生端</el-breadcrumb-item>
        <el-breadcrumb-item>个人信息中心</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="profile-container">
      <!-- 个人信息卡片头部 -->
      <div class="profile-header">
        <div class="header-bg"></div>
        <div class="header-content">
          <div class="avatar-section">
            <div class="avatar-wrapper">
              <el-avatar :size="120" class="user-avatar">
                <el-icon :size="60"><User /></el-icon>
              </el-avatar>
              <div class="avatar-badge">
                <el-icon><Star /></el-icon>
              </div>
            </div>
          </div>
          <div class="user-info">
            <h2 class="user-name">{{ profileForm.name || '学生' }}</h2>
            <p class="user-username">@{{ profileForm.username }}</p>
            <div class="user-tags">
              <el-tag type="success" effect="plain">{{ profileForm.major || '未设置专业' }}</el-tag>
              <el-tag type="primary" effect="plain">{{ getGradeLabel(profileForm.grade) }}</el-tag>
            </div>
          </div>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="profile-tabs">
        <!-- 基本信息Tab -->
        <el-tab-pane label="基本信息" name="basic">
          <el-card class="info-card">
            <template #header>
              <div class="card-header">
                <el-icon class="header-icon"><User /></el-icon>
                <span>个人资料</span>
              </div>
            </template>
            <el-form :model="profileForm" label-width="120px" class="profile-form">
              <el-form-item label="用户名">
                <el-input v-model="profileForm.username" disabled>
                  <template #prefix>
                    <el-icon><User /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item label="姓名">
                <el-input v-model="profileForm.name" placeholder="请输入姓名">
                  <template #prefix>
                    <el-icon><Edit /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item label="邮箱">
                <el-input v-model="profileForm.email" placeholder="请输入邮箱">
                  <template #prefix>
                    <el-icon><Message /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item label="专业">
                <el-input v-model="profileForm.major" placeholder="请输入专业">
                  <template #prefix>
                    <el-icon><Reading /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item label="年级">
                <el-select v-model="profileForm.grade" placeholder="选择年级" style="width: 100%">
                  <el-option label="大一" value="1" />
                  <el-option label="大二" value="2" />
                  <el-option label="大三" value="3" />
                  <el-option label="大四" value="4" />
                </el-select>
              </el-form-item>
              <el-form-item label="兴趣爱好">
                <el-input 
                  v-model="profileForm.interests" 
                  type="textarea" 
                  :rows="3" 
                  placeholder="分享你的兴趣爱好..."
                  maxlength="200"
                  show-word-limit
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="saveProfile" size="large" class="save-btn">
                  <el-icon><Check /></el-icon>
                  保存修改
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-tab-pane>

        <!-- 学习进度Tab -->
        <el-tab-pane label="学习进度" name="progress">
          <el-card class="info-card">
            <template #header>
              <div class="card-header">
                <el-icon class="header-icon"><TrendCharts /></el-icon>
                <span>学习统计</span>
              </div>
            </template>
            <div class="progress-stats">
              <div class="stat-card">
                <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                  <el-icon :size="32"><Reading /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ studyStats.completedCourses }}</div>
                  <div class="stat-label">已完成课程</div>
                </div>
                <div class="stat-trend">
                  <el-icon color="#67c23a"><CaretTop /></el-icon>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                  <el-icon :size="32"><Document /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ studyStats.completedTasks }}</div>
                  <div class="stat-label">已完成作业</div>
                </div>
                <div class="stat-trend">
                  <el-icon color="#67c23a"><CaretTop /></el-icon>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                  <el-icon :size="32"><ChatDotRound /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ studyStats.aiSessions }}</div>
                  <div class="stat-label">AI对话次数</div>
                </div>
                <div class="stat-trend">
                  <el-icon color="#67c23a"><CaretTop /></el-icon>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                  <el-icon :size="32"><Clock /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ studyStats.studyHours }}</div>
                  <div class="stat-label">学习时长(小时)</div>
                </div>
                <div class="stat-trend">
                  <el-icon color="#67c23a"><CaretTop /></el-icon>
                </div>
              </div>
            </div>
          </el-card>
        </el-tab-pane>

        <!-- 安全设置Tab -->
        <el-tab-pane label="安全设置" name="security">
          <el-card class="info-card">
            <template #header>
              <div class="card-header">
                <el-icon class="header-icon"><Lock /></el-icon>
                <span>密码修改</span>
              </div>
            </template>
            <el-form :model="securityForm" label-width="120px" class="security-form">
              <el-form-item label="当前密码">
                <el-input 
                  v-model="securityForm.oldPassword" 
                  type="password" 
                  show-password
                  placeholder="请输入当前密码"
                >
                  <template #prefix>
                    <el-icon><Lock /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item label="新密码">
                <el-input 
                  v-model="securityForm.newPassword" 
                  type="password" 
                  show-password
                  placeholder="请输入新密码（至少6位）"
                >
                  <template #prefix>
                    <el-icon><Key /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item label="确认新密码">
                <el-input 
                  v-model="securityForm.confirmPassword" 
                  type="password" 
                  show-password
                  placeholder="请再次输入新密码"
                >
                  <template #prefix>
                    <el-icon><Key /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="changePassword" size="large" class="save-btn">
                  <el-icon><Check /></el-icon>
                  修改密码
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-tab-pane>
      </el-tabs>

      <!-- 退出登录按钮 -->
      <div class="logout-section">
        <el-button type="danger" @click="logout" size="large" plain class="logout-btn">
          <el-icon><SwitchButton /></el-icon>
          退出登录
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();

const activeTab = ref('basic');

// 基本信息表单
const profileForm = ref({
  username: '',
  name: '',
  email: '',
  major: '',
  grade: '',
  interests: ''
});

// 学习统计
const studyStats = ref({
  completedCourses: 0,
  completedTasks: 0,
  aiSessions: 0,
  studyHours: 0
});

// 安全设置表单
const securityForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 加载个人信息
const loadProfile = async () => {
  try {
    // TODO: 调用API获取个人信息
    profileForm.value = {
      username: localStorage.getItem('userName') || 'student001',
      name: '张三',
      email: 'zhangsan@example.com',
      major: '计算机科学与技术',
      grade: '2',
      interests: '编程、算法、人工智能'
    };

    studyStats.value = {
      completedCourses: 12,
      completedTasks: 45,
      aiSessions: 128,
      studyHours: 156
    };
  } catch (error) {
    console.error('加载个人信息失败:', error);
  }
};

// 保存个人信息
const saveProfile = async () => {
  try {
    // TODO: 调用API保存个人信息
    ElMessage.success('保存成功');
  } catch (error) {
    console.error('保存失败:', error);
    ElMessage.error('保存失败');
  }
};

// 修改密码
const changePassword = async () => {
  if (!securityForm.value.oldPassword || !securityForm.value.newPassword || !securityForm.value.confirmPassword) {
    ElMessage.warning('请填写完整信息');
    return;
  }

  if (securityForm.value.newPassword !== securityForm.value.confirmPassword) {
    ElMessage.error('两次输入的新密码不一致');
    return;
  }

  if (securityForm.value.newPassword.length < 6) {
    ElMessage.error('密码长度不能少于6位');
    return;
  }

  try {
    // TODO: 调用API修改密码
    ElMessage.success('密码修改成功');
    securityForm.value = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  } catch (error) {
    console.error('修改密码失败:', error);
    ElMessage.error('修改密码失败');
  }
};

// 退出登录
const logout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('userName');
    
    ElMessage.success('已退出登录');
    router.push('/');
  } catch {
    // 用户取消
  }
};

// 返回首页
const goBack = () => {
  router.push({ name: 'StudentDashboard' });
};

// 获取年级标签
const getGradeLabel = (grade) => {
  const gradeMap = {
    '1': '大一',
    '2': '大二',
    '3': '大三',
    '4': '大四'
  };
  return gradeMap[grade] || '未设置';
};

onMounted(() => {
  loadProfile();
});
</script>

<style scoped lang="scss">
.student-profile-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;

  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    background: rgba(255, 255, 255, 0.95);
    padding: 15px 25px;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }

    .back-btn {
      border-radius: 10px;
      padding: 10px 20px;
      font-weight: 500;
      transition: all 0.3s ease;

      &:hover {
        transform: translateX(-3px);
      }
    }
  }

  .profile-container {
    max-width: 1000px;
    margin: 0 auto;

    .profile-header {
      position: relative;
      background: white;
      border-radius: 20px;
      overflow: hidden;
      margin-bottom: 24px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        transform: translateY(-4px);
      }

      .header-bg {
        height: 180px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        position: relative;
        overflow: hidden;

        &::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          animation: pulse 8s ease-in-out infinite;
        }
      }

      .header-content {
        padding: 0 40px 30px;
        display: flex;
        align-items: flex-end;
        gap: 30px;
        margin-top: -60px;
        position: relative;

        .avatar-section {
          .avatar-wrapper {
            position: relative;
            
            .user-avatar {
              border: 5px solid white;
              box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              transition: all 0.3s ease;

              &:hover {
                transform: scale(1.05);
                box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
              }
            }

            .avatar-badge {
              position: absolute;
              bottom: 5px;
              right: 5px;
              width: 32px;
              height: 32px;
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              border: 3px solid white;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
          }
        }

        .user-info {
          flex: 1;
          padding-bottom: 10px;

          .user-name {
            font-size: 28px;
            font-weight: 600;
            color: #303133;
            margin: 0 0 8px 0;
          }

          .user-username {
            font-size: 14px;
            color: #909399;
            margin: 0 0 12px 0;
          }

          .user-tags {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;

            .el-tag {
              border-radius: 20px;
              padding: 6px 16px;
              font-size: 13px;
            }
          }
        }
      }
    }

    .profile-tabs {
      background: white;
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      margin-bottom: 24px;
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
      }

      :deep(.el-tabs__header) {
        margin-bottom: 30px;
      }

      :deep(.el-tabs__item) {
        font-size: 16px;
        font-weight: 500;
        padding: 0 30px;
        transition: all 0.3s ease;

        &:hover {
          color: #667eea;
        }
      }

      :deep(.el-tabs__active-bar) {
        height: 3px;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      }

      .info-card {
        border: none;
        box-shadow: none;

        :deep(.el-card__header) {
          padding: 0 0 20px 0;
          border-bottom: 2px solid #f0f0f0;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          font-weight: 600;
          color: #303133;

          .header-icon {
            font-size: 22px;
            color: #667eea;
          }
        }

        :deep(.el-card__body) {
          padding: 30px 0 0 0;
        }
      }

      .profile-form,
      .security-form {
        max-width: 600px;

        .el-form-item {
          margin-bottom: 24px;
        }

        :deep(.el-input__wrapper) {
          border-radius: 10px;
          padding: 8px 15px;
          transition: all 0.3s ease;

          &:hover {
            box-shadow: 0 0 0 1px #667eea inset;
          }
        }

        :deep(.el-textarea__inner) {
          border-radius: 10px;
          padding: 12px 15px;
          transition: all 0.3s ease;

          &:hover {
            border-color: #667eea;
          }
        }

        :deep(.el-select) {
          width: 100%;
        }

        .save-btn {
          width: 200px;
          border-radius: 10px;
          font-weight: 500;
          padding: 12px 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          transition: all 0.3s ease;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
          }

          &:active {
            transform: translateY(0);
          }
        }
      }

      .progress-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 20px;

        .stat-card {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 24px;
          background: white;
          border-radius: 16px;
          border: 2px solid #f0f0f0;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;

          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
            opacity: 0;
            transition: opacity 0.3s ease;
          }

          &:hover {
            border-color: #667eea;
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);

            &::before {
              opacity: 1;
            }
          }

          .stat-icon {
            width: 64px;
            height: 64px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            flex-shrink: 0;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transition: all 0.3s ease;
          }

          &:hover .stat-icon {
            transform: scale(1.1) rotate(5deg);
          }

          .stat-info {
            flex: 1;

            .stat-value {
              font-size: 32px;
              font-weight: 700;
              color: #303133;
              margin-bottom: 5px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }

            .stat-label {
              font-size: 14px;
              color: #909399;
              font-weight: 500;
            }
          }

          .stat-trend {
            font-size: 20px;
            animation: bounce 2s ease-in-out infinite;
          }
        }
      }
    }

    .logout-section {
      text-align: center;
      background: rgba(255, 255, 255, 0.95);
      padding: 30px;
      border-radius: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
      }

      .logout-btn {
        min-width: 200px;
        border-radius: 10px;
        font-weight: 500;
        padding: 12px 30px;
        font-size: 15px;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(245, 87, 108, 0.3);
        }
      }
    }
  }
}

@keyframes pulse {
  0%, 100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(-5%, -5%);
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}
</style>
