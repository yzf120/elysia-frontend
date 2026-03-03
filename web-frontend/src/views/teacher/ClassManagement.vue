<template>
  <div class="teacher-page class-management-page">
    <!-- 顶部导航栏 -->
    <div class="teacher-top-nav">
      <div class="nav-left">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>教师端</el-breadcrumb-item>
          <el-breadcrumb-item>班级管理</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="nav-right">
        <el-button type="primary" @click="goCreateClass" class="teacher-btn-primary">
          <el-icon><Plus /></el-icon>
          创建班级
        </el-button>
      </div>
    </div>

    <!-- 班级列表 -->
    <div class="teacher-card">
      <div class="card-header">
        <h3>我的班级</h3>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索班级名称"
          style="width: 260px"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <div v-if="loading" class="teacher-loading">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="filteredClasses.length === 0" class="teacher-empty">
        <el-empty description="暂无班级，快去创建第一个班级吧">
          <el-button type="primary" @click="goCreateClass">创建班级</el-button>
        </el-empty>
      </div>

      <div v-else class="class-grid">
        <el-card
          v-for="cls in filteredClasses"
          :key="cls.classId"
          class="class-card"
          shadow="hover"
          @click="goClassDetail(cls.classId)"
        >
          <div class="class-card-header">
            <h4 class="class-name">{{ cls.className }}</h4>
            <el-tag :type="getStatusType(cls.status)" size="small">
              {{ getStatusLabel(cls.status) }}
            </el-tag>
          </div>
          <div class="class-card-body">
            <div class="class-meta">
              <span><el-icon><Collection /></el-icon>{{ cls.semester }}</span>
              <span><el-icon><User /></el-icon>{{ cls.currentStudents }} / {{ cls.maxStudents }} 人</span>
            </div>
            <div class="class-code">
              验证码：<strong>{{ cls.classCode }}</strong>
            </div>
            <div v-if="cls.description" class="class-desc">{{ cls.description }}</div>
          </div>
          <div class="class-card-footer">
            <span class="create-time">创建于 {{ cls.createTime }}</span>
            <el-button type="primary" size="small" link @click.stop="goClassDetail(cls.classId)">
              进入班级 <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
        </el-card>
      </div>

      <!-- 分页 -->
      <div v-if="total > pageSize" class="teacher-pagination">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          layout="prev, pager, next"
          :total="total"
          @current-change="loadClasses"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { teacherAPI } from '@/services/index';

const router = useRouter();

const loading = ref(false);
const classList = ref([]);
const searchKeyword = ref('');
const page = ref(1);
const pageSize = ref(12);
const total = ref(0);

// 过滤班级列表
const filteredClasses = computed(() => {
  if (!searchKeyword.value) return classList.value;
  return classList.value.filter(c =>
    c.className.includes(searchKeyword.value)
  );
});

// 获取状态标签
const getStatusLabel = (status) => {
  const map = { 1: '进行中', 2: '已结束', 3: '已归档' };
  return map[status] || '未知';
};

// 获取状态颜色
const getStatusType = (status) => {
  const map = { 1: 'success', 2: 'info', 3: 'warning' };
  return map[status] || 'info';
};

// 加载班级列表
const loadClasses = async () => {
  loading.value = true;
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || localStorage.getItem('userId') || '';
    if (!teacherId) {
      ElMessage.warning('未获取到教师信息，请重新登录');
      return;
    }
    const res = await teacherAPI.getTeacherClasses(teacherId, page.value, pageSize.value);
    const classes = res.classes || [];
    // 按学期时间倒序排列
    classes.sort((a, b) => {
      const sa = a.semester || '';
      const sb = b.semester || '';
      return sb.localeCompare(sa);
    });
    classList.value = classes.map(cls => ({
      classId: cls.class_id,
      className: cls.class_name,
      classCode: cls.class_code,
      semester: cls.semester,
      currentStudents: cls.current_students,
      maxStudents: cls.max_students,
      status: cls.status,
      description: cls.description || '',
      createTime: cls.created_at ? cls.created_at.slice(0, 10) : ''
    }));
    total.value = res.total || classList.value.length;
  } catch (error) {
    console.error('加载班级列表失败:', error);
    ElMessage.error('加载班级列表失败');
  } finally {
    loading.value = false;
  }
};

// 跳转创建班级
const goCreateClass = () => {
  router.push({ name: 'CreateClass' });
};

// 跳转班级详情
const goClassDetail = (classId) => {
  router.push({ name: 'TeacherClassDetail', params: { classId } });
};

onMounted(() => {
  loadClasses();
});
</script>

<style scoped lang="scss">
@import '@/styles/teacher.css';

.class-management-page {
  .teacher-top-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
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
      color: var(--teacher-text-primary);
    }
  }

  .class-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
          color: var(--teacher-text-primary);
          flex: 1;
          margin-right: 8px;
        }
      }

      .class-card-body {
        .class-meta {
          display: flex;
          gap: 16px;
          margin-bottom: 10px;
          font-size: 13px;
          color: var(--teacher-text-secondary);

          span {
            display: flex;
            align-items: center;
            gap: 4px;
          }
        }

        .class-code {
          font-size: 13px;
          color: var(--teacher-text-secondary);
          margin-bottom: 8px;

          strong {
            color: var(--teacher-primary);
            font-family: 'Courier New', monospace;
            font-size: 15px;
          }
        }

        .class-desc {
          font-size: 13px;
          color: var(--teacher-text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .class-card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 16px;
        padding-top: 12px;
        border-top: 1px solid var(--teacher-border);

        .create-time {
          font-size: 12px;
          color: var(--teacher-text-secondary);
        }
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
