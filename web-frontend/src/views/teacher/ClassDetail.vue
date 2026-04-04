<template>
  <div class="teacher-page class-detail-page">
    <!-- 顶部导航栏 -->
    <div class="teacher-top-nav">
      <div class="nav-left">
        <el-button type="primary" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回首页
        </el-button>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>教师端</el-breadcrumb-item>
          <el-breadcrumb-item>班级详情</el-breadcrumb-item>
          <el-breadcrumb-item>{{ classInfo.name }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </div>

    <!-- 班级信息卡片 -->
    <div class="teacher-card class-info-card">
      <div class="info-row">
        <div class="info-item">
          <span class="label">班级名称：</span>
          <span class="value">{{ classInfo.name }}</span>
        </div>
        <div class="info-item">
          <span class="label">授课科目：</span>
          <span class="value">{{ classInfo.subject }}</span>
        </div>
        <div class="info-item">
          <span class="label">学期：</span>
          <span class="value">{{ classInfo.semester }}</span>
        </div>
        <div class="info-item">
          <span class="label">班级验证码：</span>
          <span class="value code">{{ classInfo.code }}</span>
        </div>
      </div>
    </div>

    <!-- 主内容区 - Tab切换 -->
    <div class="teacher-card">
      <el-tabs v-model="activeTab" class="teacher-tabs">
        <!-- 班级成员Tab -->
        <el-tab-pane label="班级成员" name="members">
          <div class="tab-header">
            <el-input
              v-model="memberSearch"
              placeholder="搜索学生姓名或学号"
              style="width: 300px"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>

          <el-table :data="filteredMembers" class="teacher-table" stripe>
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="name" label="姓名" width="120" />
            <el-table-column prop="studentId" label="学号" width="150" />
            <el-table-column prop="email" label="邮箱" min-width="200" />
            <el-table-column prop="joinTime" label="加入时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.joinTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button type="danger" size="small" @click="removeMember(row.id)">
                  移除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="teacher-pagination">
            <el-pagination
              v-model:current-page="memberPage"
              :page-size="10"
              layout="prev, pager, next"
              :total="memberTotal"
            />
          </div>
        </el-tab-pane>

        <!-- 班级公告Tab -->
        <el-tab-pane label="班级公告" name="announcements">
          <!-- 发布/编辑公告区域 -->
          <div class="publish-section">
            <h4>{{ editingAnnouncementId ? '修改公告' : '发布新公告' }}</h4>
            <el-form :model="announcementForm" label-width="80px">
              <el-form-item label="公告标题">
                <el-input
                  v-model="announcementForm.title"
                  placeholder="请输入公告标题"
                  clearable
                />
              </el-form-item>
              <el-form-item label="公告内容">
                <el-input
                  v-model="announcementForm.content"
                  type="textarea"
                  :rows="5"
                  placeholder="请输入公告内容"
                />
              </el-form-item>
              <el-form-item>
                <el-button
                  type="primary"
                  :loading="publishingAnnouncement"
                  @click="publishAnnouncement"
                  class="teacher-btn-primary"
                >
                  {{ editingAnnouncementId ? '保存修改' : '发布公告' }}
                </el-button>
                <el-button v-if="editingAnnouncementId" @click="cancelEdit">取消</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 历史公告列表 -->
          <div class="history-section">
            <h4>历史公告</h4>
            <div v-if="announcementList.length === 0" class="teacher-empty">
              <el-empty description="暂无公告" />
            </div>
            <div v-else class="announcement-list">
              <el-card
                v-for="item in announcementList"
                :key="item.id"
                class="announcement-item"
                shadow="hover"
              >
                <div class="announcement-header">
                  <h3>{{ item.title }}</h3>
                  <div class="actions">
                    <el-button type="primary" size="small" link @click="editAnnouncement(item)">
                      编辑
                    </el-button>
                    <el-button type="danger" size="small" link @click="deleteAnnouncement(item.id)">
                      删除
                    </el-button>
                  </div>
                </div>
                <div class="announcement-meta">
                  <span>
                    <el-icon><Clock /></el-icon>
                    {{ formatDate(item.publish_time || item.publishTime) }}
                  </span>
                </div>
                <div class="announcement-content">
                  {{ item.content }}
                </div>
              </el-card>
            </div>
          </div>
        </el-tab-pane>

        <!-- 章节管理Tab -->
        <el-tab-pane label="章节管理" name="chapters">
          <div class="tab-header">
            <el-button type="primary" @click="openAddChapterDialog">
              <el-icon><Plus /></el-icon>
              新增章节
            </el-button>
          </div>

          <!-- 章节列表 -->
          <div v-if="chapterLoading" class="chapter-loading">
            <el-icon class="is-loading"><Loading /></el-icon> 加载中...
          </div>
          <div v-else-if="chapterList.length === 0" class="teacher-empty">
            <el-empty description="暂无章节，点击「新增章节」开始创建" />
          </div>
          <div v-else class="chapter-list">
            <el-card
              v-for="(chapter, cIdx) in chapterList"
              :key="chapter.chapter_id"
              class="chapter-card"
              shadow="hover"
            >
              <div class="chapter-header">
                <div class="chapter-title-wrap">
                  <span class="chapter-index">第{{ cIdx + 1 }}章</span>
                  <span class="chapter-title">{{ chapter.title }}</span>
                  <span v-if="chapter.description" class="chapter-desc">{{ chapter.description }}</span>
                </div>
                <div class="chapter-actions">
                  <el-button type="primary" size="small" @click="openAddSectionDialog(chapter)">
                    <el-icon><Plus /></el-icon> 新增小节
                  </el-button>
                  <el-button type="danger" size="small" @click="deleteChapter(chapter)">
                    <el-icon><Delete /></el-icon> 删除章节
                  </el-button>
                </div>
              </div>

              <!-- 小节列表 -->
              <div v-if="chapter.sections && chapter.sections.length > 0" class="section-list">
                <div
                  v-for="(section, sIdx) in chapter.sections"
                  :key="section.section_id"
                  class="section-item"
                >
                  <div class="section-left">
                    <span class="section-index">{{ sIdx + 1 }}</span>
                    <el-tag :type="section.section_type === 1 ? 'success' : section.section_type === 3 ? 'warning' : 'primary'" size="small">
                      {{ section.section_type === 1 ? '算法题' : section.section_type === 3 ? '学习资料' : '讨论' }}
                    </el-tag>
                    <span class="section-title">{{ section.title }}</span>
                    <span v-if="section.section_type === 3 && section.material_count" class="section-desc">{{ section.material_count }}份资料</span>
                    <span v-else-if="section.description" class="section-desc">{{ section.description }}</span>
                  </div>
                  <div class="section-actions">
                    <el-button type="primary" size="small" link @click="viewSectionDetail(section)">
                      <el-icon><View /></el-icon>
                    </el-button>
                    <el-button type="danger" size="small" link @click="deleteSection(section)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </div>
              </div>
              <div v-else class="section-empty">暂无小节</div>
            </el-card>
          </div>
        </el-tab-pane>

        <!-- 小节详情弹窗（教师端查看） -->
        <el-dialog
          v-model="sectionDetailVisible"
          :title="currentViewSection ? currentViewSection.title : '小节详情'"
          width="700px"
          :destroy-on-close="true"
        >
          <template v-if="currentViewSection">
            <!-- 算法题 -->
            <div v-if="currentViewSection.section_type === 1" class="section-detail-body">
              <div v-if="problemDetailLoading" style="text-align:center;padding:30px 0">
                <el-icon class="is-loading" :size="20"><Loading /></el-icon> 加载中...
              </div>
              <template v-else-if="currentProblemDetail">
                <div class="detail-row">
                  <el-tag type="success" size="small">算法题</el-tag>
                  <el-tag :type="difficultyTagType(currentProblemDetail.difficulty)" size="small" style="margin-left:6px">{{ currentProblemDetail.difficulty }}</el-tag>
                </div>
                <div v-if="currentProblemDetail.tags" class="detail-tags" style="margin-top:8px">
                  <el-tag v-for="tag in currentProblemDetail.tags.split(',').filter(Boolean)" :key="tag" plain type="primary" size="small" style="margin-right:6px">{{ tag.trim() }}</el-tag>
                </div>
                <div class="detail-desc" style="margin-top:12px">
                  <div style="font-weight:600;margin-bottom:6px">题目描述</div>
                  <div style="white-space:pre-line;line-height:1.8">{{ currentProblemDetail.description }}</div>
                </div>
                <div v-if="currentProblemDetail.input_sample" class="detail-desc" style="margin-top:12px">
                  <div style="font-weight:600;margin-bottom:6px">输入样例</div>
                  <pre style="background:#f5f7fa;padding:10px;border-radius:6px;font-size:13px;overflow-x:auto">{{ currentProblemDetail.input_sample }}</pre>
                </div>
                <div v-if="currentProblemDetail.output_sample" class="detail-desc" style="margin-top:12px">
                  <div style="font-weight:600;margin-bottom:6px">输出样例</div>
                  <pre style="background:#f5f7fa;padding:10px;border-radius:6px;font-size:13px;overflow-x:auto">{{ currentProblemDetail.output_sample }}</pre>
                </div>
                <div v-if="currentProblemDetail.hint" class="detail-desc" style="margin-top:12px">
                  <div style="font-weight:600;margin-bottom:6px">提示</div>
                  <div style="white-space:pre-line;color:#909399">{{ currentProblemDetail.hint }}</div>
                </div>
                <div v-if="currentProblemDetail.constraints" class="detail-desc" style="margin-top:12px">
                  <div style="font-weight:600;margin-bottom:6px">数据范围</div>
                  <div style="white-space:pre-line;color:#909399">{{ currentProblemDetail.constraints }}</div>
                </div>
              </template>
              <div v-else style="text-align:center;padding:20px 0;color:#909399">题目信息加载失败</div>
            </div>

            <!-- 讨论 -->
            <div v-else-if="currentViewSection.section_type === 2" class="section-detail-body">
              <div class="detail-row">
                <el-tag type="primary" size="small">讨论话题</el-tag>
              </div>
              <div class="detail-field">
                <span class="field-label">话题标题：</span>
                <span>{{ currentViewSection.discussion_title || currentViewSection.title }}</span>
              </div>
              <div v-if="currentViewSection.discussion_content" class="detail-desc">{{ currentViewSection.discussion_content }}</div>
            </div>

            <!-- 学习资料 -->
            <div v-else-if="currentViewSection.section_type === 3" class="section-detail-body">
              <div class="detail-row" style="margin-bottom:12px">
                <el-tag type="warning" size="small">学习资料</el-tag>
                <span v-if="currentViewSection.description" style="margin-left:8px;color:#909399">{{ currentViewSection.description }}</span>
              </div>

              <div v-if="teacherMaterialLoading" style="text-align:center;padding:30px 0">
                <el-icon class="is-loading" :size="20"><Loading /></el-icon> 加载中...
              </div>
              <div v-else-if="teacherMaterialList.length === 0" style="text-align:center;padding:20px 0;color:#909399">
                暂无资料
              </div>
              <div v-else class="teacher-material-list">
                <div v-for="mat in teacherMaterialList" :key="mat.material_id" class="teacher-mat-card">
                  <div class="teacher-mat-top">
                    <el-tag :type="materialTagType(mat.material_type)" size="small">{{ materialTypeLabel(mat.material_type) }}</el-tag>
                    <span class="teacher-mat-title">{{ mat.title }}</span>
                    <span v-if="mat.file_name && mat.material_type !== 'text'" class="teacher-mat-file">{{ mat.file_name }} <span style="color:#909399">({{ formatFileSize(mat.file_size) }})</span></span>
                  </div>
                  <div v-if="mat.material_type === 'text' && mat.description" class="teacher-mat-text">{{ mat.description }}</div>
                  <div class="teacher-mat-actions">
                    <el-button v-if="mat.material_type === 'pdf' || mat.material_type === 'video'" type="primary" size="small" link @click="teacherViewMaterial(mat)">
                      <el-icon><View /></el-icon> 在线查看
                    </el-button>
                    <el-button v-if="mat.material_type === 'pdf' || mat.material_type === 'word'" type="success" size="small" link @click="teacherDownloadMaterial(mat)">
                      <el-icon><Download /></el-icon> 下载
                    </el-button>
                    <el-button type="danger" size="small" link @click="teacherDeleteMaterial(mat)">
                      <el-icon><Delete /></el-icon> 删除
                    </el-button>
                  </div>
                </div>
              </div>

              <!-- 追加上传 -->
              <el-divider content-position="left">追加上传资料</el-divider>
              <div class="append-upload-row">
                <el-select v-model="appendMaterial.type" placeholder="类型" style="width:120px" size="small">
                  <el-option label="PDF" value="pdf" />
                  <el-option label="Word" value="word" />
                  <el-option label="视频" value="video" />
                  <el-option label="文字" value="text" />
                </el-select>
                <el-input v-model="appendMaterial.title" placeholder="资料标题" size="small" style="width:160px;margin:0 8px" />
                <el-upload
                  v-if="appendMaterial.type && appendMaterial.type !== 'text'"
                  :auto-upload="false"
                  :show-file-list="false"
                  :on-change="(f) => appendMaterial.file = f.raw"
                  :accept="materialAcceptMap[appendMaterial.type]"
                  style="display:inline-block"
                >
                  <el-button size="small" plain>选择文件</el-button>
                </el-upload>
                <el-input v-if="appendMaterial.type === 'text'" v-model="appendMaterial.textContent" placeholder="文字内容" size="small" type="textarea" :rows="2" style="width:200px;margin-left:8px" />
                <el-button type="primary" size="small" :loading="appendUploading" @click="doAppendUpload" style="margin-left:8px">上传</el-button>
              </div>
            </div>
          </template>

          <template #footer>
            <el-button v-if="currentViewSection && currentViewSection.section_type === 1 && currentViewSection.problem_id" type="primary" @click="goToProblemCode(currentViewSection.problem_id)">
              <el-icon><Monitor /></el-icon> 去编程调试
            </el-button>
            <el-button @click="sectionDetailVisible = false">关闭</el-button>
          </template>
        </el-dialog>

        <!-- 新增章节对话框 -->
        <el-dialog v-model="addChapterVisible" title="新增章节" width="480px" :close-on-click-modal="false">
          <el-form :model="chapterForm" label-width="80px" ref="chapterFormRef">
            <el-form-item label="章节标题" prop="title" :rules="[{ required: true, message: '请输入章节标题' }]">
              <el-input v-model="chapterForm.title" placeholder="请输入章节标题" clearable />
            </el-form-item>
            <el-form-item label="章节描述">
              <el-input v-model="chapterForm.description" type="textarea" :rows="3" placeholder="可选，填写章节描述" />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="addChapterVisible = false">取消</el-button>
            <el-button type="primary" :loading="chapterSubmitting" @click="submitAddChapter">确认新增</el-button>
          </template>
        </el-dialog>

        <!-- 新增小节对话框 -->
        <el-dialog v-model="addSectionVisible" :title="`新增小节 - ${currentChapter?.title || ''}`" width="640px" :close-on-click-modal="false">
          <!-- 选择小节类型 -->
          <div v-if="!sectionType" class="section-type-select">
            <div class="type-title">请选择小节类型</div>
            <div class="type-buttons">
              <el-card class="type-card" shadow="hover" @click="sectionType = 1">
                <el-icon size="32" color="#67c23a"><Cpu /></el-icon>
                <div class="type-name">发布算法题</div>
                <div class="type-desc">创建一道算法编程题，学生可在线提交代码</div>
              </el-card>
              <el-card class="type-card" shadow="hover" @click="sectionType = 2">
                <el-icon size="32" color="#409eff"><ChatDotRound /></el-icon>
                <div class="type-name">发布讨论</div>
                <div class="type-desc">发起一个讨论话题，学生可参与讨论</div>
              </el-card>
              <el-card class="type-card" shadow="hover" @click="sectionType = 3">
                <el-icon size="32" color="#e6a23c"><Document /></el-icon>
                <div class="type-name">发布学习资料</div>
                <div class="type-desc">上传PDF、Word、视频或文字资料供学生学习</div>
              </el-card>
            </div>
          </div>

          <!-- 算法题表单 -->
          <el-form v-if="sectionType === 1" :model="problemForm" label-width="100px" ref="problemFormRef">
            <el-form-item label="小节标题" prop="sectionTitle" :rules="[{ required: true, message: '请输入小节标题' }]">
              <el-input v-model="problemForm.sectionTitle" placeholder="小节标题（显示在章节列表中）" clearable />
            </el-form-item>
            <el-divider content-position="left">选择题目方式</el-divider>
            <!-- 选择方式 -->
            <el-form-item label="题目来源">
              <el-radio-group v-model="problemForm.sourceMode">
                <el-radio value="library">从题库选择</el-radio>
                <el-radio value="new">新建题目</el-radio>
              </el-radio-group>
            </el-form-item>

            <!-- 从题库选择 -->
            <template v-if="problemForm.sourceMode === 'library'">
              <el-form-item label="搜索题目">
                <el-input
                  v-model="problemLibrarySearch"
                  placeholder="输入题目名称搜索"
                  clearable
                  @input="searchProblemLibrary"
                >
                  <template #prefix><el-icon><Search /></el-icon></template>
                </el-input>
              </el-form-item>
              <el-form-item label="选择题目" prop="problemId" :rules="[{ required: true, message: '请选择题目' }]">
                <el-select
                  v-model="problemForm.problemId"
                  placeholder="请从题库中选择题目"
                  style="width: 100%"
                  filterable
                >
                  <el-option
                    v-for="p in problemLibraryList"
                    :key="p.problem_id"
                    :label="`[${difficultyText(p.difficulty)}] ${p.title}`"
                    :value="p.problem_id"
                  />
                </el-select>
              </el-form-item>
              <div v-if="selectedProblemInfo" class="problem-preview">
                <div class="preview-title">{{ selectedProblemInfo.title }}</div>
                <el-tag :type="difficultyTagType(selectedProblemInfo.difficulty)" size="small">{{ difficultyText(selectedProblemInfo.difficulty) }}</el-tag>
                <div class="preview-desc">{{ selectedProblemInfo.description }}</div>
              </div>
            </template>

            <!-- 新建题目 -->
            <template v-if="problemForm.sourceMode === 'new'">
              <el-form-item label="题目标题" prop="newProblemTitle" :rules="[{ required: true, message: '请输入题目标题' }]">
                <el-input v-model="problemForm.newProblemTitle" placeholder="请输入题目标题" clearable />
              </el-form-item>
              <el-form-item label="难度">
                <el-select v-model="problemForm.difficulty" placeholder="请选择难度">
                  <el-option label="简单" value="easy" />
                  <el-option label="中等" value="medium" />
                  <el-option label="困难" value="hard" />
                </el-select>
              </el-form-item>
              <el-form-item label="题目描述" prop="description" :rules="[{ required: true, message: '请输入题目描述' }]">
                <el-input v-model="problemForm.description" type="textarea" :rows="5" placeholder="请输入题目描述（支持Markdown）" />
              </el-form-item>
              <el-form-item label="输入说明">
                <el-input v-model="problemForm.inputDesc" type="textarea" :rows="2" placeholder="输入格式说明" />
              </el-form-item>
              <el-form-item label="输出说明">
                <el-input v-model="problemForm.outputDesc" type="textarea" :rows="2" placeholder="输出格式说明" />
              </el-form-item>
              <el-divider content-position="left">测试用例</el-divider>
              <div v-for="(tc, idx) in problemForm.testCases" :key="idx" class="test-case-item">
                <div class="test-case-header">
                  <span>用例 {{ idx + 1 }}</span>
                  <el-button type="danger" size="small" link @click="removeTestCase(idx)" v-if="problemForm.testCases.length > 1">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
                <el-row :gutter="12">
                  <el-col :span="12">
                    <el-form-item label="输入">
                      <el-input v-model="tc.input" type="textarea" :rows="3" placeholder="测试输入" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="期望输出">
                      <el-input v-model="tc.output" type="textarea" :rows="3" placeholder="期望输出" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>
              <el-button type="primary" plain size="small" @click="addTestCase">
                <el-icon><Plus /></el-icon> 添加测试用例
              </el-button>
            </template>
          </el-form>

          <!-- 讨论表单 -->
          <el-form v-if="sectionType === 2" :model="discussionForm" label-width="100px" ref="discussionFormRef">
            <el-form-item label="小节标题" prop="sectionTitle" :rules="[{ required: true, message: '请输入小节标题' }]">
              <el-input v-model="discussionForm.sectionTitle" placeholder="小节标题（显示在章节列表中）" clearable />
            </el-form-item>
            <el-form-item label="话题标题" prop="title" :rules="[{ required: true, message: '请输入话题标题' }]">
              <el-input v-model="discussionForm.title" placeholder="请输入讨论话题标题" clearable />
            </el-form-item>
            <el-form-item label="话题描述">
              <el-input v-model="discussionForm.content" type="textarea" :rows="5" placeholder="请输入讨论话题描述或背景" />
            </el-form-item>
          </el-form>

          <!-- 学习资料表单 -->
          <el-form v-if="sectionType === 3" :model="materialForm" label-width="100px" ref="materialFormRef">
            <el-form-item label="小节标题" prop="sectionTitle" :rules="[{ required: true, message: '请输入小节标题' }]">
              <el-input v-model="materialForm.sectionTitle" placeholder="小节标题（显示在章节列表中）" clearable />
            </el-form-item>
            <el-form-item label="资料描述">
              <el-input v-model="materialForm.description" type="textarea" :rows="3" placeholder="可选，填写资料简介或说明" />
            </el-form-item>

            <!-- 资料列表：支持多条 -->
            <el-divider content-position="left">学习资料内容</el-divider>
            <div v-for="(item, idx) in materialForm.items" :key="idx" class="material-item-card">
              <div class="material-item-header">
                <span>资料 {{ idx + 1 }}</span>
                <el-button type="danger" size="small" link @click="removeMaterialItem(idx)" v-if="materialForm.items.length > 1">
                  <el-icon><Delete /></el-icon> 移除
                </el-button>
              </div>
              <el-form-item label="资料类型" :prop="'items.' + idx + '.type'" :rules="[{ required: true, message: '请选择资料类型' }]">
                <el-select v-model="item.type" placeholder="请选择资料类型" style="width: 100%" @change="item.file = null">
                  <el-option label="PDF文档" value="pdf" />
                  <el-option label="Word文档" value="word" />
                  <el-option label="视频" value="video" />
                  <el-option label="文字内容" value="text" />
                </el-select>
              </el-form-item>
              <el-form-item label="资料标题" :prop="'items.' + idx + '.title'" :rules="[{ required: true, message: '请输入资料标题' }]">
                <el-input v-model="item.title" placeholder="请输入资料标题" clearable />
              </el-form-item>

              <!-- 文件上传（非 text 类型） -->
              <el-form-item v-if="item.type && item.type !== 'text'" label="上传文件">
                <el-upload
                  :auto-upload="false"
                  :on-change="(f) => handleMaterialFileChange(f, idx)"
                  :limit="1"
                  :accept="materialAcceptMap[item.type]"
                  :file-list="item.fileList || []"
                  @remove="item.file = null; item.fileList = []"
                >
                  <el-button type="primary" plain size="small">
                    <el-icon><UploadFilled /></el-icon> 选择文件
                  </el-button>
                  <template #tip>
                    <div class="el-upload__tip">
                      {{ materialTipMap[item.type] || '请选择文件' }}
                    </div>
                  </template>
                </el-upload>
              </el-form-item>

              <!-- 文字内容（text 类型） -->
              <el-form-item v-if="item.type === 'text'" label="文字内容">
                <el-input v-model="item.textContent" type="textarea" :rows="6" placeholder="请输入学习资料文字内容" />
              </el-form-item>
            </div>

            <el-button type="primary" plain size="small" @click="addMaterialItem" style="margin-top: 8px">
              <el-icon><Plus /></el-icon> 添加更多资料
            </el-button>
          </el-form>

          <template #footer>
            <el-button @click="cancelAddSection">取消</el-button>
            <el-button v-if="sectionType" @click="sectionType = null">上一步</el-button>
            <el-button v-if="sectionType" type="primary" :loading="sectionSubmitting" @click="submitAddSection">确认发布</el-button>
          </template>
        </el-dialog>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { teacherAPI, problemAPI } from '@/services/index';

const router = useRouter();
const route = useRoute();

// 当前激活的Tab
const activeTab = ref('members');

// 班级信息
const classInfo = ref({
  id: '',
  name: '',
  subject: '',
  semester: '',
  code: ''
});

// 班级成员相关
const memberList = ref([]);
const memberSearch = ref('');
const memberPage = ref(1);
const memberTotal = ref(0);

// 过滤后的成员列表
const filteredMembers = computed(() => {
  if (!memberSearch.value) return memberList.value;
  return memberList.value.filter(m =>
    m.name.includes(memberSearch.value) || m.studentId.includes(memberSearch.value)
  );
});

// 公告相关
const announcementForm = ref({
  title: '',
  content: ''
});
const publishingAnnouncement = ref(false);
const announcementList = ref([]);
const editingAnnouncementId = ref(''); // 正在编辑的公告ID，空字符串表示新增

// ==================== 章节管理 ====================
const chapterList = ref([]);
const chapterLoading = ref(false);

// 新增章节
const addChapterVisible = ref(false);
const chapterSubmitting = ref(false);
const chapterFormRef = ref(null);
const chapterForm = ref({ title: '', description: '' });

// 新增小节
const addSectionVisible = ref(false);
const sectionSubmitting = ref(false);
const currentChapter = ref(null);
const sectionType = ref(null); // null=选择类型, 1=算法题, 2=讨论

// 算法题表单
const problemFormRef = ref(null);
const problemForm = ref({
  sectionTitle: '',
  sourceMode: 'library', // 'library' 从题库选 | 'new' 新建题目
  problemId: '',         // 从题库选时使用
  newProblemTitle: '',   // 新建题目时使用
  difficulty: 'medium',
  description: '',
  inputDesc: '',
  outputDesc: '',
  testCases: [{ input: '', output: '' }]
});

// 题库搜索
const problemLibrarySearch = ref('');
const problemLibraryList = ref([]);
const selectedProblemInfo = computed(() => {
  if (!problemForm.value.problemId) return null;
  return problemLibraryList.value.find(p => p.problem_id === problemForm.value.problemId) || null;
});

// 难度文本/标签类型
const difficultyText = (d) => ({ easy: '简单', medium: '中等', hard: '困难', '简单': '简单', '中等': '中等', '困难': '困难' }[d] || d);
const difficultyTagType = (d) => ({ easy: 'success', medium: 'warning', hard: 'danger', '简单': 'success', '中等': 'warning', '困难': 'danger' }[d] || 'info');

// 选择「发布算法题」类型时才加载题库
watch(sectionType, (val) => {
  if (val === 1 && problemForm.value.sourceMode === 'library') {
    searchProblemLibrary();
  }
});

// 切换来源模式时，若切换到「从题库选择」则加载题库
watch(() => problemForm.value.sourceMode, (val) => {
  if (sectionType.value === 1 && val === 'library' && problemLibraryList.value.length === 0) {
    searchProblemLibrary();
  }
});

// 搜索题库（调用后端接口）
const searchProblemLibrary = async () => {
  try {
    const res = await problemAPI.listProblems(problemLibrarySearch.value, '', 1, 50);
    const list = res.problems || [];
    problemLibraryList.value = list.map(p => ({
      problem_id: String(p.id),
      title: p.title,
      difficulty: difficultyValueMap(p.difficulty),
      tags: p.tags
    }));
  } catch (error) {
    console.error('搜索题库失败:', error);
    ElMessage.error('搜索题库失败');
  }
};

// 难度中文转value映射
const difficultyValueMap = (d) => ({ '简单': 'easy', '中等': 'medium', '困难': 'hard' }[d] || d);

// 讨论表单
const discussionFormRef = ref(null);
const discussionForm = ref({
  sectionTitle: '',
  title: '',
  content: ''
});

// 学习资料表单
const materialFormRef = ref(null);
const materialForm = ref({
  sectionTitle: '',
  description: '',
  items: [{ type: '', title: '', file: null, fileList: [], textContent: '' }]
});

// 资料文件类型映射
const materialAcceptMap = {
  pdf: '.pdf',
  word: '.doc,.docx',
  video: '.mp4,.avi,.mkv,.mov,.webm'
};
const materialTipMap = {
  pdf: '支持 PDF 格式，最大200MB',
  word: '支持 DOC/DOCX 格式，最大200MB',
  video: '支持 MP4/AVI/MKV/MOV/WEBM 格式，最大200MB'
};

// 添加资料项
const addMaterialItem = () => {
  materialForm.value.items.push({ type: '', title: '', file: null, fileList: [], textContent: '' });
};

// 移除资料项
const removeMaterialItem = (idx) => {
  materialForm.value.items.splice(idx, 1);
};

// 处理资料文件选择
const handleMaterialFileChange = (fileInfo, idx) => {
  materialForm.value.items[idx].file = fileInfo.raw;
  materialForm.value.items[idx].fileList = [fileInfo];
};

// ==================== 小节详情查看（教师端） ====================
const sectionDetailVisible = ref(false);
const currentViewSection = ref(null);
const teacherMaterialList = ref([]);
const teacherMaterialLoading = ref(false);
const appendMaterial = ref({ type: '', title: '', file: null, textContent: '' });
const appendUploading = ref(false);

// 辅助函数
const materialTypeLabel = (type) => ({
  pdf: 'PDF文档', word: 'Word文档', video: '视频', text: '文字内容'
}[type] || type);

const materialTagType = (type) => ({
  pdf: 'danger', word: 'primary', video: 'warning', text: 'info'
}[type] || 'info');

const formatFileSize = (size) => {
  if (!size) return '';
  if (size < 1024) return size + 'B';
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + 'KB';
  return (size / (1024 * 1024)).toFixed(1) + 'MB';
};

const problemDetailLoading = ref(false);
const currentProblemDetail = ref(null);

// 打开小节详情弹窗
const viewSectionDetail = async (section) => {
  currentViewSection.value = section;
  currentProblemDetail.value = null;
  sectionDetailVisible.value = true;
  if (section.section_type === 1 && section.problem_id) {
    problemDetailLoading.value = true;
    try {
      const res = await problemAPI.getProblem(section.problem_id);
      currentProblemDetail.value = res?.problem || null;
    } catch (e) {
      currentProblemDetail.value = null;
    } finally {
      problemDetailLoading.value = false;
    }
  } else if (section.section_type === 3) {
    await loadTeacherMaterials(section.section_id);
  }
};

// 加载教师端资料列表
const loadTeacherMaterials = async (sectionId) => {
  teacherMaterialLoading.value = true;
  try {
    const res = await teacherAPI.getMaterials(sectionId);
    teacherMaterialList.value = res.data?.materials || res.materials || [];
  } catch (e) {
    teacherMaterialList.value = [];
  } finally {
    teacherMaterialLoading.value = false;
  }
};

// 教师查看资料
const teacherViewMaterial = async (mat) => {
  if (mat.material_type === 'word') {
    ElMessage.info('Word 文档不支持在线预览，已开始下载');
    teacherDownloadMaterial(mat);
    return;
  }
  try {
    const token = localStorage.getItem('token');
    const url = `http://localhost:8001/api/material/file/${mat.material_id}/view`;
    const resp = await fetch(url, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
    if (!resp.ok) { ElMessage.error('查看失败'); return; }
    const blob = await resp.blob();
    const objectUrl = URL.createObjectURL(blob);
    window.open(objectUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(objectUrl), 120 * 1000);
  } catch (e) {
    ElMessage.error('查看资料失败');
  }
};

// 教师下载资料
const teacherDownloadMaterial = async (mat) => {
  try {
    const token = localStorage.getItem('token');
    const url = `http://localhost:8001/api/material/file/${mat.material_id}/download`;
    const resp = await fetch(url, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
    if (!resp.ok) { ElMessage.error('下载失败'); return; }
    const blob = await resp.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = mat.file_name || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60 * 1000);
  } catch (e) {
    ElMessage.error('下载资料失败');
  }
};

// 教师删除单条资料
const teacherDeleteMaterial = async (mat) => {
  try {
    await ElMessageBox.confirm(`确定删除资料「${mat.title}」？`, '确认删除', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    });
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const tid = userInfo.teacher_id || userInfo.id || '';
    await teacherAPI.deleteMaterial(tid, mat.material_id);
    ElMessage.success('删除成功');
    loadTeacherMaterials(currentViewSection.value.section_id);
    loadChapters();
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败');
  }
};

// 教师追加上传资料
const doAppendUpload = async () => {
  if (!appendMaterial.value.type) { ElMessage.warning('请选择资料类型'); return; }
  if (!appendMaterial.value.title.trim()) { ElMessage.warning('请输入资料标题'); return; }
  if (appendMaterial.value.type !== 'text' && !appendMaterial.value.file) { ElMessage.warning('请选择文件'); return; }

  appendUploading.value = true;
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const tid = userInfo.teacher_id || userInfo.id || '';
    const formData = new FormData();
    formData.append('teacher_id', tid);
    formData.append('section_id', currentViewSection.value.section_id);
    formData.append('title', appendMaterial.value.title);
    formData.append('material_type', appendMaterial.value.type);
    if (appendMaterial.value.type === 'text') {
      formData.append('description', appendMaterial.value.textContent || '');
    } else {
      formData.append('description', '');
      formData.append('file', appendMaterial.value.file);
    }
    await teacherAPI.uploadMaterial(formData);
    ElMessage.success('上传成功');
    appendMaterial.value = { type: '', title: '', file: null, textContent: '' };
    loadTeacherMaterials(currentViewSection.value.section_id);
    loadChapters();
  } catch (e) {
    ElMessage.error('上传失败');
  } finally {
    appendUploading.value = false;
  }
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 加载班级信息
const loadClassInfo = async () => {
  try {
    const classId = route.params.id || route.params.classId;
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    const res = await teacherAPI.getTeacherClasses(teacherId);
    const classes = res.classes || [];
    const found = classes.find(c => String(c.class_id) === String(classId));
    if (found) {
      classInfo.value = {
        id: found.class_id,
        name: found.class_name,
        subject: found.subject || found.subject_name,
        semester: found.semester,
        code: found.class_code
      };
    }
  } catch (error) {
    console.error('加载班级信息失败:', error);
    ElMessage.error('加载班级信息失败');
  }
};

// 加载班级成员
const loadMembers = async () => {
  try {
    const classId = route.params.id || route.params.classId;
    const res = await teacherAPI.getClassMembers(classId, memberPage.value, 50);
    memberList.value = (res.members || []).map(m => ({
      id: m.student_id,
      name: m.student_name || m.student_id,
      studentId: m.student_number || m.student_id,
      email: m.email || '',
      joinTime: m.join_time
    }));
    memberTotal.value = res.total || memberList.value.length;
  } catch (error) {
    console.error('加载班级成员失败:', error);
    ElMessage.error('加载班级成员失败');
  }
};

// 移除成员
const removeMember = async (memberId) => {
  try {
    await ElMessageBox.confirm('确定要移除该学生吗？', '确认移除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    await teacherAPI.removeStudent(teacherId, route.params.id || route.params.classId, memberId);
    ElMessage.success('移除成功');
    loadMembers();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('移除成员失败:', error);
      ElMessage.error('移除成员失败');
    }
  }
};

// 加载公告列表
const loadAnnouncements = async () => {
  try {
    const classId = route.params.id || route.params.classId;
    const res = await teacherAPI.getAnnouncements(classId);
    announcementList.value = res.data?.announcements || res.announcements || [];
  } catch (error) {
    console.error('加载公告列表失败:', error);
  }
};

// 发布/更新公告
const publishAnnouncement = async () => {
  if (!announcementForm.value.title.trim()) {
    ElMessage.warning('请输入公告标题');
    return;
  }
  if (!announcementForm.value.content.trim()) {
    ElMessage.warning('请输入公告内容');
    return;
  }
  try {
    publishingAnnouncement.value = true;
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    const classId = route.params.id || route.params.classId;
    const isEditing = !!editingAnnouncementId.value;
    // 如果是编辑模式，先删除旧公告
    if (isEditing) {
      await teacherAPI.deleteAnnouncement(teacherId, classId, editingAnnouncementId.value);
    }
    await teacherAPI.publishAnnouncement(teacherId, classId, announcementForm.value.title, announcementForm.value.content);
    ElMessage.success(isEditing ? '修改成功' : '发布成功');
    announcementForm.value.title = '';
    announcementForm.value.content = '';
    editingAnnouncementId.value = '';
    loadAnnouncements();
  } catch (error) {
    ElMessage.error('操作失败');
  } finally {
    publishingAnnouncement.value = false;
  }
};

// 编辑公告（填入表单，进入编辑模式）
const editAnnouncement = (announcement) => {
  announcementForm.value.title = announcement.title;
  announcementForm.value.content = announcement.content;
  editingAnnouncementId.value = announcement.id;
  ElMessage.info('请修改后点击「保存修改」');
};

// 取消编辑
const cancelEdit = () => {
  announcementForm.value.title = '';
  announcementForm.value.content = '';
  editingAnnouncementId.value = '';
};

// 删除公告
const deleteAnnouncement = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除该公告吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    const classId = route.params.id || route.params.classId;
    await teacherAPI.deleteAnnouncement(teacherId, classId, id);
    ElMessage.success('删除成功');
    loadAnnouncements();
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除公告失败');
  }
};

