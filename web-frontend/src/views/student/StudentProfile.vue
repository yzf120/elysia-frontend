<template>
  <div class="student-profile-page">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="bg-circle bg-circle-1"></div>
      <div class="bg-circle bg-circle-2"></div>
      <div class="bg-circle bg-circle-3"></div>
    </div>

    <!-- 顶部导航 -->
    <div class="top-nav">
      <el-button class="back-btn" @click="goBack" round>
        <el-icon><ArrowLeft /></el-icon>
        <span>返回首页</span>
      </el-button>
      <h1 class="page-title">个人中心</h1>
      <div class="nav-spacer"></div>
    </div>

    <div class="profile-layout">
      <!-- 左侧 - 个人名片 -->
      <div class="left-panel">
        <!-- 用户名片卡 -->
        <div class="user-card">
          <div class="user-card-bg"></div>
          <div class="user-card-content">
            <div class="avatar-container">
              <el-avatar :size="90" class="user-avatar">
                <span class="avatar-text">{{ (profileForm.name || '学').charAt(0) }}</span>
              </el-avatar>
              <div class="online-dot"></div>
            </div>
            <h2 class="display-name">{{ profileForm.name || '学生' }}</h2>
            <p class="username-label">@{{ profileForm.username }}</p>
            <div class="user-tags">
              <span class="tag tag-major">{{ profileForm.major || '未设置专业' }}</span>
              <span class="tag tag-grade">{{ getGradeLabel(profileForm.grade) }}</span>
            </div>
          </div>
        </div>

        <!-- 学习数据概览 -->
        <div class="stats-overview">
          <h3 class="section-mini-title">学习概览</h3>
          <div class="mini-stat-list">
            <div class="mini-stat-item">
              <div class="mini-stat-icon icon-course">
                <el-icon><Reading /></el-icon>
              </div>
              <div class="mini-stat-detail">
                <span class="mini-stat-value">{{ studyStats.completedCourses }}/{{ studyStats.totalCourses }}</span>
                <span class="mini-stat-label">已完成课程</span>
              </div>
            </div>
            <div class="mini-stat-item">
              <div class="mini-stat-icon icon-chapter">
                <el-icon><Document /></el-icon>
              </div>
              <div class="mini-stat-detail">
                <span class="mini-stat-value">{{ studyStats.completedChapters }}/{{ studyStats.totalChapters }}</span>
                <span class="mini-stat-label">已完成章节</span>
              </div>
            </div>
            <div class="mini-stat-item">
              <div class="mini-stat-icon icon-ai">
                <el-icon><ChatDotRound /></el-icon>
              </div>
              <div class="mini-stat-detail">
                <span class="mini-stat-value">{{ studyStats.aiSessions }}</span>
                <span class="mini-stat-label">AI 对话次数</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 做题画像数据 -->
        <div class="stats-overview coding-stats" v-if="codingStats.hasProfile">
          <h3 class="section-mini-title">🎯 做题画像</h3>
          <div class="mini-stat-list">
            <div class="mini-stat-item">
              <div class="mini-stat-icon icon-solve">
                <el-icon><Finished /></el-icon>
              </div>
              <div class="mini-stat-detail">
                <span class="mini-stat-value">{{ codingStats.solvedProblemCount }}/{{ codingStats.attemptedProblemCount }}</span>
                <span class="mini-stat-label">已解决/尝试题目</span>
              </div>
            </div>
            <div class="mini-stat-item">
              <div class="mini-stat-icon icon-rate">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="mini-stat-detail">
                <span class="mini-stat-value">{{ (codingStats.acceptRate * 100).toFixed(1) }}%</span>
                <span class="mini-stat-label">通过率（{{ codingStats.totalSubmissions }} 次提交）</span>
              </div>
            </div>
            <div class="mini-stat-item">
              <div class="mini-stat-icon icon-lang">
                <el-icon><Monitor /></el-icon>
              </div>
              <div class="mini-stat-detail">
                <span class="mini-stat-value">{{ codingStats.preferredLanguage || '-' }}</span>
                <span class="mini-stat-label">最常用语言</span>
              </div>
            </div>
            <div class="mini-stat-item" v-if="codingStats.languageStats && Object.keys(codingStats.languageStats).length > 0">
              <div class="mini-stat-icon icon-stats">
                <el-icon><DataAnalysis /></el-icon>
              </div>
              <div class="mini-stat-detail">
                <div class="lang-tags">
                  <span class="lang-tag" v-for="(count, lang) in codingStats.languageStats" :key="lang">
                    {{ lang }}: {{ count }}次
                  </span>
                </div>
                <span class="mini-stat-label">语言使用统计</span>
              </div>
            </div>
            <div class="mini-stat-item">
              <div class="mini-stat-icon icon-level">
                <el-icon><Medal /></el-icon>
              </div>
              <div class="mini-stat-detail">
                <span class="mini-stat-value">
                  <el-tag :type="levelTagType" size="small" round>{{ levelLabel }}</el-tag>
                </span>
                <span class="mini-stat-label">AI 评估能力等级</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 快捷操作 -->
        <div class="quick-actions">
          <button 
            class="nav-item" 
            :class="{ active: activeTab === 'basic' }" 
            @click="activeTab = 'basic'"
          >
            <el-icon><User /></el-icon>
            <span>基本信息</span>
            <el-icon class="arrow-icon"><ArrowRight /></el-icon>
          </button>
          <button 
            class="nav-item" 
            :class="{ active: activeTab === 'security' }" 
            @click="activeTab = 'security'"
          >
            <el-icon><Lock /></el-icon>
            <span>安全设置</span>
            <el-icon class="arrow-icon"><ArrowRight /></el-icon>
          </button>
          <button class="nav-item logout-item" @click="logout">
            <el-icon><SwitchButton /></el-icon>
            <span>退出登录</span>
            <el-icon class="arrow-icon"><ArrowRight /></el-icon>
          </button>
        </div>
      </div>

      <!-- 右侧 - 内容区 -->
      <div class="right-panel">
        <!-- 基本信息 -->
        <transition name="fade-slide" mode="out-in">
          <div v-if="activeTab === 'basic'" key="basic" class="content-card">
            <div class="card-title-bar">
              <div class="card-title-left">
                <div class="title-icon-wrap">
                  <el-icon><User /></el-icon>
                </div>
                <div>
                  <h2 class="card-title">基本信息</h2>
                  <p class="card-subtitle">管理你的个人资料</p>
                </div>
              </div>
            </div>

            <el-form :model="profileForm" label-position="top" class="modern-form">
              <div class="form-grid">
                <el-form-item label="用户名">
                  <el-input v-model="profileForm.username" disabled class="form-input">
                    <template #prefix>
                      <el-icon><User /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
                <el-form-item label="姓名">
                  <el-input v-model="profileForm.name" placeholder="请输入姓名" class="form-input">
                    <template #prefix>
                      <el-icon><Edit /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
                <el-form-item label="邮箱">
                  <el-input v-model="profileForm.email" placeholder="请输入邮箱" class="form-input">
                    <template #prefix>
                      <el-icon><Message /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
                <el-form-item label="专业">
                  <el-input v-model="profileForm.major" placeholder="请输入专业" class="form-input">
                    <template #prefix>
                      <el-icon><Reading /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
                <el-form-item label="年级">
                  <el-select v-model="profileForm.grade" placeholder="选择年级" class="form-select">
                    <el-option label="大一" value="1" />
                    <el-option label="大二" value="2" />
                    <el-option label="大三" value="3" />
                    <el-option label="大四" value="4" />
                  </el-select>
                </el-form-item>
              </div>
              <el-form-item label="兴趣爱好" class="full-width-item">
                <el-input
                  v-model="profileForm.interests"
                  type="textarea"
                  :rows="3"
                  placeholder="分享你的兴趣爱好..."
                  maxlength="200"
                  show-word-limit
                  class="form-textarea"
                />
              </el-form-item>
              <div class="form-actions">
                <el-button type="primary" @click="saveProfile" class="primary-action-btn" round size="large">
                  <el-icon><Check /></el-icon>
                  保存修改
                </el-button>
              </div>
            </el-form>
          </div>

          <!-- 安全设置 -->
          <div v-else-if="activeTab === 'security'" key="security" class="content-card">
            <div class="card-title-bar">
              <div class="card-title-left">
                <div class="title-icon-wrap icon-security">
                  <el-icon><Lock /></el-icon>
                </div>
                <div>
                  <h2 class="card-title">安全设置</h2>
                  <p class="card-subtitle">修改你的登录密码</p>
                </div>
              </div>
            </div>

            <el-form :model="securityForm" label-position="top" class="modern-form security-form-area">
              <el-form-item label="当前密码">
                <el-input
                  v-model="securityForm.oldPassword"
                  type="password"
                  show-password
                  placeholder="请输入当前密码"
                  class="form-input"
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
                  class="form-input"
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
                  class="form-input"
                >
                  <template #prefix>
                    <el-icon><Key /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <div class="form-actions">
                <el-button type="primary" @click="changePassword" class="primary-action-btn" round size="large">
                  <el-icon><Check /></el-icon>
                  修改密码
                </el-button>
              </div>
            </el-form>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { studentAPI } from '@/services/index';

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
  totalCourses: 0,
  completedChapters: 0,
  totalChapters: 0,
  aiSessions: 0
});

