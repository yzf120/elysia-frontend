<template>
  <div class="study-plan-page">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      title="学习方案"
      left-arrow
      @click-left="goBack"
      fixed
      placeholder
    >
      <template #right>
        <van-button
          v-if="planGenerated"
          type="primary"
          size="small"
          round
          @click="downloadPlan"
        >
          下载方案
        </van-button>
      </template>
    </van-nav-bar>

    <!-- 生成方案表单 -->
    <div v-if="!planGenerated" class="generate-form">
      <van-form @submit="generatePlan">
        <van-cell-group inset>
          <van-field
            v-model="formData.subject"
            name="subject"
            label="科目"
            placeholder="请选择科目"
            readonly
            is-link
            @click="showSubjectPicker = true"
            :rules="[{ required: true, message: '请选择科目' }]"
          />
          <van-field
            v-model="formData.chapter"
            name="chapter"
            label="章节"
            placeholder="请输入章节（可选）"
          />
          <van-field
            v-model="formData.duration"
            name="duration"
            label="学习周期"
            placeholder="请选择学习周期"
            readonly
            is-link
            @click="showDurationPicker = true"
            :rules="[{ required: true, message: '请选择学习周期' }]"
          />
          <van-field
            v-model="formData.dailyTime"
            name="dailyTime"
            label="每日学习时长"
            placeholder="请选择每日学习时长"
            readonly
            is-link
            @click="showTimePicker = true"
            :rules="[{ required: true, message: '请选择每日学习时长' }]"
          />
          <van-field
            v-model="formData.goal"
            name="goal"
            label="学习目标"
            type="textarea"
            rows="3"
            autosize
            placeholder="请输入您的学习目标（可选）"
          />
        </van-cell-group>

        <div class="form-actions">
          <van-button
            round
            block
            type="primary"
            native-type="submit"
            :loading="generating"
          >
            <van-icon name="fire-o" />
            生成AI学习方案
          </van-button>
        </div>
      </van-form>

      <!-- 选择器 -->
      <van-popup v-model:show="showSubjectPicker" position="bottom">
        <van-picker
          :columns="subjectOptions"
          @confirm="onSubjectConfirm"
          @cancel="showSubjectPicker = false"
        />
      </van-popup>

      <van-popup v-model:show="showDurationPicker" position="bottom">
        <van-picker
          :columns="durationOptions"
          @confirm="onDurationConfirm"
          @cancel="showDurationPicker = false"
        />
      </van-popup>

      <van-popup v-model:show="showTimePicker" position="bottom">
        <van-picker
          :columns="timeOptions"
          @confirm="onTimeConfirm"
          @cancel="showTimePicker = false"
        />
      </van-popup>
    </div>

    <!-- 学习方案展示 -->
    <div v-else class="plan-content">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <!-- 方案概览 -->
        <div class="plan-overview">
          <h2>{{ planData.title }}</h2>
          <div class="overview-meta">
            <van-tag type="primary" size="large">{{ planData.subject }}</van-tag>
            <span>{{ planData.duration }}</span>
            <span>每日{{ planData.dailyTime }}</span>
          </div>
        </div>

        <!-- 学习阶段 -->
        <div class="plan-stages">
          <h3>学习阶段</h3>
          <van-steps direction="vertical" :active="0">
            <van-step
              v-for="(stage, index) in planData.stages"
              :key="index"
            >
              <template #inactive-icon>
                <van-icon name="clock-o" />
              </template>
              <h4>{{ stage.title }}</h4>
              <p class="stage-duration">{{ stage.duration }}</p>
              <div class="stage-content">
                <div v-html="formatContent(stage.content)"></div>
              </div>
            </van-step>
          </van-steps>
        </div>

        <!-- 每日任务 -->
        <div class="daily-tasks">
          <h3>每日任务建议</h3>
          <van-cell-group inset>
            <van-cell
              v-for="(task, index) in planData.dailyTasks"
              :key="index"
              :title="task.title"
              :label="task.description"
            >
              <template #icon>
                <van-icon name="todo-list-o" size="20" color="#409eff" />
              </template>
              <template #right-icon>
                <van-tag type="success">{{ task.time }}</van-tag>
              </template>
            </van-cell>
          </van-cell-group>
        </div>

        <!-- 学习建议 -->
        <div class="study-tips">
          <h3>学习建议</h3>
          <div class="tips-content">
            <div v-html="formatContent(planData.tips)"></div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="plan-actions">
          <van-button
            type="primary"
            size="large"
            round
            block
            @click="downloadPlan"
          >
            <van-icon name="down" />
            下载学习方案
          </van-button>
          <van-button
            type="default"
            size="large"
            round
            block
            @click="regeneratePlan"
          >
            <van-icon name="replay" />
            重新生成
          </van-button>
          <van-button
            type="success"
            size="large"
            round
            block
            @click="backToCourse"
          >
            <van-icon name="arrow-left" />
            返回课程学习
          </van-button>
        </div>
      </van-pull-refresh>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'

