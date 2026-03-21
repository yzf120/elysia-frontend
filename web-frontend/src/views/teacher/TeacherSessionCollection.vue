<template>
  <div class="session-collection-page">
    <div class="top-bar">
      <el-button type="primary" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回首页
      </el-button>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>教师端</el-breadcrumb-item>
        <el-breadcrumb-item>我的收藏</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <el-card class="collection-card">
      <template #header>
        <div class="card-header">
          <span>收藏的会话</span>
          <el-tag type="info">共 {{ total }} 条</el-tag>
        </div>
      </template>

      <!-- 来源筛选 -->
      <div class="source-tabs">
        <el-tag
          :type="selectedSource === '' ? 'primary' : 'info'"
          class="source-tag"
          @click="selectedSource = ''; loadFavorites()"
        >全部</el-tag>
        <el-tag
          :type="selectedSource === 'teacher_ai_chat' ? 'primary' : 'info'"
          class="source-tag"
          @click="selectedSource = 'teacher_ai_chat'; loadFavorites()"
        >AI对话</el-tag>
      </div>

      <div v-if="isLoading" class="loading-state">
        <el-skeleton :rows="3" animated />
      </div>
      <div v-else-if="favorites.length === 0" class="empty-state">
        <el-empty description="暂无收藏的会话" />
      </div>
      <div v-else class="session-list">
        <el-card v-for="item in filteredFavorites" :key="item.id" class="session-item" shadow="hover">
          <div class="session-header">
            <h3>{{ item.session_title || '未命名会话' }}</h3>
            <div class="session-tags">
              <el-tag size="small" :type="getSourceTagType(item.source)">{{ getSourceName(item.source) }}</el-tag>
            </div>
          </div>
          <div class="session-meta">
            <el-icon><Clock /></el-icon>
            <span>收藏于 {{ formatDate(item.create_time) }}</span>
          </div>
          <div class="session-actions">
            <el-button type="primary" size="small" @click="viewSession(item)">
              <el-icon><ChatDotRound /></el-icon>
              查看会话
            </el-button>
            <el-button type="danger" size="small" @click="uncollect(item.session_id)">
              <el-icon><Delete /></el-icon>
              取消收藏
            </el-button>
          </div>
        </el-card>
      </div>

      <!-- 分页 -->
      <div v-if="total > pageSize" class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="loadFavorites"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Clock, Delete } from '@element-plus/icons-vue';
import { teacherAPI } from '@/services/index.js';

const router = useRouter();

const favorites = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const isLoading = ref(false);
const selectedSource = ref('');

const getSourceName = (source) => {
  const map = { ai_chat: '主页AI对话', teacher_ai_chat: 'AI对话', problem_chat: '编程答疑' };
  return map[source] || source;
};

const getSourceTagType = (source) => {
  const map = { ai_chat: 'primary', teacher_ai_chat: 'success', problem_chat: 'warning' };
  return map[source] || 'info';
};

const filteredFavorites = computed(() => {
  if (!selectedSource.value) return favorites.value;
  return favorites.value.filter(f => f.source === selectedSource.value);
});

const loadFavorites = async () => {
  isLoading.value = true;
  try {
    const res = await teacherAPI.listFavorites(currentPage.value, pageSize.value);
    const data = res?.data;
    favorites.value = data?.favorites || [];
    total.value = data?.total || 0;
  } catch (e) {
    console.error('加载收藏列表失败:', e);
    ElMessage.error('加载收藏列表失败');
  } finally {
    isLoading.value = false;
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('zh-CN');
};

const viewSession = (item) => {
  router.push({ name: 'TeacherAIChat', query: { sessionId: item.session_id } });
};

const uncollect = async (sessionId) => {
  try {
    await teacherAPI.unfavoriteSession(sessionId);
    favorites.value = favorites.value.filter(f => f.session_id !== sessionId);
    total.value = Math.max(0, total.value - 1);
    ElMessage.success('已取消收藏');
  } catch (e) {
    console.error('取消收藏失败:', e);
    ElMessage.error('取消收藏失败');
  }
};

const goBack = () => {
  router.push({ name: 'TeacherDashboard' });
};

onMounted(() => {
  loadFavorites();
});
</script>

<style scoped lang="scss">
.session-collection-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f4ff 0%, #fafbff 100%);
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

    :deep(.el-button--primary) {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      border: none;
    }
  }

  .collection-card {
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 18px;
      font-weight: 600;
    }

    .source-tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;

      .source-tag {
        cursor: pointer;
        padding: 8px 16px;
        transition: all 0.3s;

        &:hover {
          transform: translateY(-2px);
        }
      }
    }

    .loading-state {
      padding: 20px;
    }

    .session-list {
      display: grid;
      gap: 15px;

      .session-item {
        border-radius: 10px;
        transition: all 0.3s;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        }

        .session-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;

          h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: #303133;
            flex: 1;
          }
        }

        .session-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #909399;
          margin-bottom: 12px;
        }

        .session-actions {
          display: flex;
          gap: 10px;
        }
      }
    }

    .pagination {
      display: flex;
      justify-content: center;
      margin-top: 20px;
    }
  }
}
</style>