// 做题画像数据
const codingStats = ref({
  hasProfile: false,
  totalSubmissions: 0,
  acceptedCount: 0,
  acceptRate: 0,
  solvedProblemCount: 0,
  attemptedProblemCount: 0,
  preferredLanguage: '',
  languageStats: {},
  commonErrors: [],
  difficultyLevel: 'beginner',
  avgTimeCost: 0,
  lastSubmitTime: null
});

// 能力等级标签
const levelLabel = computed(() => {
  const map = { beginner: '初学者', intermediate: '进阶者', advanced: '高手' };
  return map[codingStats.value.difficultyLevel] || '初学者';
});
const levelTagType = computed(() => {
  const map = { beginner: 'info', intermediate: 'warning', advanced: 'success' };
  return map[codingStats.value.difficultyLevel] || 'info';
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
    const res = await studentAPI.getProfile();
    const student = res?.data?.student;
    if (student) {
      profileForm.value = {
        username: student.student_number || '',
        name: student.student_name || '',
        email: student.email || '',
        major: student.major || '',
        grade: student.grade || '',
        interests: (student.interests && student.interests.length > 0) ? student.interests[0] : ''
      };
    }
  } catch (error) {
    console.error('加载个人信息失败:', error);
    // 如果接口失败，从本地存储获取基本信息
    profileForm.value.username = localStorage.getItem('userName') || '';
  }
};