const router = useRouter()
const route = useRoute()

// 表单数据
const formData = ref({
  subject: '',
  chapter: '',
  duration: '',
  dailyTime: '',
  goal: ''
})

// 选择器显示状态
const showSubjectPicker = ref(false)
const showDurationPicker = ref(false)
const showTimePicker = ref(false)

// 选择器选项
const subjectOptions = ['数据结构', '算法设计', '操作系统', '计算机网络', '数据库原理']
const durationOptions = ['1周', '2周', '3周', '4周', '1个月', '2个月', '3个月']
const timeOptions = ['30分钟', '1小时', '1.5小时', '2小时', '2.5小时', '3小时']

// 生成状态
const generating = ref(false)
const planGenerated = ref(false)
const refreshing = ref(false)

// 方案数据
const planData = ref({
  title: '',
  subject: '',
  duration: '',
  dailyTime: '',
  stages: [],
  dailyTasks: [],
  tips: ''
})

// 选择器确认
const onSubjectConfirm = ({ selectedValues }) => {
  formData.value.subject = selectedValues[0]
  showSubjectPicker.value = false
}

const onDurationConfirm = ({ selectedValues }) => {
  formData.value.duration = selectedValues[0]
  showDurationPicker.value = false
}

const onTimeConfirm = ({ selectedValues }) => {
  formData.value.dailyTime = selectedValues[0]
  showTimePicker.value = false
}

// 格式化内容
const formatContent = (content) => {
  if (!content) return ''
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}

// 生成学习方案
const generatePlan = async () => {
  generating.value = true

  try {
    // TODO: 调用AI API生成学习方案
    await new Promise(resolve => setTimeout(resolve, 3000))

    planData.value = {
      title: `${formData.value.subject}学习方案`,
      subject: formData.value.subject,
      duration: formData.value.duration,
      dailyTime: formData.value.dailyTime,
      stages: [
        {
          title: '第一阶段：基础知识学习',
          duration: '第1-2周',
          content: `**学习目标**：掌握${formData.value.subject}的基本概念和理论基础。\n\n**学习内容**：\n- 基本概念和术语\n- 核心理论框架\n- 基础算法和数据结构\n\n**学习方法**：\n- 观看教学视频\n- 阅读教材和参考资料\n- 完成课后习题`
        },
        {
          title: '第二阶段：实践应用',
          duration: '第3-4周',
          content: `**学习目标**：通过实践巩固理论知识，提升编程能力。\n\n**学习内容**：\n- 典型问题分析\n- 算法实现练习\n- 项目实战\n\n**学习方法**：\n- 完成编程作业\n- 参与讨论和交流\n- 总结学习心得`
        },
        {
          title: '第三阶段：综合提升',
          duration: '第5-6周',
          content: `**学习目标**：系统复习，查漏补缺，提升综合能力。\n\n**学习内容**：\n- 知识点梳理\n- 难点突破\n- 综合练习\n\n**学习方法**：\n- 制作知识网络图\n- 整理错题本\n- 模拟测试`
        }
      ],
      dailyTasks: [
        {
          title: '观看教学视频',
          description: '学习新知识点，做好笔记',
          time: '30分钟'
        },
        {
          title: '完成练习题',
          description: '巩固当天所学内容',
          time: '30分钟'
        },
        {
          title: '复习回顾',
          description: '回顾之前学习的内容',
          time: '20分钟'
        },
        {
          title: '总结反思',
          description: '记录学习心得和疑问',
          time: '10分钟'
        }
      ],
      tips: `**学习建议**：\n\n1. **制定计划**：每天固定时间学习，养成良好习惯。\n\n2. **循序渐进**：从简单到复杂，逐步深入理解。\n\n3. **多做练习**：理论结合实践，通过编程巩固知识。\n\n4. **及时复习**：定期回顾所学内容，防止遗忘。\n\n5. **主动思考**：不要死记硬背，要理解原理和思想。\n\n6. **寻求帮助**：遇到问题及时向老师或同学请教。`
    }

    planGenerated.value = true
    showToast('方案生成成功')
  } catch (error) {
    console.error('生成方案失败:', error)
    showToast('生成失败')
  } finally {
    generating.value = false
  }
}

