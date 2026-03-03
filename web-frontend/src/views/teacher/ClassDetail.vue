<template>
  <div class="teacher-page class-detail-page">
    <!-- 顶部导航栏 -->
    <div class="teacher-top-nav">
      <div class="nav-left">
        <el-button type="primary" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回首页
        </el-button>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>教师端</el-breadcrumb-item>
          <el-breadcrumb-item>班级详情</el-breadcrumb-item>
          <el-breadcrumb-item>{{ classInfo.name }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </div>

    <!-- 班级信息卡片 -->
    <div class="teacher-card class-info-card">
      <div class="info-row">
        <div class="info-item">
          <span class="label">班级名称：</span>
          <span class="value">{{ classInfo.name }}</span>
        </div>
        <div class="info-item">
          <span class="label">授课科目：</span>
          <span class="value">{{ classInfo.subject }}</span>
        </div>
        <div class="info-item">
          <span class="label">学期：</span>
          <span class="value">{{ classInfo.semester }}</span>
        </div>
        <div class="info-item">
          <span class="label">班级验证码：</span>
          <span class="value code">{{ classInfo.code }}</span>
        </div>
      </div>
    </div>

    <!-- 主内容区 - Tab切换 -->
    <div class="teacher-card">
      <el-tabs v-model="activeTab" class="teacher-tabs">
        <!-- 班级成员Tab -->
        <el-tab-pane label="班级成员" name="members">
          <div class="tab-header">
            <el-input
              v-model="memberSearch"
              placeholder="搜索学生姓名或学号"
              style="width: 300px"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>

          <el-table :data="filteredMembers" class="teacher-table" stripe>
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="name" label="姓名" width="120" />
            <el-table-column prop="studentId" label="学号" width="150" />
            <el-table-column prop="email" label="邮箱" min-width="200" />
            <el-table-column prop="joinTime" label="加入时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.joinTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button type="danger" size="small" @click="removeMember(row.id)">
                  移除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="teacher-pagination">
            <el-pagination
              v-model:current-page="memberPage"
              :page-size="10"
              layout="prev, pager, next"
              :total="memberTotal"
            />
          </div>
        </el-tab-pane>

        <!-- 班级公告Tab -->
        <el-tab-pane label="班级公告" name="announcements">
          <!-- 发布公告区域 -->
          <div class="publish-section">
            <h4>发布新公告</h4>
            <el-form :model="announcementForm" label-width="80px">
              <el-form-item label="公告标题">
                <el-input
                  v-model="announcementForm.title"
                  placeholder="请输入公告标题"
                  clearable
                />
              </el-form-item>
              <el-form-item label="公告内容">
                <el-input
                  v-model="announcementForm.content"
                  type="textarea"
                  :rows="5"
                  placeholder="请输入公告内容"
                />
              </el-form-item>
              <el-form-item>
                <el-button
                  type="primary"
                  :loading="publishingAnnouncement"
                  @click="publishAnnouncement"
                  class="teacher-btn-primary"
                >
                  发布公告
                </el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 历史公告列表 -->
          <div class="history-section">
            <h4>历史公告</h4>
            <div v-if="announcementList.length === 0" class="teacher-empty">
              <el-empty description="暂无公告" />
            </div>
            <div v-else class="announcement-list">
              <el-card
                v-for="item in announcementList"
                :key="item.id"
                class="announcement-item"
                shadow="hover"
              >
                <div class="announcement-header">
                  <h3>{{ item.title }}</h3>
                  <div class="actions">
                    <el-button type="primary" size="small" link @click="editAnnouncement(item)">
                      编辑
                    </el-button>
                    <el-button type="danger" size="small" link @click="deleteAnnouncement(item.id)">
                      删除
                    </el-button>
                  </div>
                </div>
                <div class="announcement-meta">
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
          </div>
        </el-tab-pane>

        <!-- 任务管理Tab -->
        <el-tab-pane label="任务管理" name="tasks">
          <!-- 发布任务按钮 -->
          <div class="tab-header">
            <div class="task-buttons">
              <el-button type="primary" @click="publishTask('discussion')">
                <el-icon><ChatDotRound /></el-icon>
                发布讨论
              </el-button>
              <el-button type="success" @click="publishTask('homework')">
                <el-icon><Document /></el-icon>
                发布作业
              </el-button>
              <el-button type="warning" @click="publishTask('exam')">
                <el-icon><Edit /></el-icon>
                发布考试
              </el-button>
            </div>
          </div>

          <!-- 任务列表 -->
          <el-table :data="taskList" class="teacher-table" stripe>
            <el-table-column prop="title" label="任务名称" min-width="200" />
            <el-table-column label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getTaskTypeColor(row.type)">
                  {{ row.type }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="deadline" label="截止日期" width="180">
              <template #default="{ row }">
                {{ formatDate(row.deadline) }}
              </template>
            </el-table-column>
            <el-table-column label="完成情况" width="150">
              <template #default="{ row }">
                <span :class="{ 'text-success': row.completedCount === row.totalCount }">
                  {{ row.completedCount }} / {{ row.totalCount }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="viewTaskDetail(row.id)">
                  查看
                </el-button>
                <el-button type="danger" size="small" @click="deleteTask(row.id)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="teacher-pagination">
            <el-pagination
              v-model:current-page="taskPage"
              :page-size="10"
              layout="prev, pager, next"
              :total="taskTotal"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { teacherAPI } from '@/services/index';

const router = useRouter();
const route = useRoute();

// 当前激活的Tab
const activeTab = ref('members');

// 班级信息
const classInfo = ref({
  id: '',
  name: '',
  subject: '',
  semester: '',
  code: ''
});

// 班级成员相关
const memberList = ref([]);
const memberSearch = ref('');
const memberPage = ref(1);
const memberTotal = ref(0);

// 过滤后的成员列表
const filteredMembers = computed(() => {
  if (!memberSearch.value) return memberList.value;
  return memberList.value.filter(m =>
    m.name.includes(memberSearch.value) || m.studentId.includes(memberSearch.value)
  );
});

// 公告相关
const announcementForm = ref({
  title: '',
  content: ''
});
const publishingAnnouncement = ref(false);
const announcementList = ref([]);

// 任务相关
const taskList = ref([]);
const taskPage = ref(1);
const taskTotal = ref(0);

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 获取任务类型颜色
const getTaskTypeColor = (type) => {
  const colorMap = {
    '讨论': 'primary',
    '作业': 'success',
    '考试': 'warning'
  };
  return colorMap[type] || 'info';
};

// 加载班级信息
const loadClassInfo = async () => {
  try {
    const classId = route.params.id;
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    const res = await teacherAPI.getTeacherClasses(teacherId);
    const classes = res.classes || [];
    const found = classes.find(c => String(c.class_id) === String(classId));
    if (found) {
      classInfo.value = {
        id: found.class_id,
        name: found.class_name,
        subject: found.subject || found.subject_name,
        semester: found.semester,
        code: found.class_code
      };
    }
  } catch (error) {
    console.error('加载班级信息失败:', error);
    ElMessage.error('加载班级信息失败');
  }
};

// 加载班级成员
const loadMembers = async () => {
  try {
    const classId = route.params.id;
    const res = await teacherAPI.getClassMembers(classId, memberPage.value, 50);
    memberList.value = (res.members || []).map(m => ({
      id: m.student_id,
      name: m.student_name || m.student_id,
      studentId: m.student_number || m.student_id,
      email: m.email || '',
      joinTime: m.join_time
    }));
    memberTotal.value = res.total || memberList.value.length;
  } catch (error) {
    console.error('加载班级成员失败:', error);
    ElMessage.error('加载班级成员失败');
  }
};

// 移除成员
const removeMember = async (memberId) => {
  try {
    await ElMessageBox.confirm('确定要移除该学生吗？', '确认移除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    await teacherAPI.removeStudent(teacherId, route.params.id, memberId);
    ElMessage.success('移除成功');
    loadMembers();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('移除成员失败:', error);
      ElMessage.error('移除成员失败');
    }
  }
};

// 加载公告列表
const loadAnnouncements = async () => {
  try {
    // TODO: 调用API获取公告列表
    // 模拟数据
    announcementList.value = [
      {
        id: 1,
        title: '本周课程安排',
        content: '本周三将进行Python基础知识测试，请同学们认真复习。',
        publishTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        title: '作业提交提醒',
        content: '第三章课后习题截止日期为本周五，请尚未提交的同学抓紧时间。',
        publishTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  } catch (error) {
    console.error('加载公告列表失败:', error);
    ElMessage.error('加载公告列表失败');
  }
};

// 发布公告
const publishAnnouncement = async () => {
  if (!announcementForm.value.title.trim()) {
    ElMessage.warning('请输入公告标题');
    return;
  }
  if (!announcementForm.value.content.trim()) {
    ElMessage.warning('请输入公告内容');
    return;
  }

  try {
    publishingAnnouncement.value = true;
    // TODO: 调用API发布公告
    await new Promise(resolve => setTimeout(resolve, 1000));

    ElMessage.success('发布成功');
    announcementForm.value.title = '';
    announcementForm.value.content = '';
    loadAnnouncements();
  } catch (error) {
    console.error('发布公告失败:', error);
    ElMessage.error('发布公告失败');
  } finally {
    publishingAnnouncement.value = false;
  }
};

// 编辑公告
const editAnnouncement = (announcement) => {
  announcementForm.value.title = announcement.title;
  announcementForm.value.content = announcement.content;
  ElMessage.info('请修改后重新发布');
};

// 删除公告
const deleteAnnouncement = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除该公告吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    // TODO: 调用API删除公告
    ElMessage.success('删除成功');
    loadAnnouncements();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除公告失败:', error);
      ElMessage.error('删除公告失败');
    }
  }
};

// 加载任务列表
const loadTasks = async () => {
  try {
    // TODO: 调用API获取任务列表
    // 模拟数据
    taskList.value = [
      {
        id: 1,
        title: '第三章课后习题',
        type: '作业',
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        completedCount: 25,
        totalCount: 28
      },
      {
        id: 2,
        title: 'Python基础知识讨论',
        type: '讨论',
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        completedCount: 20,
        totalCount: 28
      },
      {
        id: 3,
        title: '期中考试',
        type: '考试',
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        completedCount: 0,
        totalCount: 28
      }
    ];
    taskTotal.value = taskList.value.length;
  } catch (error) {
    console.error('加载任务列表失败:', error);
    ElMessage.error('加载任务列表失败');
  }
};

// 发布任务
const publishTask = (type) => {
  const typeMap = {
    'discussion': '讨论',
    'homework': '作业',
    'exam': '考试'
  };
  router.push({
    name: 'PublishTask',
    query: {
      classId: classInfo.value.id,
      type: typeMap[type]
    }
  });
};

// 查看任务详情
const viewTaskDetail = (taskId) => {
  // TODO: 跳转到任务详情页面
  ElMessage.info('功能开发中...');
};

// 删除任务
const deleteTask = async (taskId) => {
  try {
    await ElMessageBox.confirm('确定要删除该任务吗？删除后无法恢复！', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    // TODO: 调用API删除任务
    ElMessage.success('删除成功');
    loadTasks();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除任务失败:', error);
      ElMessage.error('删除任务失败');
    }
  }
};

// 返回首页
const goBack = () => {
  router.push({ name: 'TeacherDashboard' });
};

// 页面加载
onMounted(() => {
  loadClassInfo();
  loadMembers();
  loadAnnouncements();
  loadTasks();
});
</script>

<style scoped lang="scss">
@import '@/styles/teacher.css';

.class-detail-page {
  // 班级信息卡片
  .class-info-card {
    .info-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;

      .info-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .label {
          font-size: 14px;
          color: var(--teacher-text-secondary);
          font-weight: 500;
        }

        .value {
          font-size: 15px;
          color: var(--teacher-text-primary);
          font-weight: 600;

          &.code {
            color: var(--teacher-primary);
            font-size: 18px;
            font-family: 'Courier New', monospace;
          }
        }
      }
    }
  }

  // Tab头部
  .tab-header {
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .task-buttons {
      display: flex;
      gap: 12px;
    }
  }

  // 发布区域
  .publish-section {
    background: var(--teacher-bg);
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 24px;

    h4 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--teacher-text-primary);
    }
  }

  // 历史区域
  .history-section {
    h4 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--teacher-text-primary);
    }

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
            font-size: 16px;
            font-weight: 600;
            color: var(--teacher-text-primary);
          }

          .actions {
            display: flex;
            gap: 8px;
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
  }

  // 文本颜色
  .text-success {
    color: var(--teacher-success);
    font-weight: 600;
  }
}

// 响应式
@media (max-width: 768px) {
  .class-info-card .info-row {
    grid-template-columns: 1fr !important;
  }

  .tab-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start !important;

    .task-buttons {
      width: 100%;
      flex-direction: column;
    }
  }
}
</style>
