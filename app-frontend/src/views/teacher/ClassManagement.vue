<template>
  <div class="class-management-page">
    <van-nav-bar
      title="班级管理"
      left-arrow
      @click-left="$router.back()"
      right-text="创建班级"
      @click-right="showCreateDialog = true"
    />

    <div class="page-container">
      <!-- 搜索框 -->
      <van-search
        v-model="searchKeyword"
        placeholder="搜索班级名称"
        shape="round"
        background="#f5f5f5"
      />

      <!-- 加载中 -->
      <div v-if="loading" class="loading-wrap">
        <van-loading type="spinner" color="#667eea" />
      </div>

      <!-- 空状态 -->
      <van-empty
        v-else-if="filteredClasses.length === 0"
        description="暂无班级，点击右上角创建"
        image="search"
      />

      <!-- 班级列表 -->
      <div v-else class="class-list">
        <div
          v-for="cls in filteredClasses"
          :key="cls.classId"
          class="class-card card"
          @click="goClassDetail(cls.classId)"
        >
          <div class="class-card-header">
            <span class="class-name">{{ cls.className }}</span>
            <van-tag :type="getStatusType(cls.status)" size="medium">
              {{ getStatusLabel(cls.status) }}
            </van-tag>
          </div>
          <div class="class-card-body">
            <div class="meta-row">
              <span class="meta-item">📅 {{ cls.semester }}</span>
              <span class="meta-item">👥 {{ cls.currentStudents }}/{{ cls.maxStudents }} 人</span>
            </div>
            <div class="class-code">
              验证码：<strong>{{ cls.classCode }}</strong>
            </div>
            <div v-if="cls.description" class="class-desc">{{ cls.description }}</div>
          </div>
          <div class="class-card-footer">
            <span class="create-time">{{ cls.createTime }}</span>
            <van-icon name="arrow" color="#999" />
          </div>
        </div>
      </div>
    </div>

    <!-- 创建班级弹窗 -->
    <van-dialog
      v-model:show="showCreateDialog"
      title="创建班级"
      show-cancel-button
      :before-close="handleCreateClass"
    >
      <div class="dialog-form">
        <van-field
          v-model="createForm.className"
          label="班级名称"
          placeholder="请输入班级名称"
          required
        />
        <!-- 授课科目下拉 -->
        <van-field
          v-model="createForm.subjectName"
          label="授课科目"
          placeholder="请选择授课科目"
          readonly
          is-link
          required
          @click="showSubjectPicker = true"
        />
        <!-- 学期下拉 -->
        <van-field
          v-model="createForm.semester"
          label="学期"
          placeholder="请选择学期"
          readonly
          is-link
          required
          @click="showSemesterPicker = true"
        />
        <van-field
          v-model="createForm.maxStudents"
          label="人数上限"
          type="number"
          placeholder="请输入最大学生人数"
          required
        />
        <van-field
          v-model="createForm.classCode"
          label="班级验证码"
          placeholder="请输入或生成验证码"
          required
        >
          <template #button>
            <van-button size="mini" type="primary" @click.stop="generateCode">生成</van-button>
          </template>
        </van-field>
        <van-field
          v-model="createForm.description"
          label="班级描述"
          placeholder="选填"
          type="textarea"
          rows="2"
          autosize
        />
      </div>
    </van-dialog>

    <!-- 科目选择器 -->
    <van-popup v-model:show="showSubjectPicker" position="bottom" round>
      <van-picker
        :columns="subjectColumns"
        @confirm="onSubjectConfirm"
        @cancel="showSubjectPicker = false"
        title="选择授课科目"
      />
    </van-popup>

    <!-- 学期选择器 -->
    <van-popup v-model:show="showSemesterPicker" position="bottom" round>
      <van-picker
        :columns="semesterColumns"
        @confirm="onSemesterConfirm"
        @cancel="showSemesterPicker = false"
        title="选择学期"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import { teacherAPI } from '@/api';

const router = useRouter();

const loading = ref(false);
const classList = ref([]);
const searchKeyword = ref('');
const showCreateDialog = ref(false);

