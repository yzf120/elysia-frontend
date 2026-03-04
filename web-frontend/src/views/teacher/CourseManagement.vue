<template>
  <div class="teacher-page course-management-page">
    <!-- 顶部导航栏 -->
    <div class="teacher-top-nav">
      <div class="nav-left">
        <el-button type="primary" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回首页
        </el-button>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>教师端</el-breadcrumb-item>
          <el-breadcrumb-item>课程章节管理</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </div>

    <!-- 主内容区 - Tab切换 -->
    <div class="teacher-card">
      <el-tabs v-model="activeTab" class="teacher-tabs">
        <!-- 章节列表Tab -->
        <el-tab-pane label="章节列表" name="chapters">
          <div class="tab-header">
            <el-button type="primary" @click="showAddChapterDialog">
              <el-icon><Plus /></el-icon>
              新增章节
            </el-button>
          </div>

          <el-tree
            :data="chapterTree"
            node-key="id"
            default-expand-all
            :expand-on-click-node="false"
            class="chapter-tree"
          >
            <template #default="{ node, data }">
              <div class="tree-node">
                <div class="node-content">
                  <el-icon v-if="data.type === 'video'" color="#409eff"><VideoPlay /></el-icon>
                  <el-icon v-else-if="data.type === 'pdf'" color="#f56c6c"><Document /></el-icon>
                  <el-icon v-else-if="data.type === 'word'" color="#67c23a"><Document /></el-icon>
                  <span class="node-label">{{ data.label }}</span>
                </div>
                <div class="node-actions">
                  <el-button type="primary" size="small" link @click="editChapter(data)">
                    编辑
                  </el-button>
                  <el-button type="danger" size="small" link @click="deleteChapter(data.id, data)">
                    删除
                  </el-button>
                </div>
              </div>
            </template>
          </el-tree>
        </el-tab-pane>

        <!-- AI教学资料生成Tab -->
        <el-tab-pane label="AI教学资料生成" name="ai-material">
          <div class="ai-section">
            <el-form :model="materialForm" label-width="100px">
              <el-form-item label="知识点">
                <el-input
                  v-model="materialForm.knowledge"
                  type="textarea"
                  :rows="5"
                  placeholder="请输入知识点，支持多个知识点，每行一个"
                />
              </el-form-item>

              <el-form-item label="生成格式">
                <el-radio-group v-model="materialForm.format">
                  <el-radio label="image">图片</el-radio>
                  <el-radio label="document">文档</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item>
                <el-button
                  type="primary"
                  :loading="generatingMaterial"
                  @click="generateMaterial"
                  class="teacher-btn-primary"
                >
                  <el-icon><MagicStick /></el-icon>
                  生成资料
                </el-button>
              </el-form-item>
            </el-form>

            <!-- 生成结果预览 -->
            <div v-if="materialResult" class="result-preview">
              <h4>生成结果预览</h4>
              <div class="preview-content">
                <div v-if="materialForm.format === 'image'" class="image-preview">
                  <el-image :src="materialResult" fit="contain" />
                </div>
                <div v-else class="document-preview">
                  <pre>{{ materialResult }}</pre>
                </div>
              </div>

              <div class="import-section">
                <el-select
                  v-model="selectedChapter"
                  placeholder="选择要导入的章节"
                  style="width: 300px; margin-right: 12px"
                >
                  <el-option
                    v-for="chapter in flatChapters"
                    :key="chapter.id"
                    :label="chapter.label"
                    :value="chapter.id"
                  />
                </el-select>
                <el-button type="success" @click="importToChapter">
                  导入对应章节
                </el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- AI出题Tab -->
        <el-tab-pane label="AI出题" name="ai-question">
          <div class="ai-section">
            <el-form :model="questionForm" label-width="100px">
              <el-form-item label="出题场景">
                <el-select v-model="questionForm.scene" placeholder="请选择出题场景" style="width: 100%">
                  <el-option label="讨论" value="讨论" />
                  <el-option label="作业" value="作业" />
                  <el-option label="考试" value="考试" />
                </el-select>
              </el-form-item>

              <el-form-item label="知识点">
                <el-input
                  v-model="questionForm.knowledge"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入知识点"
                />
              </el-form-item>

              <el-form-item label="难度">
                <el-select v-model="questionForm.difficulty" placeholder="请选择难度" style="width: 100%">
                  <el-option label="简单" value="简单" />
                  <el-option label="中等" value="中等" />
                  <el-option label="困难" value="困难" />
                </el-select>
              </el-form-item>

              <el-form-item>
                <el-button
                  type="primary"
                  :loading="generatingQuestion"
                  @click="generateQuestion"
                  class="teacher-btn-primary"
                >
                  <el-icon><MagicStick /></el-icon>
                  生成题目
                </el-button>
              </el-form-item>
            </el-form>

            <!-- 题目预览 -->
            <div v-if="questionResult" class="result-preview">
              <h4>题目预览</h4>
              <div class="question-preview">
                <div class="question-item" v-for="(q, index) in questionResult" :key="index">
                  <h5>{{ index + 1 }}. {{ q.title }}</h5>
                  <div v-if="q.options" class="question-options">
                    <div v-for="(opt, i) in q.options" :key="i">
                      {{ String.fromCharCode(65 + i) }}. {{ opt }}
                    </div>
                  </div>
                  <div class="question-answer">
                    <strong>答案：</strong>{{ q.answer }}
                  </div>
                </div>
              </div>

              <div class="publish-section">
                <el-button type="success" @click="publishToClass">
                  <el-icon><Promotion /></el-icon>
                  发布至班级
                </el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 新增/编辑章节对话框 -->
    <el-dialog
      v-model="chapterDialogVisible"
      :title="chapterDialogTitle"
      width="600px"
      class="teacher-dialog"
    >
      <el-form :model="chapterForm" label-width="100px">
        <el-form-item label="章节名称">
          <el-input v-model="chapterForm.name" placeholder="请输入章节名称" />
        </el-form-item>

        <el-form-item label="文件上传">
          <el-upload
            class="upload-demo"
            drag
            :auto-upload="false"
            :on-change="handleFileChange"
            accept=".mp4,.avi,.pdf,.doc,.docx"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持视频（mp4/avi）、文档（pdf/word）格式
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="chapterDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingChapter" @click="saveChapter">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { teacherAPI } from '@/services/index.js';

