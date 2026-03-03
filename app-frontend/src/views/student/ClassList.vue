<template>
  <div class="class-list-page">
    <van-nav-bar
      title="我的班级"
      left-arrow
      @click-left="$router.back()"
      right-text="加入班级"
      @click-right="showJoinDialog = true"
    />

    <div class="page-container">
      <!-- 加载中 -->
      <div v-if="loading" class="loading-wrap">
        <van-loading type="spinner" color="#667eea" />
      </div>

      <!-- 空状态 -->
      <van-empty
        v-else-if="classList.length === 0"
        description="还没有加入任何班级"
        image="friends-o"
      >
        <van-button round type="primary" size="small" @click="showJoinDialog = true">
          加入班级
        </van-button>
      </van-empty>

      <!-- 班级列表 -->
      <div v-else class="class-list">
        <div
          v-for="cls in classList"
          :key="cls.classId"
          class="class-card card"
          @click="goClassDetail(cls.classId)"
        >
          <div class="class-card-header">
            <span class="class-name">{{ cls.className }}</span>
            <van-tag type="success" size="medium">进行中</van-tag>
          </div>
          <div class="class-card-body">
            <div class="meta-row">
              <span class="meta-item">📅 {{ cls.semester }}</span>
              <span class="meta-item">👥 {{ cls.currentStudents }} 人</span>
            </div>
            <div class="join-time">加入时间：{{ cls.joinTime }}</div>
          </div>
          <div class="class-card-footer">
            <van-button
              size="mini"
              type="danger"
              plain
              @click.stop="leaveClass(cls.classId)"
            >退出班级</van-button>
            <van-icon name="arrow" color="#999" />
          </div>
        </div>
      </div>
    </div>

    <!-- 加入班级弹窗 -->
    <van-dialog
      v-model:show="showJoinDialog"
      title="加入班级"
      show-cancel-button
      :before-close="handleJoinClass"
    >
      <div class="dialog-form">
        <van-field
          v-model="classCode"
          label="班级验证码"
          placeholder="请输入6位验证码"
          maxlength="6"
          clearable
        />
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showConfirmDialog } from 'vant';

const router = useRouter();

const loading = ref(false);
const classList = ref([]);
const showJoinDialog = ref(false);
const classCode = ref('');

// 加载班级列表
const loadClasses = async () => {
  loading.value = true;
  try {
    const studentId = localStorage.getItem('userId') || '';
    const token = localStorage.getItem('token') || '';
    const res = await fetch('/api/class/student-classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ student_id: studentId, page: 1, page_size: 50 })
    });
    const data = await res.json();
    if (data.code === 0) {
      classList.value = data.classes || [];
    } else {
      showToast({ type: 'fail', message: data.message || '加载失败' });
    }
  } catch (error) {
    showToast({ type: 'fail', message: '加载班级列表失败' });
  } finally {
    loading.value = false;
  }
};

// 加入班级
const handleJoinClass = async (action) => {
  if (action === 'cancel') return true;
  if (!classCode.value.trim()) {
    showToast({ type: 'fail', message: '请输入班级验证码' });
    return false;
  }
  try {
    const studentId = localStorage.getItem('userId') || '';
    const token = localStorage.getItem('token') || '';
    const res = await fetch('/api/student/class/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ student_id: studentId, class_code: classCode.value })
    });
    const data = await res.json();
    if (data.code === 0) {
      showToast({ type: 'success', message: '加入班级成功' });
      classCode.value = '';
      loadClasses();
      return true;
    } else {
      showToast({ type: 'fail', message: data.message || '加入失败' });
      return false;
    }
  } catch (error) {
    showToast({ type: 'fail', message: '加入班级失败' });
    return false;
  }
};

// 退出班级
const leaveClass = async (classId) => {
  try {
    await showConfirmDialog({ title: '确认退出', message: '确定要退出该班级吗？' });
    const studentId = localStorage.getItem('userId') || '';
    const token = localStorage.getItem('token') || '';
    const res = await fetch('/api/student/class/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ student_id: studentId, class_id: classId })
    });
    const data = await res.json();
    if (data.code === 0) {
      showToast({ type: 'success', message: '已退出班级' });
      loadClasses();
    } else {
      showToast({ type: 'fail', message: data.message || '退出失败' });
    }
  } catch (error) {
    if (error !== 'cancel') showToast({ type: 'fail', message: '操作失败' });
  }
};

// 跳转班级详情
const goClassDetail = (classId) => {
  router.push({ name: 'student-class-detail', params: { classId } });
};

onMounted(() => {
  loadClasses();
});
</script>

<style scoped>
.class-list-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.page-container {
  padding: 12px 16px;
}

.loading-wrap {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

.class-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.class-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.class-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.class-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  flex: 1;
  margin-right: 8px;
}

.class-card-body {
  margin-bottom: 10px;
}

.meta-row {
  display: flex;
  gap: 16px;
  margin-bottom: 6px;
}

.meta-item {
  font-size: 13px;
  color: #666;
}

.join-time {
  font-size: 13px;
  color: #999;
}

.class-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.dialog-form {
  padding: 8px 0;
}
</style>
