<template>
  <div class="teacher-page teacher-profile-page">
    <!-- 顶部导航栏 -->
    <div class="teacher-top-nav">
      <div class="nav-left">
        <el-button type="primary" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回首页
        </el-button>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>教师端</el-breadcrumb-item>
          <el-breadcrumb-item>个人信息中心</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </div>

    <!-- 主内容区 - Tab切换 -->
    <div class="teacher-card">
      <el-tabs v-model="activeTab" class="teacher-tabs">
        <!-- 基本信息Tab -->
        <el-tab-pane label="基本信息" name="basic">
          <el-form :model="profileForm" label-width="120px" class="teacher-form">
            <el-form-item label="姓名">
              <el-input v-model="profileForm.name" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="profileForm.email" />
            </el-form-item>
            <el-form-item label="授课科目">
              <el-select v-model="profileForm.subjects" multiple placeholder="请选择授课科目" style="width: 100%">
                <el-option label="Python编程" value="Python编程" />
                <el-option label="Java编程" value="Java编程" />
                <el-option label="数据结构" value="数据结构" />
                <el-option label="算法设计" value="算法设计" />
              </el-select>
            </el-form-item>
            <el-form-item label="教龄">
              <el-input-number v-model="profileForm.teachingYears" :min="0" :max="50" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveProfile" class="teacher-btn-primary">
                保存修改
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 关联班级Tab -->
        <el-tab-pane label="关联班级" name="classes">
          <el-table :data="classList" class="teacher-table" stripe>
            <el-table-column prop="name" label="班级名称" />
            <el-table-column prop="subject" label="授课科目" />
            <el-table-column prop="semester" label="学期" />
            <el-table-column prop="studentCount" label="学生人数" />
          </el-table>
        </el-tab-pane>

        <!-- 安全设置Tab -->
        <el-tab-pane label="安全设置" name="security">
          <el-form :model="securityForm" label-width="120px" class="teacher-form">
            <el-form-item label="原密码">
              <el-input v-model="securityForm.oldPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="新密码">
              <el-input v-model="securityForm.newPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="确认新密码">
              <el-input v-model="securityForm.confirmPassword" type="password" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="changePassword" class="teacher-btn-primary">
                修改密码
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 退出登录按钮 -->
    <div class="teacher-card logout-section">
      <el-button type="danger" @click="logout">
        <el-icon><SwitchButton /></el-icon>
        退出登录
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();

const activeTab = ref('basic');

const profileForm = ref({
  name: '',
  email: '',
  subjects: [],
  teachingYears: 0
});

const classList = ref([]);

const securityForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const loadProfile = async () => {
  profileForm.value = {
    name: localStorage.getItem('userName') || '教师',
    email: 'teacher@example.com',
    subjects: ['Python编程', '数据结构'],
    teachingYears: 5
  };

  classList.value = [
    { name: '2024春季Python编程班', subject: 'Python编程', semester: '2024春季', studentCount: 28 },
    { name: '2024春季数据结构班', subject: '数据结构', semester: '2024春季', studentCount: 25 }
  ];
};

const saveProfile = async () => {
  try {
    // TODO: 调用API保存个人信息
    ElMessage.success('保存成功');
  } catch (error) {
    ElMessage.error('保存失败');
  }
};

const changePassword = async () => {
  if (!securityForm.value.oldPassword || !securityForm.value.newPassword || !securityForm.value.confirmPassword) {
    ElMessage.warning('请填写完整信息');
    return;
  }
  if (securityForm.value.newPassword !== securityForm.value.confirmPassword) {
    ElMessage.warning('两次输入的新密码不一致');
    return;
  }

  try {
    // TODO: 调用API修改密码
    ElMessage.success('密码修改成功');
    securityForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
  } catch (error) {
    ElMessage.error('密码修改失败');
  }
};

const logout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '确认退出', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    localStorage.clear();
    router.push('/');
  } catch {}
};

const goBack = () => {
  router.push({ name: 'TeacherDashboard' });
};

onMounted(() => {
  loadProfile();
});
</script>

<style scoped lang="scss">
@import '@/styles/teacher.css';

.teacher-profile-page {
  .logout-section {
    text-align: center;
    padding: 32px;
  }
}
</style>
