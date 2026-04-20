<template>
  <div class="teacher-page teacher-dashboard">
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

    <div class="teacher-welcome">
      <h2>{{ greeting }}，{{ teacherName }}老师</h2>
      <p>今天也要认真教学哦！</p>
    </div>

    <div class="teacher-card">
      <el-tabs v-model="activeTab" class="teacher-tabs">
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
                  <el-button type="primary" size="small" @click="goToClassDetail(row.id)">详情</el-button>
                  <el-button type="danger" size="small" @click="deleteClass(row.id)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
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

        <el-tab-pane label="系统公告" name="announcements">
          <div v-if="announcements.length === 0" class="teacher-empty">
            <el-empty description="暂无系统公告">
              <el-icon :size="80"><Bell /></el-icon>
            </el-empty>
          </div>
          <div v-else class="announcement-list">
            <el-card
              v-for="item in announcements"
              :key="item.announcement_id"
              class="announcement-item"
              shadow="hover"
            >
              <div class="announcement-header">
                <h3>{{ item.title }}</h3>
                <el-tag :type="priorityTagType(item.priority)" size="small">{{ priorityLabel(item.priority) }}</el-tag>
              </div>
              <div class="announcement-meta">
                <span>
                  <el-icon><User /></el-icon>
                  {{ item.publisher_name || '管理员' }}
                </span>
                <span>
                  <el-icon><Clock /></el-icon>
                  {{ formatDate(item.publish_time) }}
                </span>
              </div>
              <div class="announcement-content">{{ item.content }}</div>
            </el-card>
          </div>
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

        <el-tab-pane label="平台书架" name="bookshelf">
          <div v-if="bookshelfItems.length === 0" class="teacher-empty">
            <el-empty description="暂无平台书架内容">
              <el-icon :size="80"><Collection /></el-icon>
            </el-empty>
          </div>
          <div v-else class="announcement-list">
            <el-card
              v-for="item in bookshelfItems"
              :key="item.item_id"
              class="announcement-item"
              shadow="hover"
            >
              <div class="announcement-header">
                <h3>{{ item.title }}</h3>
                <el-tag size="small" type="success">{{ item.content_type_label }}</el-tag>
              </div>
              <div class="announcement-meta">
                <span>
                  <el-icon><Clock /></el-icon>
                  {{ formatDate(item.publish_time) }}
                </span>
                <span v-if="item.has_attachment">
                  <el-icon><Document /></el-icon>
                  {{ item.attachment_name }}
                </span>
              </div>
              <div v-if="item.description" class="announcement-content">{{ item.description }}</div>
              <div class="resource-actions">
                <el-button v-if="item.external_url" type="primary" link @click="openExternalLink(item.external_url)">打开链接</el-button>
                <el-button v-if="item.has_attachment" type="primary" link @click="handleViewAttachment(item)">预览附件</el-button>
                <el-button v-if="item.has_attachment" type="primary" link @click="handleDownloadAttachment(item)">下载附件</el-button>
              </div>
            </el-card>
          </div>
          <div v-if="bookshelfItems.length > 0" class="teacher-pagination">
            <el-pagination
              v-model:current-page="bookshelfPage"
              :page-size="10"
              layout="prev, pager, next"
              :total="bookshelfTotal"
              @current-change="loadBookshelfItems"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

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
          <div class="card-icon" style="background: linear-gradient(135deg, #7CB8FF 0%, #3B82F6 100%);">
            <el-icon :size="28"><ChatDotRound /></el-icon>
          </div>
          <div class="card-title">AI对话</div>
          <div class="card-desc">智能助教对话交流</div>
        </div>

        <div class="teacher-access-card" @click="goToCollection">
          <div class="card-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
            <el-icon :size="28"><Star /></el-icon>
          </div>
          <div class="card-title">收藏会话</div>
          <div class="card-desc">查看收藏的AI对话</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { teacherAPI } from '@/services/index';
import { downloadBlob, openBlobInNewTab } from '@/utils/file';

const router = useRouter();
const teacherName = ref('教师');
const activeTab = ref('classes');
const classList = ref([]);
const classPage = ref(1);
const classTotal = ref(0);
const announcements = ref([]);
const announcementPage = ref(1);
const announcementTotal = ref(0);
const bookshelfItems = ref([]);
const bookshelfPage = ref(1);
const bookshelfTotal = ref(0);

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return '凌晨好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
});

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const priorityLabel = (priority) => {
  if (priority === 'high') return '高优先级';
  if (priority === 'low') return '低优先级';
  return '普通';
};

const priorityTagType = (priority) => {
  if (priority === 'high') return 'danger';
  if (priority === 'low') return 'info';
  return 'warning';
};

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

const loadAnnouncements = async () => {
  try {
    const res = await teacherAPI.getSystemAnnouncements({
      page: announcementPage.value,
      page_size: 10
    });
    announcements.value = res.announcements || [];
    announcementTotal.value = res.total || announcements.value.length;
  } catch (error) {
    console.error('加载系统公告失败:', error);
    ElMessage.error('加载系统公告失败');
  }
};

const loadBookshelfItems = async () => {
  try {
    const res = await teacherAPI.getPlatformBookshelf({
      page: bookshelfPage.value,
      page_size: 10
    });
    bookshelfItems.value = res.bookshelf_items || [];
    bookshelfTotal.value = res.total || bookshelfItems.value.length;
  } catch (error) {
    console.error('加载平台书架失败:', error);
    ElMessage.error('加载平台书架失败');
  }
};

const handleViewAttachment = async (item) => {
  try {
    const blob = await teacherAPI.viewPlatformBookshelfAttachment(item.item_id);
    openBlobInNewTab(blob);
  } catch (error) {
    ElMessage.error(`附件预览失败：${error}`);
  }
};

const handleDownloadAttachment = async (item) => {
  try {
    const blob = await teacherAPI.downloadPlatformBookshelfAttachment(item.item_id);
    downloadBlob(blob, item.attachment_name || 'attachment');
  } catch (error) {
    ElMessage.error(`附件下载失败：${error}`);
  }
};

const openExternalLink = (url) => {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
};

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

const goToClassDetail = (classId) => {
router.push({ name: 'TeacherClassDetail', params: { classId: classId } });
};

const goToProfile = () => {
  router.push({ name: 'TeacherProfile' });
};

const goToCreateClass = () => {
router.push({ name: 'TeacherCreateClass' });
};

const goToClassManagement = () => {
  router.push({ name: 'ClassManagement' });
};

const goToAIChat = () => {
  router.push({ name: 'TeacherAIChat' });
};

const goToCollection = () => {
  router.push({ name: 'TeacherSessionCollection' });
};

onMounted(() => {
  const raw = localStorage.getItem('userInfo');
  if (raw && raw !== 'undefined' && raw !== 'null') {
    try {
      const parsed = JSON.parse(raw);
      teacherName.value = parsed.teacher_name || parsed.name || localStorage.getItem('userName') || '教师';
    } catch {
      teacherName.value = localStorage.getItem('userName') || '教师';
    }
  } else {
    teacherName.value = localStorage.getItem('userName') || '教师';
  }
  loadClassList();
  loadAnnouncements();
  loadBookshelfItems();
});
</script>

<style scoped lang="scss">
@import '@/styles/teacher.css';

.teacher-dashboard {
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
        flex-wrap: wrap;
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

      .resource-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 12px;
      }
    }
  }

  .text-danger {
    color: var(--teacher-danger);
    font-weight: 600;
  }
}

@media (max-width: 768px) {
  .pending-section {
    grid-template-columns: 1fr !important;
  }
}
</style>
