<template>
  <div class="student-class-detail-page">
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
          <van-tag type="success">进行中</van-tag>
        </div>
      </div>
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
              />
            </van-list>
          </van-pull-refresh>
        </div>
      </van-tab>

      <!-- 班级任务 -->
      <van-tab title="班级任务" name="tasks">
        <div class="tab-content">
          <van-empty v-if="taskList.length === 0" description="暂无任务" />
          <van-cell-group v-else inset>
            <van-cell
              v-for="task in taskList"
              :key="task.id"
              :title="task.title"
              :label="`截止：${task.deadline}`"
            >
              <template #right-icon>
                <van-tag :type="task.completed ? 'success' : 'warning'" size="medium">
                  {{ task.completed ? '已完成' : '未完成' }}
                </van-tag>
              </template>
            </van-cell>
          </van-cell-group>
        </div>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { showToast } from 'vant';

const route = useRoute();

const activeTab = ref('members');
const classInfo = ref({
  classId: '',
  className: '',
  semester: '',
  currentStudents: 0,
  maxStudents: 0,
  classCode: '',
  announcement: ''
});

const memberList = ref([]);
const memberLoading = ref(false);
const memberFinished = ref(false);
const refreshing = ref(false);
const memberPage = ref(1);
const taskList = ref([]);

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

onMounted(() => {
  classInfo.value.classId = route.params.classId;
});
</script>

<style scoped>
.student-class-detail-page {
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
  color: #4F6EF7;
  font-family: 'Courier New', monospace;
  font-size: 16px;
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
</style>