// ==================== 章节管理方法 ====================

// 加载章节列表
const loadChapters = async () => {
  chapterLoading.value = true;
  try {
    const classId = route.params.id || route.params.classId;
    const res = await teacherAPI.getClassChapters(classId);
    chapterList.value = res.data?.chapters || res.chapters || [];
  } catch (error) {
    console.error('加载章节失败:', error);
    ElMessage.error('加载章节失败');
  } finally {
    chapterLoading.value = false;
  }
};

// 打开新增章节对话框
const openAddChapterDialog = () => {
  chapterForm.value = { title: '', description: '' };
  addChapterVisible.value = true;
};

// 提交新增章节
const submitAddChapter = async () => {
  if (!chapterFormRef.value) return;
  await chapterFormRef.value.validate(async (valid) => {
    if (!valid) return;
    chapterSubmitting.value = true;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const teacherId = userInfo.teacher_id || userInfo.id || '';
      await teacherAPI.createChapter(teacherId, route.params.id || route.params.classId, chapterForm.value.title, chapterForm.value.description);
      ElMessage.success('章节创建成功');
      addChapterVisible.value = false;
      loadChapters();
    } catch (error) {
      ElMessage.error('创建章节失败');
    } finally {
      chapterSubmitting.value = false;
    }
  });
};

