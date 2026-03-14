<template>
  <div class="admin-layout">
    <AdminSidebar :active-menu="activeMenu" />

    <div class="admin-main">
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

      <div class="admin-content">
        <div class="page-container fade-in">
          <el-tabs v-model="activeTab" type="card">
            <el-tab-pane label="学生用户" name="student">
              <div class="table-toolbar toolbar-stack">
                <div class="toolbar-left toolbar-grid">
                  <el-input
                    v-model="studentFilters.keyword"
                    placeholder="搜索手机号、姓名、学号"
                    style="width: 260px;"
                    clearable
                    @clear="loadStudents(true)"
                    @keyup.enter="loadStudents(true)"
                  >
                    <template #prefix>
                      <el-icon><Search /></el-icon>
                    </template>
                  </el-input>
                  <el-input
                    v-model="studentFilters.major"
                    placeholder="按专业筛选"
                    style="width: 180px;"
                    clearable
                    @clear="loadStudents(true)"
                    @keyup.enter="loadStudents(true)"
                  />
                  <el-input
                    v-model="studentFilters.grade"
                    placeholder="按年级筛选"
                    style="width: 160px;"
                    clearable
                    @clear="loadStudents(true)"
                    @keyup.enter="loadStudents(true)"
                  />
                  <el-select
                    v-model="studentFilters.status"
                    placeholder="账号状态"
                    clearable
                    style="width: 140px;"
                    @change="loadStudents(true)"
                  >
                    <el-option label="全部状态" value="" />
                    <el-option label="正常" value="enabled" />
                    <el-option label="已禁用" value="disabled" />
                  </el-select>
                  <el-button type="primary" @click="loadStudents(true)">
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
                v-loading="studentLoading"
                :data="students"
                stripe
                row-key="studentId"
                @selection-change="handleStudentSelectionChange"
              >
                <el-table-column type="selection" width="55" />
                <el-table-column prop="phoneNumber" label="手机号" width="140" />
                <el-table-column prop="name" label="姓名" width="120" />
                <el-table-column prop="studentNumber" label="学号" width="140" />
                <el-table-column prop="major" label="专业" min-width="180" />
                <el-table-column prop="grade" label="年级" width="120" />
                <el-table-column prop="registerTime" label="注册时间" width="180" />
                <el-table-column prop="status" label="账号状态" width="110">
                  <template #default="{ row }">
                    <el-tag :type="row.status === '正常' ? 'success' : 'danger'">
                      {{ row.status }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="160" fixed="right">
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
                @size-change="handleStudentPageSizeChange"
                @current-change="handleStudentPageChange"
              />
            </el-tab-pane>

            <el-tab-pane label="教师用户" name="teacher">
              <div class="table-toolbar toolbar-stack">
                <div class="toolbar-left toolbar-grid">
                  <el-input
                    v-model="teacherFilters.keyword"
                    placeholder="搜索工号、邮箱、姓名、手机号"
                    style="width: 280px;"
                    clearable
                    @clear="loadTeachers(true)"
                    @keyup.enter="loadTeachers(true)"
                  >
                    <template #prefix>
                      <el-icon><Search /></el-icon>
                    </template>
                  </el-input>
                  <el-input
                    v-model="teacherFilters.department"
                    placeholder="按院系筛选"
                    style="width: 180px;"
                    clearable
                    @clear="loadTeachers(true)"
                    @keyup.enter="loadTeachers(true)"
                  />
                  <el-select
                    v-model="teacherFilters.verificationStatus"
                    placeholder="审核状态"
                    clearable
                    style="width: 140px;"
                    @change="loadTeachers(true)"
                  >
                    <el-option label="全部审核" value="" />
                    <el-option label="已通过" value="approved" />
                    <el-option label="待审核" value="pending" />
                    <el-option label="已驳回" value="rejected" />
                  </el-select>
                  <el-select
                    v-model="teacherFilters.status"
                    placeholder="账号状态"
                    clearable
                    style="width: 140px;"
                    @change="loadTeachers(true)"
                  >
                    <el-option label="全部状态" value="" />
                    <el-option label="正常" value="enabled" />
                    <el-option label="已禁用" value="disabled" />
                  </el-select>
                  <el-button type="primary" @click="loadTeachers(true)">
                    <el-icon><Search /></el-icon>
                    搜索
                  </el-button>
                  <el-button @click="handleRefresh('teacher')">
                    <el-icon><Refresh /></el-icon>
                    刷新
                  </el-button>
                </div>
                <div class="toolbar-right">
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
                v-loading="teacherLoading"
                :data="teachers"
                stripe
                row-key="teacherId"
                @selection-change="handleTeacherSelectionChange"
              >
                <el-table-column type="selection" width="55" />
                <el-table-column prop="employeeNumber" label="工号" width="140" />
                <el-table-column prop="name" label="姓名" width="120" />
                <el-table-column prop="email" label="学校邮箱" min-width="220" />
                <el-table-column prop="department" label="院系" width="160" />
                <el-table-column prop="title" label="职称" width="120" />
                <el-table-column prop="auditStatus" label="审核状态" width="110">
                  <template #default="{ row }">
                    <el-tag v-if="row.auditStatus === '已通过'" type="success">已通过</el-tag>
                    <el-tag v-else-if="row.auditStatus === '待审核'" type="warning">待审核</el-tag>
                    <el-tag v-else type="danger">已驳回</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="账号状态" width="110">
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
                @size-change="handleTeacherPageSizeChange"
                @current-change="handleTeacherPageChange"
              />
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import AdminSidebar from '@/components/admin/AdminSidebar.vue'
import { adminAPI } from '@/services'
import { downloadBlob } from '@/utils/file'

const router = useRouter()
const activeTab = ref('student')
const activeMenu = computed(() => router.currentRoute.value.path)

const studentLoading = ref(false)
const teacherLoading = ref(false)

const studentFilters = ref({
  keyword: '',
  major: '',
  grade: '',
  status: ''
})
const teacherFilters = ref({
  keyword: '',
  department: '',
  verificationStatus: '',
  status: ''
})

const students = ref([])
const teachers = ref([])
const selectedStudents = ref([])
const selectedTeachers = ref([])

const studentPage = ref(1)
const studentPageSize = ref(10)
const studentTotal = ref(0)
const teacherPage = ref(1)
const teacherPageSize = ref(10)
const teacherTotal = ref(0)

const mapStudent = (item = {}) => ({
  id: item.student_id,
  studentId: item.student_id,
  phoneNumber: item.phone_number || '—',
  name: item.student_name || '—',
  studentNumber: item.student_number || '—',
  email: item.email || '—',
  major: item.major || '—',
  grade: item.grade || '—',
  programmingLevel: item.programming_level || '—',
  registerTime: item.create_time || '—',
  status: item.status_label || '—',
  rawStatus: Number(item.status ?? 0)
})

const mapTeacher = (item = {}) => ({
  id: item.teacher_id,
  teacherId: item.teacher_id,
  phoneNumber: item.phone_number || '—',
  name: item.teacher_name || '—',
  employeeNumber: item.employee_number || '—',
  email: item.school_email || '—',
  department: item.department || '—',
  title: item.title || '—',
  auditStatus: item.verification_status_label || '待审核',
  rawVerificationStatus: Number(item.verification_status ?? 0),
  status: item.status_label || '—',
  rawStatus: Number(item.status ?? 0),
  registerTime: item.create_time || '—'
})

const getStudentQueryParams = () => ({
  page: studentPage.value,
  page_size: studentPageSize.value,
  keyword: studentFilters.value.keyword.trim() || undefined,
  major: studentFilters.value.major.trim() || undefined,
  grade: studentFilters.value.grade.trim() || undefined,
  status: studentFilters.value.status || undefined
})

const getTeacherQueryParams = () => ({
  page: teacherPage.value,
  page_size: teacherPageSize.value,
  keyword: teacherFilters.value.keyword.trim() || undefined,
  department: teacherFilters.value.department.trim() || undefined,
  verification_status: teacherFilters.value.verificationStatus || undefined,
  status: teacherFilters.value.status || undefined
})

const loadStudents = async (resetPage = false) => {
  if (resetPage) {
    studentPage.value = 1
  }
  studentLoading.value = true
  try {
    const response = await adminAPI.listAdminStudents(getStudentQueryParams())
    students.value = Array.isArray(response.students) ? response.students.map(mapStudent) : []
    studentTotal.value = Number(response.total || 0)
    selectedStudents.value = []
  } catch (error) {
    ElMessage.error(`加载学生列表失败：${error}`)
  } finally {
    studentLoading.value = false
  }
}

const loadTeachers = async (resetPage = false) => {
  if (resetPage) {
    teacherPage.value = 1
  }
  teacherLoading.value = true
  try {
    const response = await adminAPI.listAdminTeachers(getTeacherQueryParams())
    teachers.value = Array.isArray(response.teachers) ? response.teachers.map(mapTeacher) : []
    teacherTotal.value = Number(response.total || 0)
    selectedTeachers.value = []
  } catch (error) {
    ElMessage.error(`加载教师列表失败：${error}`)
  } finally {
    teacherLoading.value = false
  }
}

const handleRefresh = (type) => {
  if (type === 'student') {
    studentFilters.value = { keyword: '', major: '', grade: '', status: '' }
    studentPage.value = 1
    loadStudents()
    return
  }
  teacherFilters.value = { keyword: '', department: '', verificationStatus: '', status: '' }
  teacherPage.value = 1
  loadTeachers()
}

const handleStudentSelectionChange = (selection) => {
  selectedStudents.value = selection
}

const handleTeacherSelectionChange = (selection) => {
  selectedTeachers.value = selection
}

const updateStudentStatus = async (studentIds, status) => {
  await adminAPI.batchUpdateAdminStudentsStatus({
    student_ids: studentIds,
    status
  })
}

const updateTeacherStatus = async (teacherIds, status) => {
  await adminAPI.batchUpdateAdminTeachersStatus({
    teacher_ids: teacherIds,
    status
  })
}

const handleToggleStatus = (row, type) => {
  const isDisable = row.status === '正常'
  const actionText = isDisable ? '禁用' : '启用'
  const targetStatus = isDisable ? 'disabled' : 'enabled'

  ElMessageBox.confirm(
    `确定要${actionText}用户“${row.name}”吗？`,
    `确认${actionText}`,
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      if (type === 'student') {
        await updateStudentStatus([row.studentId], targetStatus)
        await loadStudents()
      } else {
        await updateTeacherStatus([row.teacherId], targetStatus)
        await loadTeachers()
      }
      ElMessage.success(`${actionText}成功`)
    } catch (error) {
      ElMessage.error(`${actionText}失败：${error}`)
    }
  }).catch(() => {})
}

