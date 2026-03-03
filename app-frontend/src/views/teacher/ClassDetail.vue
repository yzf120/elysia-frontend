<template>
  <div class="class-detail-page">
    <van-nav-bar
      :title="classInfo.className || '班级详情'"
      left-arrow
      @click-left="$router.back()"
    />

    <!-- 加载中 -->
    <div v-if="infoLoading" class="loading-wrap">
      <van-loading type="spinner" color="#667eea" />
    </div>

    <template v-else>
      <!-- 班级信息卡片 -->
      <div class="info-card card">
        <div class="info-grid">
          <div class="info-item">
            <span class="label">学期</span>
            <span class="value">{{ classInfo.semester || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">班级人数</span>
            <span class="value">{{ classInfo.currentStudents }}/{{ classInfo.maxStudents }}</span>
          </div>
          <div class="info-item">
            <span class="label">验证码</span>
            <span class="value code">{{ classInfo.classCode }}</span>
          </div>
          <div class="info-item">
            <span class="label">状态</span>
            <van-tag :type="getStatusType(classInfo.status)">{{ getStatusLabel(classInfo.status) }}</van-tag>
          </div>
        </div>
        <div v-if="classInfo.description" class="desc">{{ classInfo.description }}</div>
      </div>

      <!-- Tab -->
      <van-tabs v-model:active="activeTab" sticky>
        <!-- 班级成员 -->
        <van-tab title="班级成员" name="members">
          <div class="tab-content">
            <van-pull-refresh v-model="refreshing" @refresh="onRefreshMembers">
              <van-list
                v-model:loading="memberLoading"
                :finished="memberFinished"
                finished-text="没有更多了"
                @load="loadMoreMembers"
              >
                <van-cell
                  v-for="(member, index) in memberList"
                  :key="member.student_id"
                  :title="`${index + 1}. ${member.student_name || member.student_id}`"
                  :label="`学号：${member.student_id}  加入时间：${formatDate(member.join_time)}`"
                >
                  <template #right-icon>
                    <van-button
                      size="mini"
                      type="danger"
                      plain
                      @click.stop="removeStudent(member.student_id)"
                    >移除</van-button>
                  </template>
                </van-cell>
              </van-list>
            </van-pull-refresh>
          </div>
        </van-tab>

        <!-- 班级公告 -->
        <van-tab title="班级公告" name="announcements">
          <div class="tab-content">
            <!-- 发布公告 -->
            <div class="publish-section card">
              <div class="section-title">发布新公告</div>
              <van-field
                v-model="announcementForm.title"
                label="标题"
                placeholder="请输入公告标题"
                required
              />
              <van-field
                v-model="announcementForm.content"
                label="内容"
                type="textarea"
                rows="4"
                autosize
                placeholder="请输入公告内容"
                required
              />
              <div class="publish-btn">
                <van-button
                  round
                  block
                  type="primary"
                  :loading="publishingAnnouncement"
                  @click="publishAnnouncement"
                >发布公告</van-button>
              </div>
            </div>

            <!-- 历史公告 -->
            <div class="section-title-outer">历史公告</div>
            <div v-if="announcementList.length === 0" class="empty-tip">暂无公告</div>
            <div
              v-for="item in announcementList"
              :key="item.id"
              class="announcement-item card"
            >
              <div class="ann-header">
                <span class="ann-title">{{ item.title }}</span>
                <van-button size="mini" type="danger" plain @click="deleteAnnouncement(item.id)">删除</van-button>
              </div>
              <div class="ann-time">{{ formatDate(item.publish_time || item.publishTime) }}</div>
              <div class="ann-content">{{ item.content }}</div>
            </div>
          </div>
        </van-tab>

        <!-- 任务管理 -->
        <van-tab title="任务管理" name="tasks">
          <div class="tab-content">
            <!-- 发布按钮 -->
            <div class="task-btns">
              <van-button size="small" type="primary" @click="publishTask('discussion')">发布讨论</van-button>
              <van-button size="small" type="success" @click="publishTask('homework')">发布作业</van-button>
              <van-button size="small" type="warning" @click="publishTask('exam')">发布考试</van-button>
            </div>

            <div v-if="taskList.length === 0" class="empty-tip">暂无任务</div>
            <div
              v-for="task in taskList"
              :key="task.id"
              class="task-item card"
            >
              <div class="task-header">
                <span class="task-title">{{ task.title }}</span>
                <van-tag :type="getTaskTypeColor(task.type)">{{ task.type }}</van-tag>
              </div>
              <div class="task-meta">
                截止：{{ formatDate(task.deadline) }}
                &nbsp;|&nbsp;
                完成：{{ task.completedCount }}/{{ task.totalCount }}
              </div>
            </div>
          </div>
        </van-tab>

        <!-- 班级设置 -->
        <van-tab title="班级设置" name="settings">
          <div class="tab-content">
            <van-cell-group inset>
              <van-field
                v-model="editForm.className"
                label="班级名称"
                placeholder="请输入班级名称"
              />
              <van-field
                v-model="editForm.description"
                label="班级描述"
                type="textarea"
                rows="2"
                autosize
                placeholder="请输入班级描述"
              />
            </van-cell-group>
            <div class="settings-btn">
              <van-button round block type="primary" :loading="saving" @click="saveSettings">
                保存修改
              </van-button>
            </div>
          </div>
        </van-tab>
      </van-tabs>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast, showConfirmDialog } from 'vant';
import { teacherAPI } from '@/api';

const route = useRoute();
const router = useRouter();

const activeTab = ref('members');
const infoLoading = ref(false);

const classInfo = ref({
  classId: '',
  className: '',
  semester: '',
  currentStudents: 0,
  maxStudents: 0,
  classCode: '',
  description: '',
  status: 1
});

// 成员
const memberList = ref([]);
const memberLoading = ref(false);
const memberFinished = ref(false);
const refreshing = ref(false);
const memberPage = ref(1);

// 公告
const announcementForm = ref({ title: '', content: '' });
const publishingAnnouncement = ref(false);
const announcementList = ref([]);

// 任务
const taskList = ref([]);

// 设置
const editForm = ref({ className: '', description: '' });
const saving = ref(false);

// ---- 工具函数 ----
const getStatusLabel = (status) => {
  const map = { 1: '进行中', 2: '已结束', 3: '已归档' };
  return map[status] || '未知';
};

const getStatusType = (status) => {
  const map = { 1: 'success', 2: 'default', 3: 'warning' };
  return map[status] || 'default';
};

const getTaskTypeColor = (type) => {
  const map = { '讨论': 'primary', '作业': 'success', '考试': 'warning' };
  return map[type] || 'default';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ---- 加载班级信息 ----
const loadClassInfo = async () => {
  infoLoading.value = true;
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    const res = await teacherAPI.getTeacherClasses(teacherId);
    const classes = res.classes || [];
    const classId = route.params.classId;
    const found = classes.find(c => String(c.class_id) === String(classId));
    if (found) {
      classInfo.value = {
        classId: found.class_id,
        className: found.class_name,
        semester: found.semester,
        currentStudents: found.current_students,
        maxStudents: found.max_students,
        classCode: found.class_code,
        description: found.description || '',
        status: found.status
      };
      editForm.value.className = found.class_name;
      editForm.value.description = found.description || '';
    }
  } catch (error) {
    showToast({ type: 'fail', message: '加载班级信息失败' });
  } finally {
    infoLoading.value = false;
  }
};

// ---- 班级成员 ----
const loadMoreMembers = async () => {
  try {
    const res = await teacherAPI.getClassMembers(route.params.classId, memberPage.value, 20);
    const list = res.members || [];
    memberList.value.push(...list);
    memberPage.value++;
    if (list.length < 20) memberFinished.value = true;
  } catch (error) {
    memberFinished.value = true;
  } finally {
    memberLoading.value = false;
    refreshing.value = false;
  }
};

const onRefreshMembers = () => {
  memberList.value = [];
  memberPage.value = 1;
  memberFinished.value = false;
  loadMoreMembers();
};

const removeStudent = async (studentId) => {
  try {
    await showConfirmDialog({ title: '确认移除', message: '确定要移除该学生吗？' });
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    await teacherAPI.removeStudent(teacherId, route.params.classId, studentId);
    showToast({ type: 'success', message: '移除成功' });
    onRefreshMembers();
  } catch (error) {
    if (error !== 'cancel') showToast({ type: 'fail', message: '操作失败' });
  }
};

// ---- 公告 ----
const publishAnnouncement = async () => {
  if (!announcementForm.value.title.trim()) {
    showToast({ type: 'fail', message: '请输入公告标题' });
    return;
  }
  if (!announcementForm.value.content.trim()) {
    showToast({ type: 'fail', message: '请输入公告内容' });
    return;
  }
  publishingAnnouncement.value = true;
  try {
    // TODO: 调用发布公告接口
    announcementList.value.unshift({
      id: Date.now(),
      title: announcementForm.value.title,
      content: announcementForm.value.content,
      publishTime: new Date().toISOString()
    });
    announcementForm.value = { title: '', content: '' };
    showToast({ type: 'success', message: '发布成功' });
  } catch (error) {
    showToast({ type: 'fail', message: '发布失败' });
  } finally {
    publishingAnnouncement.value = false;
  }
};

const deleteAnnouncement = async (id) => {
  try {
    await showConfirmDialog({ title: '确认删除', message: '确定要删除该公告吗？' });
    // TODO: 调用删除公告接口
    announcementList.value = announcementList.value.filter(a => a.id !== id);
    showToast({ type: 'success', message: '删除成功' });
  } catch (error) {
    // cancel
  }
};

// ---- 任务 ----
const publishTask = (type) => {
  const typeMap = { discussion: '讨论', homework: '作业', exam: '考试' };
  router.push({
    name: 'teacher-publish-task',
    query: { classId: classInfo.value.classId, type: typeMap[type] }
  });
};

// ---- 设置 ----
const saveSettings = async () => {
  saving.value = true;
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    await teacherAPI.updateClass(teacherId, route.params.classId, {
      class_name: editForm.value.className,
      description: editForm.value.description
    });
    classInfo.value.className = editForm.value.className;
    classInfo.value.description = editForm.value.description;
    showToast({ type: 'success', message: '保存成功' });
  } catch (error) {
    showToast({ type: 'fail', message: '保存失败' });
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadClassInfo();
});
</script>

<style scoped>
.class-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.loading-wrap {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

.card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.info-card {
  margin: 12px 16px;
  padding: 16px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 10px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 12px;
  color: #999;
}

.value {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.value.code {
  color: #667eea;
  font-family: 'Courier New', monospace;
  font-size: 16px;
}

.desc {
  font-size: 13px;
  color: #666;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.tab-content {
  padding: 12px 16px;
}

/* 公告 */
.publish-section {
  padding: 16px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.section-title-outer {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.publish-btn {
  padding: 12px 0 0;
}

.announcement-item {
  padding: 14px;
  margin-bottom: 12px;
}

.ann-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.ann-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  flex: 1;
  margin-right: 8px;
}

.ann-time {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.ann-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.7;
}

.empty-tip {
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 30px 0;
}

/* 任务 */
.task-btns {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.task-item {
  padding: 14px;
  margin-bottom: 12px;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.task-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  flex: 1;
  margin-right: 8px;
}

.task-meta {
  font-size: 13px;
  color: #666;
}

/* 设置 */
.settings-btn {
  padding: 16px;
}
</style>
