<template>
  <div class="student-page student-class-detail-page">
    <!-- 顶部导航栏 -->
    <div class="student-top-nav">
      <div class="nav-left">
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>学生端</el-breadcrumb-item>
          <el-breadcrumb-item @click="goBack" style="cursor:pointer">我的班级</el-breadcrumb-item>
          <el-breadcrumb-item>{{ classInfo.className }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </div>

    <!-- 班级信息卡片 -->
    <div class="student-card class-info-card">
      <div class="info-row">
        <div class="info-item">
          <span class="label">班级名称：</span>
          <span class="value">{{ classInfo.className }}</span>
        </div>
        <div class="info-item">
          <span class="label">学期：</span>
          <span class="value">{{ classInfo.semester }}</span>
        </div>
        <div class="info-item">
          <span class="label">班级人数：</span>
          <span class="value">{{ classInfo.currentStudents }} / {{ classInfo.maxStudents }} 人</span>
        </div>
        <div class="info-item">
          <span class="label">班级验证码：</span>
          <span class="value code">{{ classInfo.classCode }}</span>
        </div>
      </div>
    </div>

    <!-- 公告区域 -->
    <div v-if="classInfo.announcement" class="student-card announcement-card">
      <div class="announcement-title">
        <el-icon><Bell /></el-icon>
        班级公告
      </div>
      <div class="announcement-content">{{ classInfo.announcement }}</div>
    </div>

    <!-- Tab内容 -->
    <div class="student-card">
      <el-tabs v-model="activeTab">
        <!-- 班级成员 -->
        <el-tab-pane label="班级成员" name="members">
          <el-table :data="memberList" stripe>
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="studentId" label="学号" width="150" />
            <el-table-column prop="joinTime" label="加入时间" width="180" />
          </el-table>
          <div class="pagination-wrap">
            <el-pagination
              v-model:current-page="memberPage"
              :page-size="20"
              layout="prev, pager, next"
              :total="memberTotal"
              @current-change="loadMembers"
            />
          </div>
        </el-tab-pane>

        <!-- 班级任务 -->
        <el-tab-pane label="班级任务" name="tasks">
          <div v-if="taskList.length === 0" class="student-empty">
            <el-empty description="暂无任务" />
          </div>
          <el-table v-else :data="taskList" stripe>
            <el-table-column prop="title" label="任务名称" min-width="200" />
            <el-table-column label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getTaskTypeColor(row.type)" size="small">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="deadline" label="截止日期" width="180" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.completed ? 'success' : 'warning'" size="small">
                  {{ row.completed ? '已完成' : '未完成' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';

const router = useRouter();
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
const memberPage = ref(1);
const memberTotal = ref(0);
const taskList = ref([]);

// 获取任务类型颜色
const getTaskTypeColor = (type) => {
  const map = { '讨论': 'primary', '作业': 'success', '考试': 'warning' };
  return map[type] || 'info';
};

// 加载班级信息
const loadClassInfo = async () => {
  try {
    const classId = route.params.classId;
    const token = localStorage.getItem('token') || '';
    // 通过班级ID查询（这里用 teacher-classes 接口或单独接口）
    // 暂时用本地缓存或跳转时传参
    classInfo.value.classId = classId;
  } catch (error) {
    console.error('加载班级信息失败:', error);
    ElMessage.error('加载班级信息失败');
  }
};

// 加载班级成员
const loadMembers = async () => {
  try {
    const token = localStorage.getItem('token') || '';
    const res = await fetch('/api/class/members', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        class_id: route.params.classId,
        page: memberPage.value,
        page_size: 20
      })
    });
    const data = await res.json();
    if (data.code === 0) {
      memberList.value = data.members || [];
      memberTotal.value = data.total || 0;
    } else {
      ElMessage.error(data.message || '加载成员失败');
    }
  } catch (error) {
    console.error('加载班级成员失败:', error);
    ElMessage.error('加载班级成员失败');
  }
};

// 返回班级列表
const goBack = () => {
  router.push({ name: 'StudentClassList' });
};

onMounted(() => {
  loadClassInfo();
  loadMembers();
});
</script>

<style scoped lang="scss">
.student-class-detail-page {
  padding: 20px;

  .student-top-nav {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;

    .nav-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }

  .student-card {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    margin-bottom: 20px;
  }

  .class-info-card {
    .info-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;

      .info-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .label {
          font-size: 14px;
          color: #909399;
        }

        .value {
          font-size: 15px;
          font-weight: 600;

          &.code {
            color: #409eff;
            font-family: 'Courier New', monospace;
            font-size: 16px;
          }
        }
      }
    }
  }

  .announcement-card {
    .announcement-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #e6a23c;
    }

    .announcement-content {
      font-size: 14px;
      color: #606266;
      line-height: 1.7;
    }
  }

  .student-empty {
    padding: 40px 0;
    text-align: center;
  }

  .pagination-wrap {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
}
</style>
