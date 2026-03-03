<template>
  <div class="publish-task-page">
    <van-nav-bar
      :title="`发布${taskType}`"
      left-arrow
      @click-left="$router.back()"
    />

    <van-form @submit="onSubmit" ref="formRef">
      <van-cell-group inset style="margin-top: 12px;">
        <van-field
          v-model="form.title"
          name="title"
          label="任务名称"
          placeholder="请输入任务名称"
          required
          :rules="[{ required: true, message: '请输入任务名称' }]"
        />

        <van-field
          v-model="form.deadline"
          name="deadline"
          label="截止日期"
          placeholder="请选择截止日期"
          readonly
          is-link
          required
          :rules="[{ required: true, message: '请选择截止日期' }]"
          @click="showDatePicker = true"
        />

        <van-field
          v-model="form.scoreWeight"
          name="scoreWeight"
          label="分数占比(%)"
          type="number"
          placeholder="请输入分数占比"
          required
          :rules="[{ required: true, message: '请输入分数占比' }]"
        />

        <van-field
          v-model="form.content"
          name="content"
          label="任务内容"
          type="textarea"
          rows="6"
          autosize
          placeholder="请输入任务内容"
          required
          :rules="[{ required: true, message: '请输入任务内容' }]"
        />
      </van-cell-group>

      <div class="submit-wrap">
        <van-button round block type="primary" native-type="submit" :loading="publishing">
          发布任务
        </van-button>
      </div>
    </van-form>

    <!-- 日期选择器 -->
    <van-popup v-model:show="showDatePicker" position="bottom" round>
      <van-date-picker
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
        title="选择截止日期"
        :min-date="new Date()"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'

const router = useRouter()
const route = useRoute()
const publishing = ref(false)
const showDatePicker = ref(false)

const taskType = computed(() => route.query.type || '任务')

const form = ref({
  title: '',
  deadline: '',
  scoreWeight: '10',
  content: ''
})

const onDateConfirm = ({ selectedValues }) => {
  form.value.deadline = selectedValues.join('-')
  showDatePicker.value = false
}

const onSubmit = async () => {
  publishing.value = true
  try {
    // TODO: 调用API发布任务
    await new Promise(r => setTimeout(r, 800))
    showToast({ type: 'success', message: '发布成功' })
    setTimeout(() => {
      const classId = route.query.classId
      if (classId) {
        router.push({ name: 'teacher-class-detail', params: { classId } })
      } else {
        router.push({ name: 'teacher-dashboard' })
      }
    }, 1500)
  } catch {
    showToast({ type: 'fail', message: '发布失败' })
  } finally {
    publishing.value = false
  }
}

onMounted(() => {
  // 如果从AI出题页面跳转过来，自动填充题目内容
  if (route.query.questions) {
    try {
      const questions = JSON.parse(route.query.questions)
      form.value.content = questions.map((q, i) =>
        `${i + 1}. ${q.title}\n${q.options ? q.options.map((opt, j) => `${String.fromCharCode(65 + j)}. ${opt}`).join('\n') : ''}\n答案：${q.answer}\n`
      ).join('\n')
    } catch {}
  }
})
</script>

<style scoped>
.publish-task-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 24px;
}

.submit-wrap {
  padding: 16px;
  margin-top: 8px;
}
</style>