// 删除章节
const deleteChapter = async (chapter) => {
  try {
    await ElMessageBox.confirm(`确定要删除章节「${chapter.title}」吗？删除后其下所有小节也将被删除！`, '确认删除', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    });
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    await teacherAPI.deleteChapter(teacherId, chapter.chapter_id);
    ElMessage.success('章节删除成功');
    loadChapters();
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除章节失败');
  }
};

// 打开新增小节对话框
const openAddSectionDialog = (chapter) => {
  currentChapter.value = chapter;
  sectionType.value = null;
  problemForm.value = {
    sectionTitle: '',
    sourceMode: 'library',
    problemId: '',
    newProblemTitle: '',
    difficulty: 'medium',
    description: '',
    inputDesc: '',
    outputDesc: '',
    testCases: [{ input: '', output: '' }]
  };
  problemLibrarySearch.value = '';
  problemLibraryList.value = [];
  discussionForm.value = { sectionTitle: '', title: '', content: '' };
  materialForm.value = { sectionTitle: '', description: '', items: [{ type: '', title: '', file: null, fileList: [], textContent: '' }] };
  addSectionVisible.value = true;
};

// 取消新增小节
const cancelAddSection = () => {
  addSectionVisible.value = false;
  sectionType.value = null;
};

// 添加测试用例
const addTestCase = () => {
  problemForm.value.testCases.push({ input: '', output: '' });
};

