<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <el-aside width="240px" class="admin-sidebar">
      <div class="sidebar-logo">
        <el-icon style="margin-right: 8px;"><Platform /></el-icon>
        Elysia 管理端
      </div>
      <el-menu
        :default-active="activeMenu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <span>管理员首页</span>
        </el-menu-item>
        <el-menu-item index="/admin/knowledge">
          <el-icon><Reading /></el-icon>
          <span>知识库管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/models">
          <el-icon><Setting /></el-icon>
          <span>模型管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <div class="admin-main">
      <!-- 顶部导航栏 -->
      <el-header class="admin-header" height="60px">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/admin/dashboard' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>用户管理</el-breadcrumb-item>
        </el-breadcrumb>
        <div class="header-actions">
          <el-button @click="$router.push('/admin/dashboard')">
            <el-icon><Back /></el-icon>
            返回首页
          </el-button>
          <el-button type="primary" @click="$router.push('/admin/profile')">
            <el-icon><User /></el-icon>
            我的
          </el-button>
        </div>
      </el-header>

      <!-- 内容区域 -->
      <div class="admin-content">
        <div class="page-container fade-in">
          <el-tabs v-model="activeTab" type="card">
            <!-- 学生用户 Tab -->
            <el-tab-pane label="学生用户" name="student">
              <div class="table-toolbar">
                <div class="toolbar-left">
                  <el-input
                    v-model="studentSearch"
                    placeholder="搜索手机号、姓名、学号"
                    style="width: 300px;"
                    clearable
                    @keyup.enter="loadStudents"
                  >
                    <template #prefix>
                      <el-icon><Search /></el-icon>
                    </template>
                  </el-input>
                  <el-button type="primary" @click="loadStudents">
                    <el-icon><Search /></el-icon>
                    搜索
                  </el-button>
                  <el-button @click="handleRefresh('student')">
                    <el-icon><Refresh /></el-icon>
                    刷新
                  </el-button>
                </div>
                <div class="toolbar-right">
                  <el-button 
                    @click="handleBatchAction('student', 'disable')" 
                    :disabled="selectedStudents.length === 0"
                  >
                    <el-icon><Lock /></el-icon>
                    批量禁用
                  </el-button>
                  <el-button 
                    @click="handleBatchAction('student', 'enable')" 
                    :disabled="selectedStudents.length === 0"
                  >
                    <el-icon><Unlock /></el-icon>
                    批量启用
                  </el-button>
                  <el-button @click="handleExport('student')">
                    <el-icon><Download /></el-icon>
                    导出列表
                  </el-button>
                </div>
              </div>

              <el-table
                v-loading="loading"
                :data="students"
                stripe
                @selection-change="handleStudentSelectionChange"
              >
                <el-table-column type="selection" width="55" />
                <el-table-column prop="phoneNumber" label="手机号" width="130" />
                <el-table-column prop="name" label="姓名" width="100" />
                <el-table-column prop="studentNumber" label="学号" width="130" />
                <el-table-column prop="major" label="专业" min-width="150" />
                <el-table-column prop="grade" label="年级" width="100" />
                <el-table-column prop="registerTime" label="注册时间" width="180" />
                <el-table-column prop="status" label="账号状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.status === '正常' ? 'success' : 'danger'">
                      {{ row.status }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="150" fixed="right">
                  <template #default="{ row }">
                    <el-button 
                      v-if="row.status === '正常'" 
                      type="warning" 
                      size="small" 
                      link 
                      @click="handleToggleStatus(row, 'student')"
                    >
                      禁用
                    </el-button>
                    <el-button 
                      v-else 
                      type="success" 
                      size="small" 
                      link 
                      @click="handleToggleStatus(row, 'student')"
                    >
                      启用
                    </el-button>
                    <el-button type="primary" size="small" link @click="handleViewDetail(row, 'student')">
                      详情
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>

              <el-pagination
                v-model:current-page="studentPage"
                v-model:page-size="studentPageSize"
                :total="studentTotal"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="loadStudents"
                @current-change="loadStudents"
              />
            </el-tab-pane>

            <!-- 教师用户 Tab -->
            <el-tab-pane label="教师用户" name="teacher">
              <div class="table-toolbar">
                <div class="toolbar-left">
                  <el-input
                    v-model="teacherSearch"
                    placeholder="搜索工号、邮箱、姓名"
                    style="width: 300px;"
                    clearable
                    @keyup.enter="loadTeachers"
                  >
                    <template #prefix>
                      <el-icon><Search /></el-icon>
                    </template>
                  </el-input>
                  <el-button type="primary" @click="loadTeachers">
                    <el-icon><Search /></el-icon>
                    搜索
                  </el-button>
                  <el-button @click="handleRefresh('teacher')">
                    <el-icon><Refresh /></el-icon>
                    刷新
                  </el-button>
                </div>
                <div class="toolbar-right">
                  <el-select v-model="teacherAuditFilter" placeholder="审核状态" style="width: 120px;" @change="loadTeachers">
                    <el-option label="全部" value="" />
                    <el-option label="已通过" value="approved" />
                    <el-option label="待审核" value="pending" />
                    <el-option label="已驳回" value="rejected" />
                  </el-select>
                  <el-button 
                    @click="handleBatchAction('teacher', 'disable')" 
                    :disabled="selectedTeachers.length === 0"
                  >
                    <el-icon><Lock /></el-icon>
                    批量禁用
                  </el-button>
                  <el-button 
                    @click="handleBatchAction('teacher', 'enable')" 
                    :disabled="selectedTeachers.length === 0"
                  >
                    <el-icon><Unlock /></el-icon>
                    批量启用
                  </el-button>
                  <el-button @click="handleExport('teacher')">
                    <el-icon><Download /></el-icon>
                    导出列表
                  </el-button>
                </div>
              </div>

              <el-table
                v-loading="loading"
                :data="teachers"
                stripe
                @selection-change="handleTeacherSelectionChange"
              >
                <el-table-column type="selection" width="55" />
                <el-table-column prop="employeeNumber" label="工号" width="130" />
                <el-table-column prop="name" label="姓名" width="100" />
                <el-table-column prop="email" label="学校邮箱" min-width="200" />
                <el-table-column prop="department" label="院系" width="150" />
                <el-table-column prop="title" label="职称" width="100" />
                <el-table-column prop="auditStatus" label="审核状态" width="100">
                  <template #default="{ row }">
                    <el-tag v-if="row.auditStatus === '已通过'" type="success">已通过</el-tag>
                    <el-tag v-else-if="row.auditStatus === '待审核'" type="warning">待审核</el-tag>
                    <el-tag v-else type="danger">已驳回</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="账号状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.status === '正常' ? 'success' : 'danger'">
                      {{ row.status }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="180" fixed="right">
                  <template #default="{ row }">
                    <el-button 
                      v-if="row.status === '正常'" 
                      type="warning" 
                      size="small" 
                      link 
                      @click="handleToggleStatus(row, 'teacher')"
                    >
                      禁用
                    </el-button>
                    <el-button 
                      v-else 
                      type="success" 
                      size="small" 
                      link 
                      @click="handleToggleStatus(row, 'teacher')"
                    >
                      启用
                    </el-button>
                    <el-button 
                      v-if="row.auditStatus !== '已通过'" 
                      type="primary" 
                      size="small" 
                      link 
                      @click="handleReaudit(row)"
                    >
                      重新审核
                    </el-button>
                    <el-button type="info" size="small" link @click="handleViewDetail(row, 'teacher')">
                      详情
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>

              <el-pagination
                v-model:current-page="teacherPage"
                v-model:page-size="teacherPageSize"
                :total="teacherTotal"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="loadTeachers"
                @current-change="loadTeachers"
              />
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as XLSX from 'xlsx';

const router = useRouter();
const activeTab = ref('student');
const activeMenu = computed(() => router.currentRoute.value.path);
const loading = ref(false);

// 学生用户
const studentSearch = ref('');
const students = ref([
  {
    id: 1,
    phoneNumber: '13800138001',
    name: '张三',
    studentNumber: '2024001',
    major: '计算机科学与技术',
    grade: '2024级',
    registerTime: '2026-01-15 10:30:00',
    status: '正常'
  },
  {
    id: 2,
    phoneNumber: '13800138002',
    name: '李四',
    studentNumber: '2024002',
    major: '软件工程',
    grade: '2024级',
    registerTime: '2026-01-16 14:20:00',
    status: '正常'
  },
  {
    id: 3,
    phoneNumber: '13800138003',
    name: '王五',
    studentNumber: '2023015',
    major: '人工智能',
    grade: '2023级',
    registerTime: '2025-09-10 09:00:00',
    status: '已禁用'
  }
]);
const selectedStudents = ref([]);
const studentPage = ref(1);
const studentPageSize = ref(10);
const studentTotal = ref(3);

// 教师用户
const teacherSearch = ref('');
const teacherAuditFilter = ref('');
const teachers = ref([
  {
    id: 1,
    employeeNumber: 'T20240001',
    name: '张教授',
    email: 'zhang@university.edu.cn',
    department: '计算机学院',
    title: '教授',
    auditStatus: '已通过',
    status: '正常'
  },
  {
    id: 2,
    employeeNumber: 'T20240002',
    name: '李老师',
    email: 'li@university.edu.cn',
    department: '数学学院',
    title: '讲师',
    auditStatus: '待审核',
    status: '正常'
  },
  {
    id: 3,
    employeeNumber: 'T20240003',
    name: '王副教授',
    email: 'wang@university.edu.cn',
    department: '物理学院',
    title: '副教授',
    auditStatus: '已通过',
    status: '已禁用'
  }
]);
const selectedTeachers = ref([]);
const teacherPage = ref(1);
const teacherPageSize = ref(10);
const teacherTotal = ref(3);

// 加载学生列表
const loadStudents = async () => {
  loading.value = true;
  try {
    // TODO: 调用API加载学生列表
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (error) {
    ElMessage.error('加载失败：' + error);
  } finally {
    loading.value = false;
  }
};

// 加载教师列表
const loadTeachers = async () => {
  loading.value = true;
  try {
    // TODO: 调用API加载教师列表
    await new Promise(resolve => setTimeout(resolve, 500));
  } catch (error) {
    ElMessage.error('加载失败：' + error);
  } finally {
    loading.value = false;
  }
};

// 刷新
const handleRefresh = (type) => {
  if (type === 'student') {
    studentSearch.value = '';
    loadStudents();
  } else {
    teacherSearch.value = '';
    teacherAuditFilter.value = '';
    loadTeachers();
  }
};

// 学生选择变化
const handleStudentSelectionChange = (selection) => {
  selectedStudents.value = selection;
};

// 教师选择变化
const handleTeacherSelectionChange = (selection) => {
  selectedTeachers.value = selection;
};

// 切换账号状态
const handleToggleStatus = (row, type) => {
  const action = row.status === '正常' ? '禁用' : '启用';
  const userName = type === 'student' ? row.name : row.name;
  
  ElMessageBox.confirm(
    `确定要${action}用户"${userName}"吗？`,
    `确认${action}`,
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // TODO: 调用API切换状态
      await new Promise(resolve => setTimeout(resolve, 500));
      row.status = row.status === '正常' ? '已禁用' : '正常';
      ElMessage.success(`${action}成功`);
    } catch (error) {
      ElMessage.error(`${action}失败：` + error);
    }
  });
};

// 批量操作
const handleBatchAction = (type, action) => {
  const selected = type === 'student' ? selectedStudents.value : selectedTeachers.value;
  const actionText = action === 'disable' ? '禁用' : '启用';
  
  ElMessageBox.confirm(
    `确定要${actionText}选中的 ${selected.length} 个用户吗？`,
    `确认${actionText}`,
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // TODO: 调用API批量操作
      await new Promise(resolve => setTimeout(resolve, 500));
      ElMessage.success(`批量${actionText}成功`);
      if (type === 'student') {
        loadStudents();
      } else {
        loadTeachers();
      }
    } catch (error) {
      ElMessage.error(`批量${actionText}失败：` + error);
    }
  });
};

