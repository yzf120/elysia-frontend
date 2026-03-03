<template>
  <div class="class-detail-page">
    <van-nav-bar
      :title="classInfo.className || '班级详情'"
      left-arrow
      @click-left="$router.back()"
    />

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

    <!-- 公告 -->
    <div v-if="classInfo.announcement" class="announcement-card card">
      <div class="announcement-title">📢 班级公告</div>
      <div class="announcement-content">{{ classInfo.announcement }}</div>
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
                :key="member.studentId"
                :title="`${index + 1}. ${member.studentId}`"
                :label="`加入时间：${member.joinTime}`"
              >
                <template #right-icon>
                  <van-button
                    size="mini"
                    type="danger"
                    plain
                    @click.stop="removeStudent(member.studentId)"
                  >移除</van-button>
                </template>
              </van-cell>
            </van-list>
          </van-pull-refresh>
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
              v-model="editForm.announcement"
              label="班级公告"
              type="textarea"
              rows="3"
              autosize
              placeholder="请输入班级公告"
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { showToast, showConfirmDialog } from 'vant';

const route = useRoute();

const activeTab = ref('members');
const classInfo = ref({
  classId: '',
  className: '',
  semester: '',
  currentStudents: 0,
  maxStudents: 0,
  classCode: '',
  description: '',
  announcement: '',
  status: 1
});

const memberList = ref([]);
const memberLoading = ref(false);
const memberFinished = ref(false);
const refreshing = ref(false);
const memberPage = ref(1);

const editForm = ref({ className: '', announcement: '', description: '' });
const saving = ref(false);

const getStatusLabel = (status) => {
  const map = { 1: '进行中', 2: '已结束', 3: '已归档' };
  return map[status] || '未知';
};

const getStatusType = (status) => {
  const map = { 1: 'success', 2: 'default', 3: 'warning' };
  return map[status] || 'default';
};

// 加载班级成员
const loadMoreMembers = async () => {
  try {
    const token = localStorage.getItem('token') || '';
    const res = await fetch('/api/class/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ class_id: route.params.classId, page: memberPage.value, page_size: 20 })
    });
    const data = await res.json();
    if (data.code === 0) {
      const list = data.members || [];
      memberList.value.push(...list);
      memberPage.value++;
      if (list.length < 20) memberFinished.value = true;
    } else {
      memberFinished.value = true;
    }
  } catch (error) {
    memberFinished.value = true;
  } finally {
    memberLoading.value = false;
    refreshing.value = false;
  }
};

// 下拉刷新
const onRefreshMembers = () => {
  memberList.value = [];
  memberPage.value = 1;
  memberFinished.value = false;
  loadMoreMembers();
};

// 移除学生
const removeStudent = async (studentId) => {
  try {
    await showConfirmDialog({ title: '确认移除', message: `确定要移除该学生吗？` });
    const teacherId = localStorage.getItem('userId') || '';
    const token = localStorage.getItem('token') || '';
    const res = await fetch('/api/teacher/class/remove-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ teacher_id: teacherId, class_id: route.params.classId, student_id: studentId })
    });
    const data = await res.json();
    if (data.code === 0) {
      showToast({ type: 'success', message: '移除成功' });
      onRefreshMembers();
    } else {
      showToast({ type: 'fail', message: data.message || '移除失败' });
    }
  } catch (error) {
    if (error !== 'cancel') showToast({ type: 'fail', message: '操作失败' });
  }
};

// 保存设置
const saveSettings = async () => {
  saving.value = true;
  try {
    const teacherId = localStorage.getItem('userId') || '';
    const token = localStorage.getItem('token') || '';
    const res = await fetch('/api/teacher/class/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        teacher_id: teacherId,
        class_id: route.params.classId,
        class_name: editForm.value.className,
        announcement: editForm.value.announcement,
        description: editForm.value.description
      })
    });
    const data = await res.json();
    if (data.code === 0) {
      showToast({ type: 'success', message: '保存成功' });
    } else {
      showToast({ type: 'fail', message: data.message || '保存失败' });
    }
  } catch (error) {
    showToast({ type: 'fail', message: '保存失败' });
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  classInfo.value.classId = route.params.classId;
});
</script>

<style scoped>
.class-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.info-card, .announcement-card {
  margin: 12px 16px;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
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

.announcement-title {
  font-size: 15px;
  font-weight: 600;
  color: #e6a23c;
  margin-bottom: 8px;
}

.announcement-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.7;
}

.tab-content {
  padding: 12px 0;
}

.settings-btn {
  padding: 16px;
}
</style>
