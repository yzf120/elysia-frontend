<template>
  <div class="create-class-page">
    <van-nav-bar
      title="创建班级"
      left-arrow
      @click-left="$router.back()"
    />

    <van-form @submit="onSubmit" ref="formRef">
      <van-cell-group inset style="margin-top: 12px;">
        <van-field
          v-model="form.className"
          name="className"
          label="班级名称"
          placeholder="如：2024春季Python编程班"
          :rules="[{ required: true, message: '请输入班级名称' }]"
          required
        />

        <!-- 授课科目 -->
        <van-field
          v-model="form.subjectName"
          name="subjectName"
          label="授课科目"
          placeholder="请选择授课科目"
          readonly
          is-link
          required
          :rules="[{ required: true, message: '请选择授课科目' }]"
          @click="showSubjectPicker = true"
        />

        <!-- 学期 -->
        <van-field
          v-model="form.semester"
          name="semester"
          label="学期"
          placeholder="请选择学期"
          readonly
          is-link
          required
          :rules="[{ required: true, message: '请选择学期' }]"
          @click="showSemesterPicker = true"
        />

        <van-field
          v-model="form.maxStudents"
          name="maxStudents"
          label="人数上限"
          type="number"
          placeholder="请输入最大学生人数"
          required
          :rules="[{ required: true, message: '请输入人数上限' }]"
        />

        <van-field
          v-model="form.classCode"
          name="classCode"
          label="班级验证码"
          placeholder="点击右侧按钮生成"
          required
          :rules="[{ required: true, message: '请生成班级验证码' }]"
        >
          <template #button>
            <van-button size="mini" type="primary" native-type="button" @click="generateCode">生成</van-button>
          </template>
        </van-field>

        <van-field
          v-model="form.description"
          name="description"
          label="班级描述"
          type="textarea"
          rows="2"
          autosize
          placeholder="选填"
        />
      </van-cell-group>

      <div class="tip-text">学生需要使用验证码加入班级</div>

      <div class="submit-wrap">
        <van-button round block type="primary" native-type="submit" :loading="submitting">
          提交创建
        </van-button>
      </div>
    </van-form>

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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { teacherAPI } from '@/api'

const router = useRouter()
const submitting = ref(false)

const form = ref({
  className: '',
  subjectId: '',
  subjectName: '',
  semester: '',
  maxStudents: '30',
  classCode: '',
  description: ''
})

const subjectList = ref([])
const semesterList = ref([])
const showSubjectPicker = ref(false)
const showSemesterPicker = ref(false)

const subjectColumns = computed(() => subjectList.value.map(s => ({ text: s.subject_name, value: s.subject_id })))
const semesterColumns = computed(() => semesterList.value.map(s => ({ text: s.semester_name, value: s.semester_name })))

const generateCode = () => {
  form.value.classCode = Math.floor(100000 + Math.random() * 900000).toString()
}

const onSubjectConfirm = ({ selectedOptions }) => {
  const opt = selectedOptions[0]
  form.value.subjectId = opt.value
  form.value.subjectName = opt.text
  showSubjectPicker.value = false
}

const onSemesterConfirm = ({ selectedOptions }) => {
  form.value.semester = selectedOptions[0].text
  showSemesterPicker.value = false
}

const onSubmit = async () => {
  submitting.value = true
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const teacherId = userInfo.teacher_id || userInfo.id || ''
    const res = await teacherAPI.createClass({
      teacher_id: teacherId,
      class_name: form.value.className,
      subject_id: form.value.subjectId,
      semester: form.value.semester,
      max_students: parseInt(form.value.maxStudents),
      class_code: form.value.classCode,
      description: form.value.description
    })
    if (res.code === 0) {
      showToast({ type: 'success', message: '班级创建成功' })
      setTimeout(() => router.push({ name: 'teacher-class-management' }), 1500)
    } else {
      showToast({ type: 'fail', message: res.message || '创建失败' })
    }
  } catch (e) {
    showToast({ type: 'fail', message: '创建班级失败' })
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const [subRes, semRes] = await Promise.all([
      teacherAPI.listSubjects(),
      teacherAPI.listSemesters()
    ])
    subjectList.value = subRes.subjects || []
    semesterList.value = semRes.semesters || []
  } catch (e) {
    showToast({ type: 'fail', message: '加载选项失败' })
  }
})
</script>

<style scoped>
.create-class-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 24px;
}

.tip-text {
  font-size: 12px;
  color: #999;
  padding: 8px 20px;
}

.submit-wrap {
  padding: 16px;
  margin-top: 8px;
}
</style>