const router = useRouter();
const route = useRoute();

// 当前班级ID（从路由 query 传入）
const classId = ref(route.query.class_id || '');
// 当前教师ID
const teacherId = ref(localStorage.getItem('userId') || '');

// 当前激活的Tab
const activeTab = ref('chapters');

// 章节树数据
const chapterTree = ref([]);

// 扁平化的章节列表（用于下拉选择）
const flatChapters = computed(() => {
  const flatten = (nodes, result = []) => {
    nodes.forEach(node => {
      result.push({ id: node.id, label: node.label });
      if (node.children) {
        flatten(node.children, result);
      }
    });
    return result;
  };
  return flatten(chapterTree.value);
});

// 章节对话框
const chapterDialogVisible = ref(false);
const chapterDialogTitle = ref('新增章节');
const chapterForm = ref({
  id: null,
  name: '',
  file: null
});
const savingChapter = ref(false);

// AI教学资料生成
const materialForm = ref({
  knowledge: '',
  format: 'document'
});
const generatingMaterial = ref(false);
const materialResult = ref(null);
const selectedChapter = ref(null);

// AI出题
const questionForm = ref({
  scene: '',
  knowledge: '',
  difficulty: ''
});
const generatingQuestion = ref(false);
const questionResult = ref(null);

// 将后端章节数据映射为树形结构
const mapChaptersToTree = (chapters) => {
  return (chapters || []).map(chap => ({
    id: chap.chapter_id,
    label: chap.title,
    description: chap.description,
    sort_order: chap.sort_order,
    type: 'folder',
    children: (chap.sections || []).map(sec => ({
      id: sec.section_id,
      label: sec.title,
      description: sec.description,
      section_type: sec.section_type,
      sort_order: sec.sort_order,
      type: sec.section_type === 1 ? 'problem' : 'discussion',
      parentId: chap.chapter_id
    }))
  }));
};

// 加载章节列表
const loadChapters = async () => {
  if (!classId.value) {
    ElMessage.warning('缺少班级ID，无法加载章节');
    return;
  }
  try {
    const res = await teacherAPI.getClassChapters(classId.value);
    chapterTree.value = mapChaptersToTree(res.data?.chapters);
  } catch (error) {
    console.error('加载章节列表失败:', error);
    ElMessage.error('加载章节列表失败');
  }
};

// 显示新增章节对话框
const showAddChapterDialog = () => {
  chapterDialogTitle.value = '新增章节';
  chapterForm.value = {
    id: null,
    name: '',
    description: '',
    file: null
  };
  chapterDialogVisible.value = true;
};

// 编辑章节
const editChapter = (chapter) => {
  chapterDialogTitle.value = '编辑章节';
  chapterForm.value = {
    id: chapter.id,
    name: chapter.label,
    description: chapter.description || '',
    file: null
  };
  chapterDialogVisible.value = true;
};

// 处理文件变化
const handleFileChange = (file) => {
  chapterForm.value.file = file.raw;
};

// 保存章节
const saveChapter = async () => {
  if (!chapterForm.value.name.trim()) {
    ElMessage.warning('请输入章节名称');
    return;
  }

  try {
    savingChapter.value = true;
    if (chapterForm.value.id) {
      // 编辑章节
      await teacherAPI.updateChapter(teacherId.value, chapterForm.value.id, chapterForm.value.name, chapterForm.value.description || '');
    } else {
      // 新增章节
      await teacherAPI.createChapter(teacherId.value, classId.value, chapterForm.value.name, chapterForm.value.description || '');
    }
    ElMessage.success('保存成功');
    chapterDialogVisible.value = false;
    loadChapters();
  } catch (error) {
    console.error('保存章节失败:', error);
    ElMessage.error('保存章节失败');
  } finally {
    savingChapter.value = false;
  }
};

