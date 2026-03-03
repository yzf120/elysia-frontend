<template>
  <div class="teacher-page teacher-dashboard">
    <!-- 顶部导航栏 -->
    <div class="teacher-top-nav">
      <div class="nav-left">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>教师端</el-breadcrumb-item>
          <el-breadcrumb-item>首页</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="nav-right">
        <el-button type="primary" link @click="goToProfile">
          <el-icon><User /></el-icon>
          我的
        </el-button>
      </div>
    </div>

    <!-- 欢迎区域 -->
    <div class="teacher-welcome">
      <h2>{{ greeting }}，{{ teacherName }}老师</h2>
      <p>今天也要认真教学哦！</p>
    </div>

    <!-- 主内容区 - Tab切换 -->
    <div class="teacher-card">
      <el-tabs v-model="activeTab" class="teacher-tabs">
        <!-- 我的班级Tab -->
        <el-tab-pane label="我的班级" name="classes">
          <div v-if="classList.length === 0" class="teacher-empty">
            <el-empty description="暂无班级">
              <el-icon :size="80"><School /></el-icon>
            </el-empty>
          </div>
          <div v-else>
            <el-table :data="classList" class="teacher-table" stripe>
              <el-table-column prop="name" label="班级名称" min-width="150">
                <template #default="{ row }">
                  <el-button type="primary" link @click="goToClassDetail(row.id)">
                    {{ row.name }}
                  </el-button>
                </template>
              </el-table-column>
              <el-table-column prop="subject" label="授课科目" width="120" />
              <el-table-column prop="semester" label="学期" width="120" />
              <el-table-column label="当前人数" width="150">
                <template #default="{ row }">
                  <span :class="{ 'text-danger': row.currentCount >= row.maxCount }">
                    {{ row.currentCount }} / {{ row.maxCount }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="code" label="班级验证码" width="120" />
              <el-table-column label="操作" width="200" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" size="small" @click="goToClassDetail(row.id)">
                    详情
                  </el-button>
                  <el-button type="danger" size="small" @click="deleteClass(row.id)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <!-- 分页 -->
            <div class="teacher-pagination">
              <el-pagination
                v-model:current-page="classPage"
                :page-size="10"
                layout="prev, pager, next"
                :total="classTotal"
                @current-change="loadClassList"
              />
            </div>
          </div>
        </el-tab-pane>

        <!-- 系统公告Tab -->
        <el-tab-pane label="系统公告" name="announcements">
          <div v-if="announcements.length === 0" class="teacher-empty">
            <el-empty description="暂无系统公告">
              <el-icon :size="80"><Bell /></el-icon>
            </el-empty>
          </div>
          <div v-else class="announcement-list">
            <el-card 
              v-for="item in announcements" 
              :key="item.id" 
              class="announcement-item"
              shadow="hover"
            >
              <div class="announcement-header">
                <h3>{{ item.title }}</h3>
                <el-tag type="warning" size="small">系统</el-tag>
              </div>
              <div class="announcement-meta">
                <span>
                  <el-icon><User /></el-icon>
                  管理员
                </span>
                <span>
                  <el-icon><Clock /></el-icon>
                  {{ formatDate(item.publishTime) }}
                </span>
              </div>
              <div class="announcement-content">
                {{ item.content }}
              </div>
            </el-card>
          </div>
          <!-- 分页 -->
          <div v-if="announcements.length > 0" class="teacher-pagination">
            <el-pagination
              v-model:current-page="announcementPage"
              :page-size="10"
              layout="prev, pager, next"
              :total="announcementTotal"
              @current-change="loadAnnouncements"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 快捷入口区 -->
    <div class="teacher-card">
      <h3 class="teacher-card-title">快捷入口</h3>
      <div class="teacher-quick-access">
        <div class="teacher-access-card" @click="goToCreateClass">
          <div class="card-icon" style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);">
            <el-icon :size="28"><Plus /></el-icon>
          </div>
          <div class="card-title">创建班级</div>
          <div class="card-desc">创建新的教学班级</div>
        </div>

        <div class="teacher-access-card" @click="goToClassManagement">
          <div class="card-icon" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
            <el-icon :size="28"><Reading /></el-icon>
          </div>
          <div class="card-title">班级管理</div>
          <div class="card-desc">查看和管理已创建班级</div>
        </div>

        <div class="teacher-access-card" @click="goToAIChat">
          <div class="card-icon" style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);">
            <el-icon :size="28"><ChatDotRound /></el-icon>
          </div>
          <div class="card-title">AI对话</div>
          <div class="card-desc">智能助教对话交流</div>
        </div>


      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { teacherAPI } from '@/services/index';

