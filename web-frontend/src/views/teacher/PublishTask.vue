<template>
  <div class="teacher-page publish-task-page">
    <!-- 顶部导航栏 -->
    <div class="teacher-top-nav">
      <div class="nav-left">
        <el-button type="primary" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>教师端</el-breadcrumb-item>
          <el-breadcrumb-item>发布任务</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </div>

    <!-- 表单区域 -->
    <div class="teacher-card">
      <h3 class="teacher-card-title">发布{{ taskType }}</h3>
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px" class="teacher-form">
        <el-form-item label="任务名称" prop="title">
          <el-input v-model="formData.title" placeholder="请输入任务名称" />
        </el-form-item>

        <el-form-item label="截止日期" prop="deadline">
          <el-date-picker
            v-model="formData.deadline"
            type="datetime"
            placeholder="选择截止日期"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="分数占比" prop="scoreWeight">
          <el-input-number v-model="formData.scoreWeight" :min="0" :max="100" style="width: 100%" />
          <span style="margin-left: 8px; color: var(--teacher-text-secondary);">%</span>
        </el-form-item>

        <el-form-item label="任务内容" prop="content">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="10"
            placeholder="请输入任务内容"
          />
        </el-form-item>

        <el-form-item label="附件上传">
          <el-upload
            class="upload-demo"
            drag
            :auto-upload="false"
            :on-change="handleFileChange"
            multiple
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
          </el-upload>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="publishing" @click="publishTask" class="teacher-btn-primary" style="width: 200px">
            发布任务
          </el-button>
          <el-button @click="goBack">取消</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';

const router = useRouter();
const route = useRoute();

const formRef = ref(null);
const publishing = ref(false);

const taskType = computed(() => route.query.type || '任务');

const formData = ref({
  title: '',
  deadline: null,
  scoreWeight: 10,
  content: '',
  files: []
});

const formRules = {
  title: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  deadline: [{ required: true, message: '请选择截止日期', trigger: 'change' }],
  scoreWeight: [{ required: true, message: '请输入分数占比', trigger: 'blur' }],
  content: [{ required: true, message: '请输入任务内容', trigger: 'blur' }]
};

const handleFileChange = (file, fileList) => {
  formData.value.files = fileList;
};

const publishTask = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    publishing.value = true;

    // TODO: 调用API发布任务
    await new Promise(resolve => setTimeout(resolve, 1000));

    ElMessage.success('发布成功！2秒后自动跳转...');
    setTimeout(() => {
      const classId = route.query.classId;
      if (classId) {
        router.push({ name: 'ClassDetail', params: { id: classId } });
      } else {
        router.push({ name: 'TeacherDashboard' });
      }
    }, 2000);
  } catch (error) {
    if (error !== false) {
      ElMessage.error('发布失败');
    }
  } finally {
    publishing.value = false;
  }
};

const goBack = () => {
  router.back();
};

onMounted(() => {
  // 如果从AI出题页面跳转过来，自动填充题目内容
  if (route.query.questions) {
    try {
      const questions = JSON.parse(route.query.questions);
      formData.value.content = questions.map((q, i) => 
        `${i + 1}. ${q.title}\n${q.options ? q.options.map((opt, j) => `${String.fromCharCode(65 + j)}. ${opt}`).join('\n') : ''}\n答案：${q.answer}\n`
      ).join('\n');
    } catch (error) {
      console.error('解析题目失败:', error);
    }
  }
});
</script>

<style scoped lang="scss">
@import '@/styles/teacher.css';
</style>