// 删除章节或小节
const deleteChapter = async (id, data) => {
  try {
    await ElMessageBox.confirm('确定要删除吗？删除后无法恢复！', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    if (data && data.parentId) {
      // 删除小节
      await teacherAPI.deleteSection(teacherId.value, id);
    } else {
      // 删除章节
      await teacherAPI.deleteChapter(teacherId.value, id);
    }
    ElMessage.success('删除成功');
    loadChapters();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error);
      ElMessage.error('删除失败');
    }
  }
};

// 生成教学资料
const generateMaterial = async () => {
  if (!materialForm.value.knowledge.trim()) {
    ElMessage.warning('请输入知识点');
    return;
  }

  try {
    generatingMaterial.value = true;
    // TODO: 调用AI API生成教学资料
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 模拟生成结果
    if (materialForm.value.format === 'image') {
      materialResult.value = 'https://via.placeholder.com/800x600?text=AI+Generated+Material';
    } else {
      materialResult.value = `# ${materialForm.value.knowledge}\n\n这是AI生成的教学资料内容...\n\n## 知识点详解\n\n1. 基本概念\n2. 应用场景\n3. 示例代码`;
    }

    ElMessage.success('生成成功');
  } catch (error) {
    console.error('生成教学资料失败:', error);
    ElMessage.error('生成教学资料失败');
  } finally {
    generatingMaterial.value = false;
  }
};

// 导入到章节
const importToChapter = async () => {
  if (!selectedChapter.value) {
    ElMessage.warning('请选择要导入的章节');
    return;
  }

  try {
    // TODO: 调用API导入资料到章节
    ElMessage.success('导入成功');
    loadChapters();
  } catch (error) {
    console.error('导入失败:', error);
    ElMessage.error('导入失败');
  }
};

// 生成题目
const generateQuestion = async () => {
  if (!questionForm.value.scene) {
    ElMessage.warning('请选择出题场景');
    return;
  }
  if (!questionForm.value.knowledge.trim()) {
    ElMessage.warning('请输入知识点');
    return;
  }
  if (!questionForm.value.difficulty) {
    ElMessage.warning('请选择难度');
    return;
  }

  try {
    generatingQuestion.value = true;
    // TODO: 调用AI API生成题目
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 模拟生成结果
    questionResult.value = [
      {
        title: '以下哪个是Python的正确变量命名？',
        options: ['1name', '_name', 'name-1', 'name 1'],
        answer: 'B'
      },
      {
        title: 'Python中如何定义一个列表？',
        options: ['[]', '{}', '()', '<>'],
        answer: 'A'
      }
    ];

    ElMessage.success('生成成功');
  } catch (error) {
    console.error('生成题目失败:', error);
    ElMessage.error('生成题目失败');
  } finally {
    generatingQuestion.value = false;
  }
};

// 发布到班级
const publishToClass = () => {
  router.push({
    name: 'PublishTask',
    query: {
      type: questionForm.value.scene,
      questions: JSON.stringify(questionResult.value)
    }
  });
};

// 返回首页
const goBack = () => {
  router.push({ name: 'TeacherDashboard' });
};

// 页面加载
onMounted(() => {
  loadChapters();
});
</script>

<style scoped lang="scss">
@import '@/styles/teacher.css';

.course-management-page {
  // Tab头部
  .tab-header {
    margin-bottom: 20px;
  }

  // 章节树
  .chapter-tree {
    :deep(.el-tree-node__content) {
      height: 48px;
      padding: 0 16px;
    }

    .tree-node {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-right: 16px;

      .node-content {
        display: flex;
        align-items: center;
        gap: 10px;

        .node-label {
          font-size: 15px;
          color: var(--teacher-text-primary);
        }
      }

      .node-actions {
        display: flex;
        gap: 8px;
        opacity: 0;
        transition: opacity 0.3s;
      }

      &:hover .node-actions {
        opacity: 1;
      }
    }
  }

  // AI区域
  .ai-section {
    // 结果预览
    .result-preview {
      margin-top: 32px;
      padding: 24px;
      background: var(--teacher-bg);
      border-radius: 10px;

      h4 {
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--teacher-text-primary);
      }

      .preview-content {
        margin-bottom: 20px;

        .image-preview {
          text-align: center;

          .el-image {
            max-width: 100%;
            border-radius: 8px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
          }
        }

        .document-preview {
          pre {
            background: white;
            padding: 16px;
            border-radius: 8px;
            font-size: 14px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
        }
      }

      .import-section,
      .publish-section {
        display: flex;
        align-items: center;
        padding-top: 16px;
        border-top: 1px solid var(--teacher-border);
      }
    }

    // 题目预览
    .question-preview {
      .question-item {
        background: white;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 16px;

        h5 {
          margin: 0 0 12px 0;
          font-size: 15px;
          font-weight: 600;
          color: var(--teacher-text-primary);
        }

        .question-options {
          margin-bottom: 12px;
          padding-left: 20px;

          div {
            margin-bottom: 6px;
            font-size: 14px;
            color: var(--teacher-text-primary);
          }
        }

        .question-answer {
          font-size: 14px;
          color: var(--teacher-success);
        }
      }
    }
  }
}
</style>
