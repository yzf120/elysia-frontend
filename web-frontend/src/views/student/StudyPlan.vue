<template>
  <div class="study-plan-page">
    <div class="top-bar">
      <el-button type="primary" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        {{ fromCourse ? '返回课程学习' : '返回首页' }}
      </el-button>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>学生端</el-breadcrumb-item>
        <el-breadcrumb-item>AI学习方案</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <el-card class="plan-card" v-loading="generating">
      <template #header>
        <div class="card-header">
          <span>AI生成的学习方案</span>
          <el-button type="primary" size="small" @click="downloadPlan" :disabled="!planContent">
            <el-icon><Download /></el-icon>
            下载方案
          </el-button>
        </div>
      </template>

      <div v-if="!planContent" class="empty-state">
        <el-empty description="正在生成学习方案，请稍候...">
          <el-icon :size="80" color="#409eff"><Loading /></el-icon>
        </el-empty>
      </div>
      <div v-else class="plan-content">
        <div class="plan-header">
          <h2>{{ planTitle }}</h2>
          <el-tag type="success">{{ planType }}</el-tag>
        </div>

        <div class="plan-section">
          <h3><el-icon><Calendar /></el-icon> 学习目标</h3>
          <ul>
            <li v-for="(goal, index) in planContent.goals" :key="index">{{ goal }}</li>
          </ul>
        </div>

        <div class="plan-section">
          <h3><el-icon><Clock /></el-icon> 时间安排</h3>
          <el-timeline>
            <el-timeline-item
              v-for="(item, index) in planContent.schedule"
              :key="index"
              :timestamp="item.time"
              placement="top"
            >
              <el-card>
                <h4>{{ item.title }}</h4>
                <p>{{ item.content }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>

        <div class="plan-section">
          <h3><el-icon><Reading /></el-icon> 学习资源</h3>
          <div class="resources">
            <el-tag v-for="(resource, index) in planContent.resources" :key="index" class="resource-tag">
              {{ resource }}
            </el-tag>
          </div>
        </div>

        <div class="plan-section">
          <h3><el-icon><Promotion /></el-icon> 学习建议</h3>
          <el-alert
            v-for="(tip, index) in planContent.tips"
            :key="index"
            :title="tip"
            type="info"
            :closable="false"
            class="tip-alert"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';

const router = useRouter();
const route = useRoute();

const generating = ref(true);
const planContent = ref(null);
const planTitle = ref('');
const planType = ref('学习方案');
const fromCourse = ref(false);

onMounted(async () => {
  fromCourse.value = !!route.query.chapterId;
  planTitle.value = route.query.chapterName || '综合学习方案';
  
  // 模拟生成方案
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  planContent.value = {
    goals: [
      '掌握快速排序算法的基本原理和实现方法',
      '理解快速排序的时间复杂度分析',
      '能够独立编写快速排序代码并进行优化'
    ],
    schedule: [
      { time: '第1天', title: '理论学习', content: '学习快速排序的基本概念、原理和步骤' },
      { time: '第2天', title: '代码实现', content: '编写基础版本的快速排序代码' },
      { time: '第3天', title: '优化改进', content: '学习三数取中、随机化等优化技巧' },
      { time: '第4天', title: '练习巩固', content: '完成相关练习题，加深理解' },
      { time: '第5天', title: '总结复习', content: '整理笔记，总结重点难点' }
    ],
    resources: [
      '教材第3章：排序算法',
      '视频教程：快速排序详解',
      '在线练习：LeetCode 912题',
      '参考资料：算法导论相关章节'
    ],
    tips: [
      '建议每天学习时间不少于2小时，保持连续性',
      '理论学习后要及时动手实践，加深理解',
      '遇到问题可以向AI助教提问，获取即时帮助',
      '完成学习后建议做一次完整的总结和回顾'
    ]
  };
  
  generating.value = false;
});

const downloadPlan = () => {
  let content = `# ${planTitle.value}\n\n`;
  content += `## 学习目标\n\n`;
  planContent.value.goals.forEach(goal => {
    content += `- ${goal}\n`;
  });
  content += `\n## 时间安排\n\n`;
  planContent.value.schedule.forEach(item => {
    content += `### ${item.time} - ${item.title}\n${item.content}\n\n`;
  });
  content += `\n## 学习资源\n\n`;
  planContent.value.resources.forEach(resource => {
    content += `- ${resource}\n`;
  });
  content += `\n## 学习建议\n\n`;
  planContent.value.tips.forEach(tip => {
    content += `- ${tip}\n`;
  });

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${planTitle.value}.md`;
  link.click();
  URL.revokeObjectURL(url);
  
  ElMessage.success('下载成功');
};

const goBack = () => {
  if (fromCourse.value) {
    router.push({ name: 'CourseStudy' });
  } else {
    router.push({ name: 'StudentDashboard' });
  }
};
</script>

<style scoped lang="scss">
.study-plan-page {
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

  .plan-card {
    max-width: 1000px;
    margin: 0 auto;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .empty-state {
      padding: 80px 20px;
      text-align: center;
    }

    .plan-content {
      .plan-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #e4e7ed;

        h2 {
          margin: 0;
          color: #303133;
        }
      }

      .plan-section {
        margin-bottom: 30px;

        h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #409eff;
          margin-bottom: 15px;
        }

        ul {
          padding-left: 25px;

          li {
            margin-bottom: 10px;
            line-height: 1.6;
            color: #606266;
          }
        }

        .resources {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;

          .resource-tag {
            padding: 8px 16px;
            font-size: 14px;
          }
        }

        .tip-alert {
          margin-bottom: 10px;
        }
      }
    }
  }
}
</style>