// 移除测试用例
const removeTestCase = (idx) => {
  problemForm.value.testCases.splice(idx, 1);
};

// 提交新增小节
const submitAddSection = async () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const teacherId = userInfo.teacher_id || userInfo.id || '';
  const chapterId = currentChapter.value.chapter_id;

  sectionSubmitting.value = true;
  try {
    if (sectionType.value === 1) {
      // 算法题
      if (!problemFormRef.value) return;
      const valid = await problemFormRef.value.validate().catch(() => false);
      if (!valid) { sectionSubmitting.value = false; return; }

      let problemId = '';
      if (problemForm.value.sourceMode === 'library') {
        // 从题库选择
        if (!problemForm.value.problemId) {
          ElMessage.warning('请从题库中选择一道题目');
          sectionSubmitting.value = false;
          return;
        }
        problemId = problemForm.value.problemId;
      } else {
        // 新建题目：TODO 先调用题库创建接口，获取 problem_id
        // 暂时用标题生成临时ID，实际应接入题库创建API
        if (!problemForm.value.newProblemTitle.trim()) {
          ElMessage.warning('请输入题目标题');
          sectionSubmitting.value = false;
          return;
        }
        // TODO: const res = await problemAPI.createProblem({...}); problemId = res.problem_id;
        problemId = `prob_${Date.now()}`; // 临时占位，待题库接口接入后替换
        ElMessage.info('新建题目功能待题库接口接入，当前使用临时ID');
      }

      await teacherAPI.createSection(teacherId, chapterId, {
        title: problemForm.value.sectionTitle,
        section_type: 1,
        problem_id: problemId
      });
      ElMessage.success('算法题小节创建成功');
    } else if (sectionType.value === 2) {
      // 讨论
      if (!discussionFormRef.value) return;
      const valid = await discussionFormRef.value.validate().catch(() => false);
      if (!valid) { sectionSubmitting.value = false; return; }

      await teacherAPI.createSection(teacherId, chapterId, {
        title: discussionForm.value.sectionTitle,
        section_type: 2,
        discussion_title: discussionForm.value.title,
        discussion_content: discussionForm.value.content
      });
      ElMessage.success('讨论小节创建成功');
    } else if (sectionType.value === 3) {
      // 学习资料
      if (!materialFormRef.value) return;
      if (!materialForm.value.sectionTitle.trim()) {
        ElMessage.warning('请输入小节标题');
        sectionSubmitting.value = false;
        return;
      }
      // 校验每条资料
      for (const item of materialForm.value.items) {
        if (!item.type) { ElMessage.warning('请选择资料类型'); sectionSubmitting.value = false; return; }
        if (!item.title.trim()) { ElMessage.warning('请输入资料标题'); sectionSubmitting.value = false; return; }
        if (item.type !== 'text' && !item.file) { ElMessage.warning(`资料「${item.title}」需要上传文件`); sectionSubmitting.value = false; return; }
      }

      // 先创建 section_type=3 的小节
      await teacherAPI.createSection(teacherId, chapterId, {
        title: materialForm.value.sectionTitle,
        description: materialForm.value.description,
        section_type: 3
      });
      // 获取最新创建的小节ID
      const chapRes = await teacherAPI.getClassChapters(route.params.id || route.params.classId);
      const chaps = chapRes.data?.chapters || chapRes.chapters || [];
      const curChap = chaps.find(c => c.chapter_id === chapterId);
      const newSection = curChap?.sections?.find(s => s.title === materialForm.value.sectionTitle && s.section_type === 3);
      if (!newSection) {
        ElMessage.error('小节创建成功，但未找到新小节ID，请手动上传资料');
        sectionSubmitting.value = false;
        addSectionVisible.value = false;
        loadChapters();
        return;
      }
      const newSectionId = newSection.section_id;

      // 逐条上传学习资料
      for (const item of materialForm.value.items) {
        const formData = new FormData();
        formData.append('teacher_id', teacherId);
        formData.append('section_id', newSectionId);
        formData.append('title', item.title);
        formData.append('material_type', item.type);
        if (item.type === 'text') {
          formData.append('description', item.textContent || '');
        } else {
          formData.append('description', '');
          formData.append('file', item.file);
        }
        await teacherAPI.uploadMaterial(formData);
      }
      ElMessage.success('学习资料小节创建成功');
    }
    addSectionVisible.value = false;
    sectionType.value = null;
    loadChapters();
  } catch (error) {
    ElMessage.error('创建小节失败');
  } finally {
    sectionSubmitting.value = false;
  }
};

