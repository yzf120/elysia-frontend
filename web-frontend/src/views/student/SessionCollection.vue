<template>
  <div class="session-collection-page">
    <div class="top-bar">
      <el-button type="primary" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回首页
      </el-button>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>学生端</el-breadcrumb-item>
        <el-breadcrumb-item>我的收藏</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <el-card class="collection-card">
      <template #header>
        <div class="card-header">
          <span>收藏的会话</span>
          <el-button type="primary" size="small" @click="showCategoryDialog">
            <el-icon><Edit /></el-icon>
            编辑分类
          </el-button>
        </div>
      </template>

      <div class="category-tabs">
        <el-tag
          v-for="cat in categories"
          :key="cat.id"
          :type="selectedCategory === cat.id ? 'primary' : 'info'"
          class="category-tag"
          @click="selectedCategory = cat.id"
        >
          {{ cat.name }} ({{ cat.count }})
        </el-tag>
      </div>

      <div v-if="filteredSessions.length === 0" class="empty-state">
        <el-empty description="暂无收藏的会话" />
      </div>
      <div v-else class="session-list">
        <el-card v-for="session in filteredSessions" :key="session.id" class="session-item" shadow="hover">
          <div class="session-header">
            <h3>{{ session.title }}</h3>
            <el-tag size="small">{{ session.category }}</el-tag>
          </div>
          <div class="session-preview">{{ session.preview }}</div>
          <div class="session-meta">
            <span>{{ formatDate(session.collectTime) }}</span>
          </div>
          <div class="session-actions">
            <el-button type="primary" size="small" @click="viewSession(session)">查看</el-button>
            <el-button type="danger" size="small" @click="uncollect(session.id)">取消收藏</el-button>
          </div>
        </el-card>
      </div>
    </el-card>

    <el-dialog v-model="categoryDialogVisible" title="编辑分类" width="500px">
      <el-form>
        <el-form-item label="分类名称">
          <el-input v-model="newCategoryName" placeholder="输入新分类名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addCategory">添加分类</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

const router = useRouter();

const categories = ref([
  { id: 'all', name: '全部', count: 5 },
  { id: 'study', name: '学习', count: 3 },
  { id: 'homework', name: '作业', count: 2 }
]);

const selectedCategory = ref('all');
const sessions = ref([
  { id: 1, title: '快速排序算法讨论', category: '学习', preview: '讨论了快速排序的实现原理...', collectTime: new Date().toISOString() },
  { id: 2, title: '数据结构作业辅导', category: '作业', preview: '关于链表操作的问题...', collectTime: new Date().toISOString() }
]);

const categoryDialogVisible = ref(false);
const newCategoryName = ref('');

const filteredSessions = computed(() => {
  if (selectedCategory.value === 'all') return sessions.value;
  return sessions.value.filter(s => s.category === categories.value.find(c => c.id === selectedCategory.value)?.name);
});

const formatDate = (date) => {
  return new Date(date).toLocaleString('zh-CN');
};

const viewSession = (session) => {
  router.push({ name: 'AIChat', query: { sessionId: session.id } });
};

const uncollect = (id) => {
  sessions.value = sessions.value.filter(s => s.id !== id);
  ElMessage.success('已取消收藏');
};

const showCategoryDialog = () => {
  categoryDialogVisible.value = true;
};

const addCategory = () => {
  if (!newCategoryName.value) {
    ElMessage.warning('请输入分类名称');
    return;
  }
  categories.value.push({ id: Date.now().toString(), name: newCategoryName.value, count: 0 });
  newCategoryName.value = '';
  categoryDialogVisible.value = false;
  ElMessage.success('添加成功');
};

const goBack = () => {
  router.push({ name: 'StudentDashboard' });
};
</script>

<style scoped lang="scss">
.session-collection-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;

  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    background: white;
    padding: 15px 25px;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }

  .collection-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .category-tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;

      .category-tag {
        cursor: pointer;
        padding: 8px 16px;
      }
    }

    .session-list {
      display: grid;
      gap: 15px;

      .session-item {
        .session-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;

          h3 {
            margin: 0;
            font-size: 16px;
          }
        }

        .session-preview {
          color: #606266;
          margin-bottom: 10px;
        }

        .session-meta {
          font-size: 12px;
          color: #909399;
          margin-bottom: 10px;
        }

        .session-actions {
          display: flex;
          gap: 10px;
        }
      }
    }
  }
}
</style>