// 加载学习统计
const loadStudyStats = async () => {
  try {
    const res = await studentAPI.getStudyStats();
    const data = res?.data;
    if (data) {
      studyStats.value = {
        completedCourses: data.completed_courses || 0,
        totalCourses: data.total_courses || 0,
        completedChapters: data.completed_chapters || 0,
        totalChapters: data.total_chapters || 0,
        aiSessions: data.ai_sessions || 0
      };
    }
  } catch (error) {
    console.error('加载学习统计失败:', error);
  }
};

// 加载做题画像
const loadCodingStats = async () => {
  try {
    const res = await studentAPI.getCodingStats();
    const data = res?.data;
    if (data && data.has_profile) {
      codingStats.value = {
        hasProfile: true,
        totalSubmissions: data.total_submissions || 0,
        acceptedCount: data.accepted_count || 0,
        acceptRate: data.accept_rate || 0,
        solvedProblemCount: data.solved_problem_count || 0,
        attemptedProblemCount: data.attempted_problem_count || 0,
        preferredLanguage: data.preferred_language || '',
        languageStats: data.language_stats || {},
        commonErrors: data.common_errors || [],
        difficultyLevel: data.difficulty_level || 'beginner',
        avgTimeCost: data.avg_time_cost || 0,
        lastSubmitTime: data.last_submit_time
      };
    }
  } catch (error) {
    console.error('加载做题画像失败:', error);
  }
};

// 保存个人信息
const saveProfile = async () => {
  try {
    await studentAPI.updateProfile({
      name: profileForm.value.name,
      email: profileForm.value.email,
      major: profileForm.value.major,
      grade: profileForm.value.grade,
      interests: profileForm.value.interests
    });
    ElMessage.success('保存成功');
  } catch (error) {
    console.error('保存失败:', error);
    ElMessage.error(typeof error === 'string' ? error : '保存失败');
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
    // 调用API修改密码
    await studentAPI.updatePassword(securityForm.value.oldPassword, securityForm.value.newPassword);
    ElMessage.success('密码修改成功');
    securityForm.value = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  } catch (error) {
    console.error('修改密码失败:', error);
    ElMessage.error(typeof error === 'string' ? error : '修改密码失败');
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
  loadStudyStats();
  loadCodingStats();
});
</script>