// 下拉刷新
const onRefresh = () => {
  refreshing.value = false
  showToast('已是最新内容')
}

// 重新生成
const regeneratePlan = () => {
  planGenerated.value = false
  formData.value = {
    subject: '',
    chapter: '',
    duration: '',
    dailyTime: '',
    goal: ''
  }
}

// 下载方案
const downloadPlan = () => {
  let content = `# ${planData.value.title}\n\n`
  content += `**科目**：${planData.value.subject}\n`
  content += `**学习周期**：${planData.value.duration}\n`
  content += `**每日学习时长**：${planData.value.dailyTime}\n\n`
  
  content += `## 学习阶段\n\n`
  planData.value.stages.forEach((stage, index) => {
    content += `### ${stage.title}\n\n`
    content += `**时间**：${stage.duration}\n\n`
    content += `${stage.content}\n\n`
  })
  
  content += `## 每日任务建议\n\n`
  planData.value.dailyTasks.forEach((task, index) => {
    content += `${index + 1}. **${task.title}**（${task.time}）\n   ${task.description}\n\n`
  })
  
  content += `## 学习建议\n\n${planData.value.tips}\n`

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${planData.value.title}_${new Date().toISOString().split('T')[0]}.md`
  link.click()
  URL.revokeObjectURL(url)

  showToast('下载成功')
}

// 返回课程学习
const backToCourse = () => {
  router.push('/student/course-study')
}

// 返回
const goBack = () => {
  router.back()
}

// 页面加载
onMounted(() => {
  // 如果从课程学习页面跳转过来，自动填充章节信息
  if (route.query.chapter) {
    formData.value.chapter = route.query.chapter
  }
})
</script>

<style scoped>
.study-plan-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 20px;
}

/* 生成表单 */
.generate-form {
  padding: 16px;
}

.form-actions {
  padding: 16px;
}

/* 方案内容 */
.plan-content {
  padding: 16px;
}

/* 方案概览 */
.plan-overview {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.plan-overview h2 {
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 600;
}

.overview-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

/* 学习阶段 */
.plan-stages {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.plan-stages h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.plan-stages h4 {
  margin: 0 0 8px 0;
  font-size: 15px;
  font-weight: 600;
  color: #409eff;
}

.stage-duration {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #909399;
}

.stage-content {
  font-size: 14px;
  line-height: 1.8;
  color: #606266;
}

.stage-content :deep(strong) {
  font-weight: 600;
  color: #303133;
}

/* 每日任务 */
.daily-tasks {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.daily-tasks h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

/* 学习建议 */
.study-tips {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.study-tips h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.tips-content {
  font-size: 14px;
  line-height: 1.8;
  color: #606266;
}

.tips-content :deep(strong) {
  font-weight: 600;
  color: #303133;
}

/* 操作按钮 */
.plan-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Steps样式优化 */
:deep(.van-step__circle) {
  background: #409eff;
}

:deep(.van-step__line) {
  background: #e3f2fd;
}
</style>