const handleBatchAction = (type, action) => {
  const selected = type === 'student' ? selectedStudents.value : selectedTeachers.value
  if (!selected.length) {
    return
  }
  const actionText = action === 'disable' ? '禁用' : '启用'
  const targetStatus = action === 'disable' ? 'disabled' : 'enabled'

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
      if (type === 'student') {
        await updateStudentStatus(selected.map(item => item.studentId), targetStatus)
        await loadStudents()
      } else {
        await updateTeacherStatus(selected.map(item => item.teacherId), targetStatus)
        await loadTeachers()
      }
      ElMessage.success(`批量${actionText}成功`)
    } catch (error) {
      ElMessage.error(`批量${actionText}失败：${error}`)
    }
  }).catch(() => {})
}

const handleViewDetail = (row, type) => {
  const detailLines = type === 'student'
    ? [
        ['姓名', row.name],
        ['学号', row.studentNumber],
        ['手机号', row.phoneNumber],
        ['邮箱', row.email],
        ['专业', row.major],
        ['年级', row.grade],
        ['编程基础', row.programmingLevel],
        ['账号状态', row.status],
        ['注册时间', row.registerTime]
      ]
    : [
        ['姓名', row.name],
        ['工号', row.employeeNumber],
        ['手机号', row.phoneNumber],
        ['学校邮箱', row.email],
        ['院系', row.department],
        ['职称', row.title],
        ['审核状态', row.auditStatus],
        ['账号状态', row.status],
        ['注册时间', row.registerTime]
      ]

  ElMessageBox.alert(
    detailLines.map(([label, value]) => `${label}：${value || '—'}`).join('\n'),
    '用户详情',
    {
      confirmButtonText: '关闭'
    }
  )
}