// 查看详情
const handleViewDetail = (row, type) => {
  ElMessageBox.alert(
    `<div style="text-align: left;">
      <p><strong>姓名：</strong>${row.name}</p>
      <p><strong>${type === 'student' ? '学号' : '工号'}：</strong>${type === 'student' ? row.studentNumber : row.employeeNumber}</p>
      <p><strong>${type === 'student' ? '手机号' : '邮箱'}：</strong>${type === 'student' ? row.phoneNumber : row.email}</p>
      <p><strong>${type === 'student' ? '专业' : '院系'}：</strong>${type === 'student' ? row.major : row.department}</p>
      <p><strong>状态：</strong>${row.status}</p>
    </div>`,
    '用户详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '关闭'
    }
  );
};

// 重新审核
const handleReaudit = (row) => {
  router.push({
    path: '/admin/teacher-audit',
    query: { id: row.id }
  });
};

// 导出列表
const handleExport = (type) => {
  try {
    const data = type === 'student' ? students.value : teachers.value;
    const fileName = type === 'student' ? '学生用户列表' : '教师用户列表';
    
    // 准备导出数据
    const exportData = data.map(item => {
      if (type === 'student') {
        return {
          '手机号': item.phoneNumber,
          '姓名': item.name,
          '学号': item.studentNumber,
          '专业': item.major,
          '年级': item.grade,
          '注册时间': item.registerTime,
          '账号状态': item.status
        };
      } else {
        return {
          '工号': item.employeeNumber,
          '姓名': item.name,
          '学校邮箱': item.email,
          '院系': item.department,
          '职称': item.title,
          '审核状态': item.auditStatus,
          '账号状态': item.status
        };
      }
    });
    
    // 创建工作簿
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type === 'student' ? '学生用户' : '教师用户');
    
    // 导出文件
    XLSX.writeFile(wb, `${fileName}_${new Date().getTime()}.xlsx`);
    
    ElMessage.success('导出成功');
  } catch (error) {
    ElMessage.error('导出失败：' + error);
  }
};

onMounted(() => {
  loadStudents();
  loadTeachers();
});
</script>

<style scoped>
@import '@/styles/admin.css';
</style>
