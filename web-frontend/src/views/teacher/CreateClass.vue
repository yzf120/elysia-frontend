<template>
  <div class="teacher-page create-class-page">
    <!-- 顶部导航栏 -->
    <div class="teacher-top-nav">
      <div class="nav-left">
        <el-button type="primary" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回首页
        </el-button>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>教师端</el-breadcrumb-item>
          <el-breadcrumb-item>创建班级</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </div>

    <!-- 表单区域 -->
    <div class="teacher-card">
      <h3 class="teacher-card-title">创建新班级</h3>
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        class="teacher-form"
      >
        <el-form-item label="班级名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入班级名称，如：2024春季Python编程班"
            clearable
          />
        </el-form-item>

        <el-form-item label="授课科目" prop="subject">
          <el-select v-model="formData.subject" placeholder="请选择授课科目" style="width: 100%" :loading="loadingSubjects">
            <el-option
              v-for="item in subjectList"
              :key="item.subject_id"
              :label="item.subject_name"
              :value="item.subject_id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="学期" prop="semester">
          <el-select v-model="formData.semester" placeholder="请选择学期" style="width: 100%" :loading="loadingSemesters">
            <el-option
              v-for="item in semesterList"
              :key="item.semester_id"
              :label="item.semester_name"
              :value="item.semester_name"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="人数上限" prop="maxCount">
          <el-input-number
            v-model="formData.maxCount"
            :min="1"
            :max="200"
            placeholder="请输入人数上限"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="班级验证码">
          <div class="code-display">
            <el-input
              v-model="formData.code"
              placeholder="点击右侧按钮生成验证码"
              readonly
              style="flex: 1"
            />
            <el-button type="primary" @click="generateCode">
              <el-icon><Refresh /></el-icon>
              生成验证码
            </el-button>
          </div>
          <div class="form-tip">
            学生需要使用此验证码加入班级
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="submitting"
            @click="submitForm"
            class="teacher-btn-primary"
            style="width: 200px"
          >
            提交创建
          </el-button>
          <el-button size="large" @click="resetForm">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { teacherAPI } from '@/services/index.js';

const router = useRouter();

// 表单引用
const formRef = ref(null);

// 提交状态
const submitting = ref(false);

// 科目/学期列表
const subjectList = ref([]);
const semesterList = ref([]);
const loadingSubjects = ref(false);
const loadingSemesters = ref(false);

// 表单数据
const formData = reactive({
  name: '',
  subject: '',
  semester: '',
  maxCount: 30,
  code: ''
});

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入班级名称', trigger: 'blur' },
    { min: 2, max: 50, message: '班级名称长度在2-50个字符之间', trigger: 'blur' }
  ],
  subject: [
    { required: true, message: '请选择授课科目', trigger: 'change' }
  ],
  semester: [
    { required: true, message: '请选择学期', trigger: 'change' }
  ],
  maxCount: [
    { required: true, message: '请输入人数上限', trigger: 'blur' },
    { type: 'number', min: 1, message: '人数上限至少为1', trigger: 'blur' }
  ]
};

// 加载科目列表
const loadSubjects = async () => {
  loadingSubjects.value = true;
  try {
    const res = await teacherAPI.listSubjects();
    subjectList.value = res.subjects || [];
  } catch (e) {
    ElMessage.error('加载科目列表失败');
  } finally {
    loadingSubjects.value = false;
  }
};

// 加载学期列表
const loadSemesters = async () => {
  loadingSemesters.value = true;
  try {
    const res = await teacherAPI.listSemesters();
    semesterList.value = res.semesters || [];
  } catch (e) {
    ElMessage.error('加载学期列表失败');
  } finally {
    loadingSemesters.value = false;
  }
};

onMounted(() => {
  loadSubjects();
  loadSemesters();
});

// 生成验证码（6位数字）
const generateCode = () => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  formData.code = code;
  ElMessage.success('验证码生成成功');
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;

  try {
    // 验证表单
    await formRef.value.validate();

    // 检查是否生成了验证码
    if (!formData.code) {
      ElMessage.warning('请先生成班级验证码');
      return;
    }

    submitting.value = true;

    // 获取教师信息
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';

    await teacherAPI.createClass({
      teacher_id: teacherId,
      class_name: formData.name,
      subject_id: formData.subject,
      semester: formData.semester,
      max_students: formData.maxCount,
      class_code: formData.code
    });

    ElMessage.success('班级创建成功！2秒后自动跳转...');

    // 2秒后跳转到首页
    setTimeout(() => {
      router.push({ name: 'TeacherDashboard' });
    }, 2000);
  } catch (error) {
    if (error !== false) {
      console.error('创建班级失败:', error);
      ElMessage.error(typeof error === 'string' ? error : '创建班级失败');
    }
  } finally {
    submitting.value = false;
  }
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
    formData.code = '';
  }
};

// 返回首页
const goBack = () => {
  router.push({ name: 'TeacherDashboard' });
};
</script>

<style scoped lang="scss">
@import '@/styles/teacher.css';

.create-class-page {
  .code-display {
    display: flex;
    gap: 12px;
    width: 100%;
  }

  .form-tip {
    margin-top: 8px;
    font-size: 13px;
    color: var(--teacher-text-secondary);
  }

  :deep(.el-form-item__content) {
    flex-wrap: wrap;
  }
}
</style>