const handleReaudit = async (row) => {
  try {
    const approvalResponse = await adminAPI.getTeacherApproval(row.teacherId)
    if (!approvalResponse || !approvalResponse.approval) {
      ElMessage.error('未找到该教师的审核单')
      return
    }

    const approval = approvalResponse.approval
    ElMessageBox.prompt(
      `教师姓名：${row.name}\n工号：${row.employeeNumber}\n当前状态：${row.auditStatus}\n请填写审核意见：`,
      approval.approval_status === 2 ? '重新审核' : '进行审核',
      {
        confirmButtonText: '通过',
        cancelButtonText: '驳回',
        inputPlaceholder: '请输入审核意见',
        inputType: 'textarea',
        distinguishCancelAndClose: true,
        showCancelButton: true
      }
    ).then(async ({ value }) => {
      // 通过
      await adminAPI.approveTeacher(approval.approval_id, {
        approved: true,
        remark: value || '审核通过'
      })
      ElMessage.success('审核通过成功')
      await loadTeachers()
    }).catch(async (action) => {
      if (action === 'cancel') {
        // 驳回
        const { value } = await ElMessageBox.prompt(
          '请填写驳回理由：',
          '审核驳回',
          {
            confirmButtonText: '确定驳回',
            cancelButtonText: '取消',
            inputPlaceholder: '请输入驳回理由',
            inputType: 'textarea',
            inputValidator: (val) => val && val.trim() ? true : '驳回理由不能为空'
          }
        )
        await adminAPI.approveTeacher(approval.approval_id, {
          approved: false,
          remark: value
        })
        ElMessage.success('审核驳回成功')
        await loadTeachers()
      }
    })
  } catch (error) {
    ElMessage.error(`审核操作失败：${error}`)
  }
}

const handleExport = async (type) => {
  try {
    if (type === 'student') {
      const blob = await adminAPI.exportAdminStudents(getStudentQueryParams())
      downloadBlob(blob, `学生用户列表_${Date.now()}.csv`)
    } else {
      const blob = await adminAPI.exportAdminTeachers(getTeacherQueryParams())
      downloadBlob(blob, `教师用户列表_${Date.now()}.csv`)
    }
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error(`导出失败：${error}`)
  }
}

const handleStudentPageSizeChange = (size) => {
  studentPageSize.value = size
  studentPage.value = 1
  loadStudents()
}

const handleStudentPageChange = (page) => {
  studentPage.value = page
  loadStudents()
}

const handleTeacherPageSizeChange = (size) => {
  teacherPageSize.value = size
  teacherPage.value = 1
  loadTeachers()
}

const handleTeacherPageChange = (page) => {
  teacherPage.value = page
  loadTeachers()
}

onMounted(async () => {
  await Promise.all([loadStudents(), loadTeachers()])
})
</script>

<style scoped>
@import '@/styles/admin.css';

.toolbar-stack {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.toolbar-grid {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