// 科目/学期选择器
const showSubjectPicker = ref(false);
const showSemesterPicker = ref(false);
const subjectList = ref([]);
const semesterList = ref([]);
const subjectColumns = computed(() => subjectList.value.map(s => ({ text: s.subject_name, value: s.subject_id })));
const semesterColumns = computed(() => semesterList.value.map(s => ({ text: s.semester_name, value: s.semester_name })));

const createForm = ref({
  className: '',
  subjectId: '',
  subjectName: '',
  semester: '',
  maxStudents: '30',
  classCode: '',
  description: ''
});

// 生成6位验证码
const generateCode = () => {
  createForm.value.classCode = Math.floor(100000 + Math.random() * 900000).toString();
};

const onSubjectConfirm = ({ selectedOptions }) => {
  const opt = selectedOptions[0];
  createForm.value.subjectId = opt.value;
  createForm.value.subjectName = opt.text;
  showSubjectPicker.value = false;
};

const onSemesterConfirm = ({ selectedOptions }) => {
  createForm.value.semester = selectedOptions[0].text;
  showSemesterPicker.value = false;
};

// 加载科目和学期列表
const loadOptions = async () => {
  try {
    const [subRes, semRes] = await Promise.all([
      teacherAPI.listSubjects(),
      teacherAPI.listSemesters()
    ]);
    subjectList.value = subRes.subjects || [];
    semesterList.value = semRes.semesters || [];
  } catch (e) {
    showToast({ type: 'fail', message: '加载选项失败' });
  }
};

// 过滤班级列表
const filteredClasses = computed(() => {
  if (!searchKeyword.value) return classList.value;
  return classList.value.filter(c => c.className.includes(searchKeyword.value));
});

const getStatusLabel = (status) => {
  const map = { 1: '进行中', 2: '已结束', 3: '已归档' };
  return map[status] || '未知';
};

const getStatusType = (status) => {
  const map = { 1: 'success', 2: 'default', 3: 'warning' };
  return map[status] || 'default';
};

// 加载班级列表
const loadClasses = async () => {
  loading.value = true;
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    const res = await teacherAPI.getTeacherClasses(teacherId);
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
  } catch (error) {
    showToast({ type: 'fail', message: '加载班级列表失败' });
  } finally {
    loading.value = false;
  }
};

// 创建班级
const handleCreateClass = async (action) => {
  if (action === 'cancel') return true;
  const { className, subjectId, semester, maxStudents, classCode } = createForm.value;
  if (!className || !subjectId || !semester || !maxStudents || !classCode) {
    showToast({ type: 'fail', message: '请填写必填项' });
    return false;
  }
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    const res = await teacherAPI.createClass({
      teacher_id: teacherId,
      class_name: className,
      subject_id: subjectId,
      semester,
      max_students: parseInt(maxStudents),
      class_code: classCode,
      description: createForm.value.description
    });
    if (res.code === 0) {
      showToast({ type: 'success', message: '创建班级成功' });
      createForm.value = { className: '', subjectId: '', subjectName: '', semester: '', maxStudents: '30', classCode: '', description: '' };
      loadClasses();
      return true;
    } else {
      showToast({ type: 'fail', message: res.message || '创建失败' });
      return false;
    }
  } catch (error) {
    showToast({ type: 'fail', message: '创建班级失败' });
    return false;
  }
};

// 跳转班级详情
const goClassDetail = (classId) => {
  router.push({ name: 'teacher-class-detail', params: { classId } });
};

onMounted(() => {
  loadClasses();
  loadOptions();
});
</script>

<style scoped>
.class-management-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.page-container {
  padding: 12px 16px;
}

.loading-wrap {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

.class-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.class-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.class-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.class-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  flex: 1;
  margin-right: 8px;
}

.class-card-body {
  margin-bottom: 10px;
}

.meta-row {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
}

.meta-item {
  font-size: 13px;
  color: #666;
}

.class-code {
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
}

.class-code strong {
  color: #667eea;
  font-family: 'Courier New', monospace;
  font-size: 15px;
}

.class-desc {
  font-size: 13px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.class-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.create-time {
  font-size: 12px;
  color: #999;
}

.dialog-form {
  padding: 8px 0;
}
</style>
