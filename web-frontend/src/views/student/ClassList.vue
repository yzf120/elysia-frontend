<template>
  <div class="student-page class-list-page">
    <!-- 顶部导航栏 -->
    <div class="student-top-nav">
      <div class="nav-left">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>学生端</el-breadcrumb-item>
          <el-breadcrumb-item>我的班级</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="nav-right">
        <el-button type="primary" @click="showJoinDialog = true">
          <el-icon><Plus /></el-icon>
          加入班级
        </el-button>
      </div>
    </div>

    <!-- 班级列表 -->
    <div class="student-card">
      <div class="card-header">
        <h3>我的班级</h3>
      </div>

      <div v-if="loading" class="student-loading">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="classList.length === 0" class="student-empty">
        <el-empty description="还没有加入任何班级">
          <el-button type="primary" @click="showJoinDialog = true">加入班级</el-button>
        </el-empty>
      </div>

      <div v-else class="class-grid">
        <el-card
          v-for="cls in classList"
          :key="cls.classId"
          class="class-card"
          shadow="hover"
          @click="goClassDetail(cls.classId)"
        >
          <div class="class-card-header">
            <h4 class="class-name">{{ cls.className }}</h4>
            <el-tag type="success" size="small">进行中</el-tag>
          </div>
          <div class="class-card-body">
            <div class="class-meta">
              <span><el-icon><Collection /></el-icon>{{ cls.semester }}</span>
              <span><el-icon><User /></el-icon>{{ cls.currentStudents }} 人</span>
            </div>
            <div class="join-time">加入时间：{{ cls.joinTime }}</div>
          </div>
          <div class="class-card-footer">
            <el-button type="primary" size="small" link @click.stop="goClassDetail(cls.classId)">
              进入班级 <el-icon><ArrowRight /></el-icon>
            </el-button>
            <el-button type="danger" size="small" link @click.stop="leaveClass(cls.classId)">
              退出班级
            </el-button>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 加入班级弹窗 -->
    <el-dialog v-model="showJoinDialog" title="加入班级" width="400px">
      <el-form :model="joinForm" label-width="80px">
        <el-form-item label="班级验证码">
          <el-input
            v-model="joinForm.classCode"
            placeholder="请输入6位班级验证码"
            maxlength="6"
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showJoinDialog = false">取消</el-button>
        <el-button type="primary" :loading="joining" @click="joinClass">加入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();

const loading = ref(false);
const classList = ref([]);
const showJoinDialog = ref(false);
const joining = ref(false);
const joinForm = ref({ classCode: '' });

// 加载班级列表
const loadClasses = async () => {
  loading.value = true;
  try {
    const studentId = localStorage.getItem('userId') || '';
    const token = localStorage.getItem('token') || '';
    const res = await fetch('/api/class/student-classes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ student_id: studentId, page: 1, page_size: 50 })
    });
    const data = await res.json();
    if (data.code === 0) {
      classList.value = data.classes || [];
    } else {
      ElMessage.error(data.message || '加载班级列表失败');
    }
  } catch (error) {
    console.error('加载班级列表失败:', error);
    ElMessage.error('加载班级列表失败');
  } finally {
    loading.value = false;
  }
};

// 加入班级
const joinClass = async () => {
  if (!joinForm.value.classCode.trim()) {
    ElMessage.warning('请输入班级验证码');
    return;
  }
  joining.value = true;
  try {
    const studentId = localStorage.getItem('userId') || '';
    const token = localStorage.getItem('token') || '';
    const res = await fetch('/api/student/class/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ student_id: studentId, class_code: joinForm.value.classCode })
    });
    const data = await res.json();
    if (data.code === 0) {
      ElMessage.success('加入班级成功');
      showJoinDialog.value = false;
      joinForm.value.classCode = '';
      loadClasses();
    } else {
      ElMessage.error(data.message || '加入班级失败');
    }
  } catch (error) {
    console.error('加入班级失败:', error);
    ElMessage.error('加入班级失败');
  } finally {
    joining.value = false;
  }
};

// 退出班级
const leaveClass = async (classId) => {
  try {
    await ElMessageBox.confirm('确定要退出该班级吗？', '确认退出', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    const studentId = localStorage.getItem('userId') || '';
    const token = localStorage.getItem('token') || '';
    const res = await fetch('/api/student/class/leave', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ student_id: studentId, class_id: classId })
    });
    const data = await res.json();
    if (data.code === 0) {
      ElMessage.success('已退出班级');
      loadClasses();
    } else {
      ElMessage.error(data.message || '退出班级失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('退出班级失败:', error);
      ElMessage.error('退出班级失败');
    }
  }
};

// 跳转班级详情
const goClassDetail = (classId) => {
  router.push({ name: 'StudentClassDetail', params: { classId } });
};

onMounted(() => {
  loadClasses();
});
</script>

<style scoped lang="scss">
.class-list-page {
  padding: 20px;

  .student-top-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .student-card {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
  }

  .student-empty {
    padding: 40px 0;
    text-align: center;
  }

  .class-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;

    .class-card {
      cursor: pointer;
      transition: all 0.3s ease;
      border-radius: 12px;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      }

      .class-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;

        .class-name {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          flex: 1;
          margin-right: 8px;
        }
      }

      .class-card-body {
        .class-meta {
          display: flex;
          gap: 16px;
          margin-bottom: 8px;
          font-size: 13px;
          color: #909399;

          span {
            display: flex;
            align-items: center;
            gap: 4px;
          }
        }

        .join-time {
          font-size: 13px;
          color: #909399;
        }
      }

      .class-card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 16px;
        padding-top: 12px;
        border-top: 1px solid #f0f0f0;
      }
    }
  }
}

@media (max-width: 768px) {
  .class-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>