// 删除小节
const deleteSection = async (section) => {
  try {
    await ElMessageBox.confirm(`确定要删除小节「${section.title}」吗？`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const teacherId = userInfo.teacher_id || userInfo.id || '';
    await teacherAPI.deleteSection(teacherId, section.section_id);
    ElMessage.success('小节删除成功');
    loadChapters();
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除小节失败');
  }
};

// 返回首页
const goBack = () => {
  router.push({ name: 'TeacherDashboard' });
};

// 跳转到教师编程调试页面
const goToProblemCode = (problemId) => {
  const classId = route.params.id || route.params.classId;
  sectionDetailVisible.value = false;
  router.push({
    name: 'TeacherProblemCode',
    params: { problemId },
    query: { from: 'chapters', classId }
  });
};

// 页面加载
onMounted(() => {
  loadClassInfo();
  loadMembers();
  loadAnnouncements();
  loadChapters();
  // 如果是从编程页返回，自动切换到章节管理 Tab
  if (route.query.tab === 'chapters') {
    activeTab.value = 'chapters';
  }
});
</script>

<style scoped lang="scss">
@import '@/styles/teacher.css';

.class-detail-page {
  // 班级信息卡片
  .class-info-card {
    .info-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;

      .info-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .label {
          font-size: 14px;
          color: var(--teacher-text-secondary);
          font-weight: 500;
        }

        .value {
          font-size: 15px;
          color: var(--teacher-text-primary);
          font-weight: 600;

          &.code {
            color: var(--teacher-primary);
            font-size: 18px;
            font-family: 'Courier New', monospace;
          }
        }
      }
    }
  }

  // Tab头部
  .tab-header {
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .task-buttons {
      display: flex;
      gap: 12px;
    }
  }

  // 发布区域
  .publish-section {
    background: var(--teacher-bg);
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 24px;

    h4 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--teacher-text-primary);
    }
  }

  // 历史区域
  .history-section {
    h4 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--teacher-text-primary);
    }

    .announcement-list {
      display: flex;
      flex-direction: column;
      gap: 16px;

      .announcement-item {
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
        }

        .announcement-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: var(--teacher-text-primary);
          }

          .actions {
            display: flex;
            gap: 8px;
          }
        }

        .announcement-meta {
          display: flex;
          gap: 20px;
          margin-bottom: 12px;
          font-size: 13px;
          color: var(--teacher-text-secondary);

          span {
            display: flex;
            align-items: center;
            gap: 5px;
          }
        }

        .announcement-content {
          font-size: 14px;
          color: var(--teacher-text-primary);
          line-height: 1.6;
        }
      }
    }
  }

  // 文本颜色
  .text-success {
    color: var(--teacher-success);
    font-weight: 600;
  }

  // 章节加载
  .chapter-loading {
    padding: 40px;
    text-align: center;
    color: var(--teacher-text-secondary);
    font-size: 14px;
  }

  // 章节列表
  .chapter-list {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .chapter-card {
      border-radius: 10px;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
      }

      .chapter-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;

        .chapter-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;

          .chapter-index {
            background: var(--teacher-primary);
            color: #fff;
            font-size: 12px;
            font-weight: 600;
            padding: 2px 8px;
            border-radius: 4px;
            white-space: nowrap;
          }

          .chapter-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--teacher-text-primary);
          }

          .chapter-desc {
            font-size: 13px;
            color: var(--teacher-text-secondary);
          }
        }

        .chapter-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }
      }

      // 小节列表
      .section-list {
        border-top: 1px solid var(--teacher-border);
        padding-top: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;

        .section-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: var(--teacher-bg);
          border-radius: 8px;
          transition: background 0.2s;

          &:hover {
            background: #f0f4ff;
          }

          .section-left {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1;

            .section-index {
              font-size: 12px;
              color: var(--teacher-text-secondary);
              min-width: 20px;
            }

            .section-title {
              font-size: 14px;
              color: var(--teacher-text-primary);
              font-weight: 500;
            }

            .section-desc {
              font-size: 12px;
              color: var(--teacher-text-secondary);
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              max-width: 300px;
            }
          }
        }
      }

      .section-empty {
        border-top: 1px solid var(--teacher-border);
        padding-top: 12px;
        font-size: 13px;
        color: var(--teacher-text-secondary);
        text-align: center;
      }
    }
  }

  // 小节类型选择
  .section-type-select {
    padding: 10px 0;

    .type-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--teacher-text-primary);
      margin-bottom: 20px;
      text-align: center;
    }

    .type-buttons {
      display: flex;
      gap: 20px;
      justify-content: center;

      .type-card {
        width: 200px;
        cursor: pointer;
        text-align: center;
        padding: 20px;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-4px);
          border-color: var(--teacher-primary);
        }

        .type-name {
          font-size: 15px;
          font-weight: 600;
          color: var(--teacher-text-primary);
          margin: 12px 0 8px;
        }

        .type-desc {
          font-size: 12px;
          color: var(--teacher-text-secondary);
          line-height: 1.5;
        }
      }
    }
  }

  // 测试用例
  .test-case-item {
    background: var(--teacher-bg);
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 12px;

    .test-case-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      font-size: 13px;
      font-weight: 600;
      color: var(--teacher-text-secondary);
    }
  }

  // 学习资料项
  .material-item-card {
    background: var(--teacher-bg);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
    border: 1px solid var(--teacher-border);

    .material-item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-size: 14px;
      font-weight: 600;
      color: var(--teacher-text-primary);
    }
  }

  // 小节操作按钮
  .section-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }

  // 小节详情弹窗
  .section-detail-body {
    .detail-row {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }
    .detail-field {
      margin: 8px 0;
      font-size: 14px;
      .field-label { color: var(--teacher-text-secondary); font-weight: 500; }
    }
    .detail-desc {
      margin-top: 8px;
      font-size: 14px;
      color: var(--teacher-text-primary);
      line-height: 1.7;
      white-space: pre-line;
      background: var(--teacher-bg);
      padding: 12px;
      border-radius: 8px;
    }
  }

  // 教师端资料列表
  .teacher-material-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .teacher-mat-card {
    border: 1px solid var(--teacher-border);
    border-radius: 8px;
    padding: 12px 14px;
  }
  .teacher-mat-top {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .teacher-mat-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--teacher-text-primary);
  }
  .teacher-mat-file {
    font-size: 13px;
    color: var(--teacher-text-secondary);
  }
  .teacher-mat-text {
    margin-top: 8px;
    font-size: 13px;
    color: var(--teacher-text-primary);
    line-height: 1.7;
    white-space: pre-line;
    background: var(--teacher-bg);
    padding: 10px;
    border-radius: 6px;
  }
  .teacher-mat-actions {
    margin-top: 8px;
    display: flex;
    gap: 8px;
  }

  // 追加上传
  .append-upload-row {
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 8px;
  }

  // 题目预览
  .problem-preview {
    background: var(--teacher-bg);
    border-radius: 8px;
    padding: 12px 16px;
    margin-top: 8px;
    border-left: 3px solid var(--teacher-primary);

    .preview-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--teacher-text-primary);
      margin-bottom: 6px;
    }

    .preview-desc {
      font-size: 13px;
      color: var(--teacher-text-secondary);
      margin-top: 6px;
      line-height: 1.6;
    }
  }
}

// 响应式
@media (max-width: 768px) {
  .class-info-card .info-row {
    grid-template-columns: 1fr !important;
  }

  .tab-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start !important;
  }

  .type-buttons {
    flex-direction: column;
  }
}
</style>