const router = useRouter();

// 教师信息
const teacherName = ref('教师');

// 当前激活的Tab
const activeTab = ref('classes');

// 班级列表数据
const classList = ref([]);
const classPage = ref(1);
const classTotal = ref(0);

// 系统公告数据
const announcements = ref([]);
const announcementPage = ref(1);
const announcementTotal = ref(0);

// 根据时间生成问候语
const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return '凌晨好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
});

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 加载班级列表
const loadClassList = async () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    if (!teacherId) {
      ElMessage.warning('未获取到教师信息，请重新登录');
      return;
    }
    const res = await teacherAPI.getTeacherClasses(teacherId, classPage.value, 10);
    const classes = res.classes || [];
    classList.value = classes.map(cls => ({
      id: cls.class_id,
      name: cls.class_name,
      subject: cls.subject_name,
      semester: cls.semester,
      currentCount: cls.current_students,
      maxCount: cls.max_students,
      code: cls.class_code,
      status: cls.status
    }));
    classTotal.value = res.total || classList.value.length;
  } catch (error) {
    console.error('加载班级列表失败:', error);
    ElMessage.error('加载班级列表失败');
  }
};

// 加载系统公告
const loadAnnouncements = async () => {
  try {
    // TODO: 调用API获取系统公告
    // 模拟数据
    announcements.value = [
      {
        id: 1,
        title: '系统维护通知',
        publishTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        content: '系统将于本周六凌晨2:00-4:00进行维护升级，期间可能无法访问，请提前做好安排。'
      },
      {
        id: 2,
        title: '新功能上线通知',
        publishTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        content: 'AI代码审核功能已上线，支持Python、Java、JavaScript等主流编程语言的自动批改。'
      }
    ];
    announcementTotal.value = announcements.value.length;
  } catch (error) {
    console.error('加载系统公告失败:', error);
    ElMessage.error('加载系统公告失败');
  }
};

// 删除班级
const deleteClass = async (classId) => {
  try {
    await ElMessageBox.confirm('确定要删除该班级吗？删除后无法恢复！', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    await teacherAPI.deleteClass(teacherId, classId);
    ElMessage.success('删除成功');
    loadClassList();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除班级失败:', error);
      ElMessage.error('删除班级失败');
    }
  }
};

// 跳转到班级详情
const goToClassDetail = (classId) => {
  router.push({ name: 'ClassDetail', params: { id: classId } });
};

// 跳转到个人信息中心
const goToProfile = () => {
  router.push({ name: 'TeacherProfile' });
};

// 跳转到创建班级
const goToCreateClass = () => {
  router.push({ name: 'CreateClass' });
};

// 跳转到班级管理
const goToClassManagement = () => {
  router.push({ name: 'ClassManagement' });
};

// 跳转到AI对话
const goToAIChat = () => {
  router.push({ name: 'TeacherAIChat' });
};

// 页面加载时获取数据
onMounted(() => {
  // 模仿 app 端：从 userInfo 解析教师名字
  const raw = localStorage.getItem('userInfo')
  if (raw && raw !== 'undefined' && raw !== 'null') {
    try {
      const parsed = JSON.parse(raw)
      teacherName.value = parsed.teacher_name || parsed.name || localStorage.getItem('userName') || '教师'
    } catch {}
  } else {
    teacherName.value = localStorage.getItem('userName') || '教师'
  }
  loadClassList();
  loadAnnouncements();
});
</script>

<style scoped lang="scss">
@import '@/styles/teacher.css';

.teacher-dashboard {
  // 公告列表
  .announcement-list {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .announcement-item {
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
      }

      .announcement-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        h3 {
          margin: 0;
          font-size: 17px;
          font-weight: 600;
          color: var(--teacher-text-primary);
        }
      }

      .announcement-meta {
        display: flex;
        gap: 20px;
        margin-bottom: 12px;
        font-size: 13px;
        color: var(--teacher-text-secondary);

        span {
          display: flex;
          align-items: center;
          gap: 5px;
        }
      }

      .announcement-content {
        font-size: 14px;
        color: var(--teacher-text-primary);
        line-height: 1.6;
      }
    }
  }

  // 文本颜色
  .text-danger {
    color: var(--teacher-danger);
    font-weight: 600;
  }
}

// 响应式
@media (max-width: 768px) {
  .pending-section {
    grid-template-columns: 1fr !important;
  }
}
</style>