<style scoped lang="scss">
.student-profile-page {
  min-height: 100vh;
  background: #f0f2f5;
  padding: 24px 32px;
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
.bg-decoration {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
}

.bg-circle-1 {
  width: 500px;
  height: 500px;
  background: rgba(79, 110, 247, 0.15);
  top: -100px;
  right: -100px;
}

.bg-circle-2 {
  width: 400px;
  height: 400px;
  background: rgba(96, 165, 250, 0.12);
  bottom: -50px;
  left: -50px;
}

.bg-circle-3 {
  width: 300px;
  height: 300px;
  background: rgba(59, 130, 246, 0.1);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* 顶部导航 */
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  position: relative;
  z-index: 1;

  .back-btn {
    background: white;
    border: 1px solid #e5e7eb;
    color: #374151;
    padding: 10px 22px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;

    &:hover {
      background: #f9fafb;
      border-color: #d1d5db;
      transform: translateX(-2px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
  }

  .page-title {
    font-size: 22px;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
    letter-spacing: -0.02em;
  }

  .nav-spacer {
    width: 120px;
  }
}

/* 主布局 */
.profile-layout {
  display: flex;
  gap: 28px;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* ===== 左侧面板 ===== */
.left-panel {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 用户名片 */
.user-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 8px 24px rgba(0, 0, 0, 0.04);
  position: relative;

  .user-card-bg {
    height: 100px;
    background: linear-gradient(135deg, #4F6EF7 0%, #7CB8FF 50%, #BBD7FF 100%);
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 40px;
      background: white;
      border-radius: 20px 20px 0 0;
    }
  }

  .user-card-content {
    padding: 0 24px 28px;
    text-align: center;
    margin-top: -55px;
    position: relative;
    z-index: 1;
  }

  .avatar-container {
    position: relative;
    display: inline-block;
    margin-bottom: 14px;

    .user-avatar {
      background: linear-gradient(135deg, #4F6EF7 0%, #7CB8FF 100%);
      border: 4px solid white;
      box-shadow: 0 4px 16px rgba(79, 110, 247, 0.3);

      .avatar-text {
        font-size: 36px;
        font-weight: 700;
        color: white;
      }
    }

    .online-dot {
      position: absolute;
      bottom: 6px;
      right: 6px;
      width: 16px;
      height: 16px;
      background: #22c55e;
      border: 3px solid white;
      border-radius: 50%;
    }
  }

  .display-name {
    font-size: 20px;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 4px;
  }

  .username-label {
    font-size: 13px;
    color: #9ca3af;
    margin: 0 0 14px;
  }

  .user-tags {
    display: flex;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;

    .tag {
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }

    .tag-major {
      background: #ede9fe;
      color: #4F6EF7;
    }

    .tag-grade {
      background: #dbeafe;
      color: #2563eb;
    }
  }
}

/* 学习概览 */
.stats-overview {
  background: white;
  border-radius: 20px;
  padding: 22px 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 8px 24px rgba(0, 0, 0, 0.04);

  .section-mini-title {
    font-size: 14px;
    font-weight: 600;
    color: #6b7280;
    margin: 0 0 16px 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .mini-stat-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .mini-stat-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 10px 12px;
    border-radius: 14px;
    transition: background 0.2s ease;

    &:hover {
      background: #f9fafb;
    }

    .mini-stat-icon {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;

      &.icon-course {
        background: linear-gradient(135deg, #eef2ff, #e0e7ff);
        color: #4F6EF7;
      }

      &.icon-chapter {
        background: linear-gradient(135deg, #fdf2f8, #fce7f3);
        color: #ec4899;
      }

      &.icon-ai {
        background: linear-gradient(135deg, #ecfdf5, #d1fae5);
        color: #10b981;
      }

      &.icon-solve {
        background: linear-gradient(135deg, #fef3c7, #fde68a);
        color: #d97706;
      }

      &.icon-rate {
        background: linear-gradient(135deg, #ede9fe, #ddd6fe);
        color: #7c3aed;
      }

      &.icon-lang {
        background: linear-gradient(135deg, #e0f2fe, #bae6fd);
        color: #0284c7;
      }

      &.icon-stats {
        background: linear-gradient(135deg, #fce7f3, #fbcfe8);
        color: #db2777;
      }

      &.icon-level {
        background: linear-gradient(135deg, #fff7ed, #fed7aa);
        color: #ea580c;
      }
    }

    .mini-stat-detail {
      display: flex;
      flex-direction: column;

      .mini-stat-value {
        font-size: 18px;
        font-weight: 700;
        color: #1f2937;
        line-height: 1.2;
      }

      .mini-stat-label {
        font-size: 12px;
        color: #9ca3af;
        margin-top: 2px;
      }
    }
  }

  .lang-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;

    .lang-tag {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      background: #f3f4f6;
      color: #374151;
    }
  }
}

/* 导航菜单 */
.quick-actions {
  background: white;
  border-radius: 20px;
  padding: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 8px 24px rgba(0, 0, 0, 0.04);

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 14px 16px;
    border: none;
    background: transparent;
    border-radius: 14px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    transition: all 0.2s ease;

    .el-icon {
      font-size: 18px;
    }

    span {
      flex: 1;
      text-align: left;
    }

    .arrow-icon {
      font-size: 14px;
      color: #d1d5db;
      transition: transform 0.2s ease;
    }

    &:hover {
      background: #f9fafb;
      .arrow-icon {
        transform: translateX(3px);
        color: #9ca3af;
      }
    }

    &.active {
      background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
      color: #4F6EF7;

      .arrow-icon {
        color: #4F6EF7;
      }
    }

    &.logout-item {
      color: #ef4444;
      margin-top: 4px;

      &:hover {
        background: #fef2f2;
      }
    }
  }
}

/* ===== 右侧面板 ===== */
.right-panel {
  flex: 1;
  min-width: 0;
}

.content-card {
  background: white;
  border-radius: 20px;
  padding: 32px 36px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 8px 24px rgba(0, 0, 0, 0.04);
}

.card-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f3f4f6;

  .card-title-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .title-icon-wrap {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: linear-gradient(135deg, #4F6EF7 0%, #7CB8FF 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 22px;
    box-shadow: 0 4px 12px rgba(79, 110, 247, 0.25);

    &.icon-security {
      background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
    }
  }

  .card-title {
    font-size: 20px;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
  }

  .card-subtitle {
    font-size: 13px;
    color: #9ca3af;
    margin: 4px 0 0;
  }
}

/* 表单样式 */
.modern-form {
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 28px;
  }

  .full-width-item {
    margin-top: 4px;
  }

  :deep(.el-form-item__label) {
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    padding-bottom: 6px;
  }

  :deep(.el-input__wrapper) {
    border-radius: 12px;
    padding: 6px 14px;
    box-shadow: 0 0 0 1px #e5e7eb inset;
    transition: all 0.2s ease;

    &:hover {
      box-shadow: 0 0 0 1px #c7d2fe inset;
    }

    &.is-focus {
      box-shadow: 0 0 0 2px #4F6EF7 inset;
    }
  }

  :deep(.el-textarea__inner) {
    border-radius: 12px;
    padding: 12px 14px;
    transition: all 0.2s ease;

    &:hover {
      border-color: #c7d2fe;
    }

    &:focus {
      border-color: #4F6EF7;
      box-shadow: 0 0 0 2px rgba(79, 110, 247, 0.15);
    }
  }

  :deep(.el-select) {
    width: 100%;
  }

  .form-actions {
    margin-top: 28px;
    display: flex;
    justify-content: flex-end;
  }

  .primary-action-btn {
    min-width: 160px;
    height: 44px;
    font-size: 15px;
    font-weight: 600;
    background: linear-gradient(135deg, #4F6EF7 0%, #7CB8FF 100%);
    border: none;
    box-shadow: 0 4px 14px rgba(79, 110, 247, 0.3);
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(79, 110, 247, 0.4);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

.security-form-area {
  max-width: 500px;
}

/* 过渡动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

/* 响应式 */
@media (max-width: 900px) {
  .student-profile-page {
    padding: 16px;
  }

  .profile-layout {
    flex-direction: column;
  }

  .left-panel {
    width: 100%;
  }

  .modern-form .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
