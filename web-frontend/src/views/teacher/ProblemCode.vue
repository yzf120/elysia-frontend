<template>
  <div class="problem-code-page">

    <!-- 顶部导航栏 -->
    <div class="top-nav">
      <el-button size="small" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <div class="nav-title">
        <el-tag :type="difficultyType(problem.difficulty)" size="small">
          {{ difficultyLabel(problem.difficulty) }}
        </el-tag>
        <span class="nav-problem-title">{{ problem.title }}</span>
      </div>
      <div class="nav-meta">
        <span class="meta-item"><el-icon><Timer /></el-icon> {{ problem.timeLimit }}ms</span>
        <span class="meta-item"><el-icon><Coin /></el-icon> {{ problem.memoryLimit }}MB</span>
      </div>
    </div>

    <!-- 主体：左右分栏 -->
    <div class="main-layout">

      <!-- ===== 左侧：题目详情 + 运行记录 ===== -->
      <div class="left-panel" :style="{ width: leftWidth + 'px' }">
        <!-- 左侧 Tab 切换 -->
        <div class="left-tabs">
          <div
            class="left-tab-item"
            :class="{ active: leftTab === 'problem' }"
            @click="leftTab = 'problem'"
          >题目描述</div>
          <div
            class="left-tab-item"
            :class="{ active: leftTab === 'records' }"
            @click="leftTab = 'records'"
          >运行记录</div>
        </div>

      <!-- 题目描述内容 -->
        <div v-show="leftTab === 'problem'" class="left-scroll">

          <!-- 加载状态 -->
          <div v-if="problemLoading" style="text-align:center;padding:60px 0;">
            <el-icon class="is-loading" :size="24"><Loading /></el-icon>
            <div style="margin-top:8px;color:#909399;font-size:14px;">题目加载中...</div>
          </div>

          <!-- 加载失败 -->
          <div v-else-if="problemLoadError" style="text-align:center;padding:40px 16px;color:#f56c6c;">
            {{ problemLoadError }}
          </div>

          <!-- 题目内容 -->
          <template v-else>

          <!-- 题目头部 -->
          <div class="problem-header">
            <div class="problem-title-text" style="display:flex;align-items:center;justify-content:space-between">
              <span>{{ problem.title }}</span>
              <el-button type="primary" size="small" plain @click="openEditProblemDialog" style="margin-left:12px;flex-shrink:0">
                <el-icon><Edit /></el-icon> 编辑题目
              </el-button>
            </div>
            <div class="problem-meta-row">
              <el-tag :type="difficultyType(problem.difficulty)" size="default">
                {{ difficultyLabel(problem.difficulty) }}
              </el-tag>
              <span class="meta-chip">
                <el-icon><Timer /></el-icon> 时间限制：{{ problem.timeLimit }}ms
              </span>
              <span class="meta-chip">
                <el-icon><Coin /></el-icon> 内存限制：{{ problem.memoryLimit }}MB
              </span>
            </div>
            <div class="problem-tags-row">
              <el-tag
                v-for="tag in problem.tags"
                :key="tag"
                plain
                type="primary"
                size="small"
                style="margin-right:6px;margin-bottom:4px"
              >{{ tag }}</el-tag>
            </div>
          </div>

          <!-- 题目描述 -->
          <div class="detail-section">
            <div class="detail-section-title">📝 题目描述</div>
            <div class="detail-section-content" v-html="problem.description"></div>
          </div>

          <!-- 输入格式 -->
          <div class="detail-section">
            <div class="detail-section-title">📥 输入格式</div>
            <div class="detail-section-content">{{ problem.inputFormat }}</div>
          </div>

          <!-- 输出格式 -->
          <div class="detail-section">
            <div class="detail-section-title">📤 输出格式</div>
            <div class="detail-section-content">{{ problem.outputFormat }}</div>
          </div>

          <!-- 输入输出样例 -->
          <div class="detail-section">
            <div class="detail-section-title">💡 输入输出样例</div>
            <div
              v-for="(sample, idx) in problem.samples"
              :key="idx"
              class="sample-block"
            >
              <div class="sample-row">
                <div class="sample-col">
                  <div class="sample-label">输入 {{ idx + 1 }}</div>
                  <pre class="sample-code">{{ sample.input }}</pre>
                </div>
                <div class="sample-col">
                  <div class="sample-label">输出 {{ idx + 1 }}</div>
                  <pre class="sample-code">{{ sample.output }}</pre>
                </div>
              </div>
              <div v-if="sample.explanation" class="sample-explanation">
                <el-icon><InfoFilled /></el-icon> 说明：{{ sample.explanation }}
              </div>
            </div>
          </div>

          <!-- 提示 -->
          <div v-if="problem.hint" class="detail-section">
            <div class="detail-section-title">🔔 提示</div>
            <el-alert :title="problem.hint" type="info" :closable="false" show-icon />
          </div>

          </template>

        </div>
        <div v-show="leftTab === 'records'" class="left-scroll records-panel">
          <div v-if="runRecords.length === 0" class="records-empty">
            <div class="records-empty-icon">📋</div>
            <div class="records-empty-text">暂无运行记录</div>
            <div class="records-empty-hint">点击「运行」按钮后，结果将显示在这里</div>
          </div>
          <div
            v-for="(record, idx) in runRecords"
            :key="record.id"
            class="record-item"
            :class="'status-' + record.statusKey"
          >
            <div class="record-item-header">
              <div class="record-status-row">
                <span class="record-index">#{{ runRecords.length - idx }}</span>
                <el-tag :type="record.tagType" size="small" class="record-status-tag">{{ record.statusLabel }}</el-tag>
                <span class="record-time-cost" v-if="record.timeCost">⏱ {{ record.timeCost }}ms</span>
                <span class="record-memory" v-if="record.memory">💾 {{ record.memory }}MB</span>
              </div>
              <div class="record-meta">
                <span class="record-lang">{{ record.langLabel }}</span>
                <span class="record-datetime">{{ record.datetime }}</span>
              </div>
            </div>
            <div class="record-detail" v-if="record.message">
              <pre :class="['record-message', record.status === 'accepted' ? 'record-message--success' : 'record-message--error']">{{ record.message }}</pre>
            </div>
            <div class="record-actions">
              <div class="record-code-toggle" @click="toggleRecordCode(record)">
                <el-icon><component :is="record.showCode ? 'ArrowUp' : 'ArrowDown'" /></el-icon>
                {{ record.showCode ? '收起代码' : '查看代码' }}
              </div>
              <div
                v-if="record.status === 'accepted' || record.statusKey === 'wa'"
                class="record-chat-btn"
                @click="addRecordToChat(record)"
              >
                <el-icon><ChatDotRound /></el-icon>
                加入对话
              </div>
            </div>
            <div v-if="record.showCode" class="record-code-block">
              <pre class="record-code-pre">{{ record.code }}</pre>
            </div>
          </div>
        </div>

      </div>

      <!-- 可拖拽分隔线 -->
      <div class="divider" @mousedown.prevent="onDividerMousedown"></div>

      <!-- ===== 右侧：IDE ===== -->
      <div class="right-panel" :class="isDark ? 'theme-dark' : 'theme-light'">

        <!-- IDE 顶部工具栏 -->
        <div class="ide-toolbar">
          <div class="toolbar-left">
            <el-select
              v-model="selectedLang"
              size="small"
              style="width:130px"
              @change="onLangChange"
            >
              <el-option
                v-for="lang in languages"
                :key="lang.value"
                :label="lang.label"
                :value="lang.value"
              />
            </el-select>
            <span class="lang-hint">{{ langHint }}</span>
          </div>
          <div class="toolbar-right">
            <el-button size="small" @click="toggleTheme" plain :title="isDark ? '切换为明亮主题' : '切换为暗黑主题'">
              {{ isDark ? '☀️' : '🌙' }}
            </el-button>
            <el-button size="small" @click="resetCode" plain>
              <el-icon><RefreshLeft /></el-icon>
              重置
            </el-button>
          </div>
        </div>

      <!-- 代码编辑区 -->
        <div class="ide-editor-wrap" ref="editorWrap" @wheel.prevent="onEditorWheel">
          <!-- 行号列 -->
          <div class="line-numbers" ref="lineNumbersEl">
            <div
              v-for="n in lineCount"
              :key="n"
              class="line-num"
            >{{ n }}</div>
          </div>
          <!-- 高亮层（只读，绝对定位在底层） -->
          <pre
            class="highlight-layer"
            ref="highlightEl"
            aria-hidden="true"
            v-html="highlightedCode"
          ></pre>
          <!-- 点击拦截层：精确计算字符位置后再聚焦 textarea -->
          <div
            class="click-interceptor"
            @mousedown.prevent="onEditorMousedown"
            @wheel.prevent="onEditorWheel"
          ></div>
          <!-- 真实 textarea（透明，在高亮层上方） -->
          <textarea
            class="code-textarea"
            ref="textareaEl"
            v-model="code"
            spellcheck="false"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            @input="onCodeInput"
            @keydown="onKeydown"
          ></textarea>
          <!-- 自定义垂直滚动条 -->
          <div class="custom-scrollbar-v" ref="scrollbarVEl" @mousedown.prevent="onScrollbarVMousedown">
            <div class="scrollbar-thumb-v" ref="thumbVEl" :style="thumbVStyle"></div>
          </div>
        </div>

        <!-- IDE 底部操作栏 -->
        <div class="ide-footer">
          <div class="footer-left">
            <span class="code-stats">{{ lineCount }} 行 · {{ code.length }} 字符</span>
          </div>
          <div class="footer-right">
            <el-button size="default" plain @click="onTest" :loading="isRunning" :disabled="isRunning">
              <el-icon><VideoPlay /></el-icon>
              测试
            </el-button>
            <el-button size="default" type="primary" @click="onRun" :loading="isRunning" :disabled="isRunning">
              <el-icon><Upload /></el-icon>
              运行
            </el-button>
          </div>
        </div>

        <!-- 测试/运行结果面板 -->
        <div v-if="showResult" class="result-panel">
          <div class="result-header">
            <span class="result-title">{{ resultTitle }}</span>
            <el-icon class="result-close" @click="showResult = false"><Close /></el-icon>
          </div>
          <div class="result-body">
            <!-- 测试模式：可视化 case 列表 -->
            <template v-if="testCaseResults.length > 0">
              <div
                v-for="tc in testCaseResults"
                :key="tc.index"
                class="test-case-item"
                :class="tc.passed ? 'case-pass' : 'case-fail'"
              >
                <div class="case-header">
                  <span class="case-icon">{{ tc.passed ? '✓' : '✗' }}</span>
                  <span class="case-title">样例 {{ tc.index }}</span>
                  <el-tag :type="tc.passed ? 'success' : 'danger'" size="small" style="margin-left:auto">
                    {{ tc.passed ? '通过' : (tc.status === 'wrong_answer' ? '答案错误' : tc.status === 'runtime_error' ? '运行错误' : tc.status === 'time_limit_exceeded' ? '超时' : tc.status === 'compile_error' ? '编译错误' : '错误') }}
                  </el-tag>
                  <span v-if="tc.time_cost" class="case-time">{{ tc.time_cost }}ms</span>
                </div>
                <div class="case-body">
                  <div class="case-row">
                    <div class="case-col">
                      <div class="case-label">输入</div>
                      <pre class="case-code">{{ tc.input }}</pre>
                    </div>
                    <div class="case-col">
                      <div class="case-label">预期输出</div>
                      <pre class="case-code case-expected">{{ tc.expected_output }}</pre>
                    </div>
                    <div class="case-col">
                      <div class="case-label">实际输出</div>
                      <pre class="case-code" :class="tc.passed ? 'case-actual-pass' : 'case-actual-fail'">{{ tc.actual_output || (tc.error_msg ? '(运行出错)' : '(无输出)') }}</pre>
                    </div>
                  </div>
                  <div v-if="tc.error_msg" class="case-error-msg">{{ tc.error_msg }}</div>
                </div>
              </div>
            </template>
            <!-- 运行模式 / 编译错误等：普通文本输出 -->
            <template v-else>
              <el-tag :type="resultStatus === 'success' ? 'success' : 'danger'" size="small">
                {{ resultStatus === 'success' ? '通过' : '错误' }}
              </el-tag>
              <pre class="result-output">{{ resultOutput }}</pre>
            </template>
          </div>
        </div>

      </div>
    </div>

    <!-- AI 答疑悬浮按钮 -->
    <div class="ai-fab" @click="openAIChat" title="AI答疑">
      <span class="ai-fab-icon">🤖</span>
      <span class="ai-fab-text">AI答疑</span>
    </div>

    <!-- AI 答疑抽屉面板 -->
    <el-drawer
      v-model="aiDrawerVisible"
      title=""
      direction="rtl"
      :size="560"
      :with-header="false"
      class="ai-chat-drawer"
    >
      <div class="ai-drawer-inner">
        <!-- 头部 -->
        <div class="ai-drawer-header">
          <div class="ai-drawer-title">
            <span class="ai-title-icon">🤖</span>
            <span>AI 答疑助手</span>
          </div>
          <div class="ai-drawer-actions">
            <el-button size="small" :type="aiIsFavorited ? 'warning' : 'default'" plain @click="toggleAIFavorite" :disabled="!aiCurrentSessionId">
              <el-icon><StarFilled v-if="aiIsFavorited" /><Star v-else /></el-icon>
              {{ aiIsFavorited ? '已收藏' : '收藏' }}
            </el-button>
            <el-button size="small" type="primary" plain @click="newAISession">
              <el-icon><Plus /></el-icon>
              新会话
            </el-button>
            <el-button size="small" plain @click="clearAIChat">清空对话</el-button>
            <el-button v-if="aiSessionList.length > 0" size="small" plain @click="aiSessionListVisible = !aiSessionListVisible">
              <el-icon><Clock /></el-icon>
              历史会话
            </el-button>
            <el-button size="small" @click="aiDrawerVisible = false">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>

        <!-- 该题目历史会话列表（点击按钮展开/收起） -->
        <transition name="ai-session-slide">
        <div v-if="aiSessionList.length > 0 && aiSessionListVisible" class="ai-session-list">
          <div class="ai-session-list-title">
            <el-icon><Clock /></el-icon>
            该题目历史会话
            <span class="ai-session-list-close" @click="aiSessionListVisible = false">收起</span>
          </div>
          <div class="ai-session-list-scroll">
            <div
              v-for="s in aiSessionList"
              :key="s.id"
              class="ai-session-item"
              :class="{ active: aiCurrentSessionId === s.id }"
              @click="loadAISession(s.id); aiSessionListVisible = false"
            >
              <div class="ai-session-item-title">{{ s.title }}</div>
              <div class="ai-session-item-time">{{ formatAISessionTime(s.updateTime) }}</div>
            </div>
          </div>
        </div>
        </transition>

        <!-- 题目上下文提示 -->
        <div v-if="problem.title" class="ai-context-tip">
          <el-icon><InfoFilled /></el-icon>
          当前题目：<strong>{{ problem.title }}</strong>（已作为上下文传给AI）
        </div>

        <!-- 模型选择器 -->
        <div class="ai-model-selector">
          <div class="ai-model-selector-top">
            <span class="ai-model-label">
              <el-icon><Setting /></el-icon>
              模型
            </span>
            <el-select
              v-model="aiSelectedModel"
              size="small"
              :loading="aiModelsLoading"
              placeholder="选择模型"
              class="ai-model-select"
              popper-class="ai-model-select-popper"
            >
              <el-option
                v-for="m in aiModels"
                :key="m.model_id"
                :value="m.model_id"
                :label="m.model_name"
              >
                <div class="ai-model-option">
                  <div class="ai-model-option-header">
                    <span class="ai-model-option-name">{{ m.model_name }}</span>
                    <span class="ai-model-option-tag" :class="m.provider">{{ m.provider === 'doubao' ? '豆包' : '千问' }}</span>
                  </div>
                  <span class="ai-model-option-desc">{{ m.description }}</span>
                </div>
              </el-option>
            </el-select>
          </div>
          <!-- 深度思考开关 -->
          <div class="ai-deep-think-row" v-if="!isQwenModel">
            <span class="ai-model-label">深度思考</span>
            <el-switch v-model="aiDeepThink" size="small" />
          </div>
          <div class="ai-deep-think-row" v-else>
            <span class="ai-model-label">深度思考</span>
            <span class="qwen-auto-tip">模型自动决定是否开启思考模式</span>
          </div>
          <!-- 包含我的代码开关 -->
          <div class="ai-deep-think-row">
            <span class="ai-model-label">包含我的代码</span>
            <el-tooltip content="开启后，AI将参考你当前编辑器中的代码进行回答" placement="top">
              <el-switch v-model="aiIncludeCode" size="small" />
            </el-tooltip>
          </div>
          <!-- 当前模型描述 -->
          <div v-if="currentAIModelDesc" class="ai-model-desc-bar">
            <el-icon><InfoFilled /></el-icon>
            {{ currentAIModelDesc }}
          </div>
        </div>

        <!-- 消息列表 -->
        <div class="ai-messages" ref="aiMessagesEl">
          <div v-if="aiMessages.length === 0" class="ai-welcome">
            <div class="ai-welcome-icon">🤖</div>
            <div class="ai-welcome-text">你好！我是AI答疑助手</div>
            <div class="ai-welcome-sub">可以问我关于这道题的任何问题，支持粘贴代码和截图</div>
          </div>
          <div
            v-for="(msg, idx) in aiMessages"
            :key="idx"
            class="ai-msg-item"
            :class="msg.role"
          >
            <div class="ai-msg-avatar">
              <span v-if="msg.role === 'user'">👤</span>
              <span v-else>🤖</span>
            </div>
            <div class="ai-msg-bubble">
              <!-- 图片消息 -->
              <img v-if="msg.type === 'image'" :src="msg.content" class="ai-msg-image" />
              <!-- 文本消息：思考区块 + 正文 -->
              <template v-else>
                <div v-if="msg.thinkContent" class="ai-think-block">
                  <div class="ai-think-header" @click="msg.thinkExpanded = !msg.thinkExpanded">
                    <span class="ai-think-icon">🧠</span>
                    <span class="ai-think-title">思考过程</span>
                    <span class="ai-think-toggle">{{ msg.thinkExpanded ? '收起' : '展开' }}</span>
                  </div>
                  <div v-show="msg.thinkExpanded" class="ai-think-content" v-html="formatAIMessage(msg.thinkContent)"></div>
                </div>
                <div class="ai-msg-text" v-html="formatAIMessage(msg.displayContent || msg.content)"></div>
              </template>
              <div class="ai-msg-time">{{ msg.time }}</div>
            </div>
          </div>
          <!-- 加载中 -->
          <div v-if="aiLoading" class="ai-msg-item assistant">
            <div class="ai-msg-avatar">🤖</div>
            <div class="ai-msg-bubble">
              <div class="ai-loading-dots"><span></span><span></span><span></span></div>
            </div>
          </div>
        </div>

        <!-- 输入区 -->
        <div class="ai-input-area">
          <!-- 运行记录上下文卡片 -->
          <div v-if="aiPendingRecord" class="ai-pending-record">
            <div class="ai-pending-record-card">
              <div class="ai-pending-record-header">
                <span class="ai-pending-record-icon">📋</span>
                <span class="ai-pending-record-title">运行记录已加入</span>
                <el-tag :type="aiPendingRecord.status === 'accepted' ? 'success' : 'warning'" size="small">
                  {{ aiPendingRecord.status === 'accepted' ? '全部通过' : '部分通过' }}
                </el-tag>
                <span class="ai-pending-record-close" @click="removeAIPendingRecord">×</span>
              </div>
              <div class="ai-pending-record-body">
                <span>{{ aiPendingRecord.langLabel }}</span>
                <span class="ai-pending-record-sep">·</span>
                <span>{{ aiPendingRecord.passedCount }}/{{ aiPendingRecord.total }} 通过</span>
                <span v-if="aiPendingRecord.failedCount > 0" class="ai-pending-record-sep">·</span>
                <span v-if="aiPendingRecord.failedCount > 0" style="color:#f56c6c">{{ aiPendingRecord.failedCount }} 未通过</span>
              </div>
            </div>
          </div>
          <!-- 图片预览 -->
          <div v-if="aiPendingImages.length > 0" class="ai-pending-images">
            <div
              v-for="(img, idx) in aiPendingImages"
              :key="idx"
              class="ai-pending-img-wrap"
            >
              <img :src="img" class="ai-pending-img" />
              <span class="ai-pending-img-remove" @click="removeAIPendingImage(idx)">×</span>
            </div>
          </div>
          <div class="ai-input-row">
            <textarea
              ref="aiInputEl"
              v-model="aiInputText"
              class="ai-textarea"
              placeholder="输入问题，支持 Ctrl+V 粘贴代码/截图，Ctrl+Enter 发送"
              rows="3"
              @keydown.ctrl.enter.prevent="sendAIMessage"
              @paste="onAIPaste"
            ></textarea>
          </div>
          <div class="ai-input-footer">
            <div class="ai-input-footer-left">
              <span class="ai-input-hint">Ctrl+V 粘贴代码或截图 · Ctrl+Enter 发送</span>
              <el-upload :show-file-list="false" :before-upload="handleAIImageUpload" accept="image/*" multiple style="display:inline-block;margin-left:8px;">
                <el-button size="small" plain>
                  <el-icon><Paperclip /></el-icon> 上传图片
                </el-button>
              </el-upload>
            </div>
            <el-button
              v-if="!aiLoading"
              type="primary"
              size="small"
              :disabled="!canSendAI"
              @click="sendAIMessage"
            >发送</el-button>
            <el-button
              v-else
              type="danger"
              size="small"
              @click="stopAIMessage"
            ><el-icon><VideoPause /></el-icon> 停止</el-button>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- 编辑题目弹窗 -->
    <el-dialog v-model="editProblemVisible" title="编辑题目" width="800px" :destroy-on-close="false">
      <el-form :model="editProblemForm" label-width="100px" v-if="editProblemForm">
        <el-form-item label="题目标题">
          <el-input v-model="editProblemForm.title" placeholder="请输入题目标题" />
        </el-form-item>
        <el-form-item label="URL标识">
          <el-input v-model="editProblemForm.title_slug" placeholder="英文，如 two-sum" />
        </el-form-item>
        <el-form-item label="难度">
          <el-select v-model="editProblemForm.difficulty" style="width:120px">
            <el-option label="简单" value="简单" />
            <el-option label="中等" value="中等" />
            <el-option label="困难" value="困难" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="editProblemForm.tags" placeholder="多个标签用英文逗号分隔，如：哈希表,数组" />
        </el-form-item>
        <el-form-item label="题目描述">
          <el-input v-model="editProblemForm.description" type="textarea" :rows="8" placeholder="题目描述（支持 Markdown）" />
        </el-form-item>
        <el-form-item label="输入说明">
          <el-input v-model="editProblemForm.input_format" type="textarea" :rows="3" placeholder="输入格式说明（可选）" />
        </el-form-item>
        <el-form-item label="输出说明">
          <el-input v-model="editProblemForm.output_format" type="textarea" :rows="3" placeholder="输出格式说明（可选）" />
        </el-form-item>
        <el-form-item label="提示">
          <el-input v-model="editProblemForm.hint" type="textarea" :rows="3" placeholder="解题提示（可选）" />
        </el-form-item>
        <el-form-item label="约束条件">
          <el-input v-model="editProblemForm.constraints" type="textarea" :rows="3" placeholder="数据范围约束（可选）" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="时间限制">
              <el-input-number v-model="editProblemForm.time_limit" :min="100" :max="10000" :step="100" />
              <span style="margin-left:6px;color:#909399">ms</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="内存限制">
              <el-input-number v-model="editProblemForm.memory_limit" :min="32" :max="1024" :step="32" />
              <span style="margin-left:6px;color:#909399">MB</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="展示样例">
          <el-input v-model="editProblemForm.showcase" type="textarea" :rows="5" placeholder='JSON 格式，如：[{"input":"1 2","expected_output":"3","explanation":"1+2=3"}]' />
        </el-form-item>
        <el-form-item label="测试用例">
          <el-input v-model="editProblemForm.test_cases" type="textarea" :rows="6" placeholder='JSON 格式，如：[{"input":"1 2","expected_output":"3","is_sample":1}]' />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editProblemVisible = false">取消</el-button>
        <el-button type="primary" :loading="editProblemSaving" @click="saveEditProblem">保存</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft, Timer, Coin, InfoFilled,
  RefreshLeft, VideoPlay, Upload, Close, ArrowUp, ArrowDown, Loading, VideoPause, Paperclip,
  Clock, Plus, Setting, Star, StarFilled, Edit, ChatDotRound
} from '@element-plus/icons-vue'
import { teacherAPI } from '@/services/index.js'

const route = useRoute()
const router = useRouter()

// ===== 题目 ID =====
const problemId = route.params.problemId

// 从路由参数中提取数字 problem_id（兼容 '1'、'p1' 等格式）
function getProblemNumericId() {
  const raw = String(problemId || '')
  const num = parseInt(raw, 10)
  if (!isNaN(num) && num > 0) return num
  const match = raw.match(/\d+/)
  if (match) return parseInt(match[0], 10)
  return 0
}

// ===== 题目加载状态 =====
const problemLoading = ref(true)
const problemLoadError = ref('')

// 题目数据（初始为空，从后端加载）
const problem = ref({
  id: 0,
  title: '加载中...',
  difficulty: '',
  tags: [],
  timeLimit: 1000,
  memoryLimit: 256,
  description: '',
  inputFormat: '',
  outputFormat: '',
  samples: [],
  hint: ''
})

// 将后端题目数据适配为前端格式
function adaptProblem(raw) {
  // 解析 tags 字符串为数组
  const tags = raw.tags ? raw.tags.split(',').map(t => t.trim()).filter(Boolean) : []

  // 从 description 中解析输入格式、输出格式（### 输入格式 / ### 输出格式 段落）
  const desc = raw.description || ''
  const inputMatch = desc.match(/###\s*输入格式\s*\n([\s\S]*?)(?=###|$)/)
  const outputMatch = desc.match(/###\s*输出格式\s*\n([\s\S]*?)(?=###|$)/)
  const inputFormat = inputMatch ? inputMatch[1].trim() : ''
  const outputFormat = outputMatch ? outputMatch[1].trim() : ''
  // 去掉 description 中的输入输出格式段落，只保留正文
  const cleanDesc = desc
    .replace(/###\s*输入格式\s*\n[\s\S]*?(?=###|$)/, '')
    .replace(/###\s*输出格式\s*\n[\s\S]*?(?=###|$)/, '')
    .trim()

  // 从 showcase 字段解析展示样例（优先），fallback 到 test_cases 的 is_sample=1
  let samples = []
  try {
    const showcaseCases = JSON.parse(raw.showcase || '[]')
    if (showcaseCases.length > 0) {
      samples = showcaseCases.map(c => ({
        input: c.input || '',
        output: c.expected_output || c.output || '',
        explanation: c.explanation || ''
      }))
    } else {
      // fallback: 从 test_cases 取 is_sample=1
      const cases = JSON.parse(raw.test_cases || '[]')
      samples = cases
        .filter(c => c.is_sample === 1)
        .map(c => ({ input: c.input || '', output: c.expected_output || c.output || '', explanation: c.explanation || '' }))
    }
  } catch (e) {
    samples = []
  }

  return {
    id: raw.id,
    title: raw.title || '',
    difficulty: raw.difficulty || '',
    tags,
    timeLimit: raw.time_limit || 1000,
    memoryLimit: raw.memory_limit || 256,
    description: cleanDesc,
    inputFormat,
    outputFormat,
    samples,
    hint: raw.hint || ''
  }
}

// ===== 语言配置 =====
const languages = [
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' }
]

const langHintMap = {
  python: 'Python 3.x',
  java: 'Java 17',
  go: 'Go 1.21',
  cpp: 'C++17',
  c: 'C11'
}

const codeTemplates = {
  python: `# Python 解题模板
import sys
input = sys.stdin.readline

def solve():
    # 读取输入
    n = int(input())
    
    # 在此编写你的解题逻辑
    result = "Hello, World!"
    
    # 输出结果
    print(result)

if __name__ == "__main__":
    solve()
`,
  java: `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        
        // 读取输入
        int n = Integer.parseInt(br.readLine().trim());
        
        // 在此编写你的解题逻辑
        String result = "Hello, World!";
        
        // 输出结果
        System.out.println(result);
    }
}
`,
  go: `package main

import (
    "bufio"
    "fmt"
    "os"
)

var reader *bufio.Reader
var writer *bufio.Writer

func main() {
    reader = bufio.NewReader(os.Stdin)
    writer = bufio.NewWriter(os.Stdout)
    defer writer.Flush()

    // 读取输入
    var n int
    fmt.Fscan(reader, &n)

    // 在此编写你的解题逻辑
    result := "Hello, World!"

    // 输出结果
    fmt.Fprintln(writer, result)
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // 读取输入
    int n;
    cin >> n;

    // 在此编写你的解题逻辑
    string result = "Hello, World!";

    // 输出结果
    cout << result << endl;

    return 0;
}
`,
  c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    // 读取输入
    int n;
    scanf("%d", &n);

    // 在此编写你的解题逻辑
    char result[] = "Hello, World!";

    // 输出结果
    printf("%s", result);

    return 0;
}
`
}

// ===== 语法高亮规则 =====
const highlightRules = {
  python: {
    keywords: ['def', 'class', 'import', 'from', 'return', 'if', 'elif', 'else', 'for', 'while',
      'in', 'not', 'and', 'or', 'True', 'False', 'None', 'pass', 'break', 'continue',
      'try', 'except', 'finally', 'with', 'as', 'lambda', 'yield', 'global', 'nonlocal',
      'del', 'raise', 'assert', 'is', 'print', 'input', 'len', 'range', 'int', 'str',
      'list', 'dict', 'set', 'tuple', 'type', 'self', 'super']
  },
  java: {
    keywords: ['public', 'private', 'protected', 'class', 'interface', 'extends', 'implements',
      'static', 'final', 'void', 'int', 'long', 'double', 'float', 'boolean', 'char',
      'byte', 'short', 'String', 'new', 'return', 'if', 'else', 'for', 'while', 'do',
      'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'throws',
      'import', 'package', 'this', 'super', 'null', 'true', 'false', 'instanceof',
      'abstract', 'synchronized', 'volatile', 'transient', 'native', 'strictfp',
      'System', 'out', 'println', 'Integer', 'Arrays', 'ArrayList', 'HashMap']
  },
  go: {
    keywords: ['package', 'import', 'func', 'var', 'const', 'type', 'struct', 'interface',
      'return', 'if', 'else', 'for', 'range', 'switch', 'case', 'default', 'break',
      'continue', 'goto', 'fallthrough', 'defer', 'go', 'chan', 'select', 'map',
      'make', 'new', 'len', 'cap', 'append', 'copy', 'delete', 'close', 'panic',
      'recover', 'nil', 'true', 'false', 'int', 'int64', 'string', 'bool', 'byte',
      'rune', 'float64', 'error', 'fmt', 'Println', 'Fprintln', 'Fscan', 'Scan']
  },
  cpp: {
    keywords: ['include', 'define', 'ifdef', 'ifndef', 'endif', 'pragma',
      'using', 'namespace', 'std', 'class', 'struct', 'public', 'private', 'protected',
      'virtual', 'override', 'const', 'static', 'inline', 'extern', 'template',
      'typename', 'int', 'long', 'double', 'float', 'bool', 'char', 'void', 'auto',
      'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break',
      'continue', 'new', 'delete', 'nullptr', 'true', 'false', 'this',
      'cout', 'cin', 'endl', 'string', 'vector', 'map', 'set', 'pair',
      'sort', 'min', 'max', 'swap', 'push_back', 'size', 'bits']
  },
  c: {
    keywords: ['include', 'define', 'ifdef', 'ifndef', 'endif', 'pragma',
      'struct', 'union', 'enum', 'typedef', 'const', 'static', 'extern', 'inline',
      'volatile', 'register', 'auto',
      'int', 'long', 'short', 'double', 'float', 'char', 'void', 'unsigned', 'signed',
      'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
      'break', 'continue', 'goto', 'sizeof',
      'NULL', 'true', 'false',
      'printf', 'scanf', 'fprintf', 'fscanf', 'sprintf', 'sscanf',
      'malloc', 'calloc', 'realloc', 'free',
      'strlen', 'strcpy', 'strcat', 'strcmp', 'memset', 'memcpy',
      'stdin', 'stdout', 'stderr']
  }
}

// 转义 HTML 特殊字符
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// 对一行代码进行语法高亮
function highlightLine(line, lang) {
  if (!lang || !highlightRules[lang]) return escapeHtml(line)

  const keywords = highlightRules[lang].keywords
  let result = ''
  let i = 0
  const len = line.length

  while (i < len) {
    // 单行注释 // 或 #
    if ((line[i] === '/' && line[i + 1] === '/') || (lang === 'python' && line[i] === '#')) {
      result += `<span class="hl-comment">${escapeHtml(line.slice(i))}</span>`
      break
    }

    // 字符串 " 或 '
    if (line[i] === '"' || line[i] === "'") {
      const quote = line[i]
      let j = i + 1
      while (j < len && line[j] !== quote) {
        if (line[j] === '\\') j++ // 跳过转义
        j++
      }
      j++ // 包含结束引号
      result += `<span class="hl-string">${escapeHtml(line.slice(i, j))}</span>`
      i = j
      continue
    }

    // 数字
    if (/[0-9]/.test(line[i]) && (i === 0 || !/[a-zA-Z_]/.test(line[i - 1]))) {
      let j = i
      while (j < len && /[0-9.]/.test(line[j])) j++
      result += `<span class="hl-number">${escapeHtml(line.slice(i, j))}</span>`
      i = j
      continue
    }

    // 标识符或关键词
    if (/[a-zA-Z_]/.test(line[i])) {
      let j = i
      while (j < len && /[a-zA-Z0-9_]/.test(line[j])) j++
      const word = line.slice(i, j)
      if (keywords.includes(word)) {
        result += `<span class="hl-keyword">${escapeHtml(word)}</span>`
      } else {
        result += escapeHtml(word)
      }
      i = j
      continue
    }

    // 其他字符
    result += escapeHtml(line[i])
    i++
  }

  return result
}

// 对整段代码进行高亮（处理多行注释）
function highlightCode(code, lang) {
  if (!lang || !highlightRules[lang]) return escapeHtml(code)

  // 先处理多行注释 /* */
  const lines = code.split('\n')
  let inBlockComment = false
  const processedLines = lines.map(line => {
    if (inBlockComment) {
      const endIdx = line.indexOf('*/')
      if (endIdx !== -1) {
        inBlockComment = false
        const commentPart = line.slice(0, endIdx + 2)
        const rest = line.slice(endIdx + 2)
        return `<span class="hl-comment">${escapeHtml(commentPart)}</span>` + highlightLine(rest, lang)
      }
      return `<span class="hl-comment">${escapeHtml(line)}</span>`
    }

    const blockStart = line.indexOf('/*')
    if (blockStart !== -1) {
      const blockEnd = line.indexOf('*/', blockStart + 2)
      if (blockEnd !== -1) {
        // 同一行内的块注释
        const before = line.slice(0, blockStart)
        const comment = line.slice(blockStart, blockEnd + 2)
        const after = line.slice(blockEnd + 2)
        return highlightLine(before, lang) +
          `<span class="hl-comment">${escapeHtml(comment)}</span>` +
          highlightLine(after, lang)
      } else {
        inBlockComment = true
        const before = line.slice(0, blockStart)
        const comment = line.slice(blockStart)
        return highlightLine(before, lang) + `<span class="hl-comment">${escapeHtml(comment)}</span>`
      }
    }

    return highlightLine(line, lang)
  })

  return processedLines.join('\n')
}

// ===== 左侧 Tab =====
const leftTab = ref('problem')

// ===== 左侧宽度（可拖拽） =====
const leftWidth = ref(420)
const MIN_LEFT = 280
const MAX_LEFT = 700
let isDraggingDivider = false
let dividerStartX = 0
let dividerStartWidth = 0

const onDividerMousedown = (e) => {
  isDraggingDivider = true
  dividerStartX = e.clientX
  dividerStartWidth = leftWidth.value
  document.addEventListener('mousemove', onDividerMousemove)
  document.addEventListener('mouseup', onDividerMouseup)
}
const onDividerMousemove = (e) => {
  if (!isDraggingDivider) return
  const dx = e.clientX - dividerStartX
  leftWidth.value = Math.max(MIN_LEFT, Math.min(MAX_LEFT, dividerStartWidth + dx))
}
const onDividerMouseup = () => {
  isDraggingDivider = false
  document.removeEventListener('mousemove', onDividerMousemove)
  document.removeEventListener('mouseup', onDividerMouseup)
}

// ===== 运行记录 =====
const runRecords = ref([])
let recordIdCounter = 0

const STATUS_CONFIG = {
  accepted:    { label: '通过',       tagType: 'success', key: 'accepted' },
  tle:         { label: '超时',       tagType: 'warning', key: 'tle' },
  mle:         { label: '内存超限',   tagType: 'warning', key: 'mle' },
  ce:          { label: '编译错误',   tagType: 'danger',  key: 'ce' },
  re:          { label: '运行错误',   tagType: 'danger',  key: 're' },
  wa:          { label: '答案错误',   tagType: 'danger',  key: 'wa' },
  pending:     { label: '评测中',     tagType: 'info',    key: 'pending' },
}

function formatDatetime(d) {
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function addRunRecord(statusKey, opts = {}) {
  const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending
  const record = {
    id: ++recordIdCounter,
    status: opts.rawStatus || '',
    statusKey: cfg.key,
    statusLabel: cfg.label,
    tagType: cfg.tagType,
    langLabel: languages.find(l => l.value === selectedLang.value)?.label || selectedLang.value,
    langValue: selectedLang.value,
    datetime: formatDatetime(new Date()),
    timeCost: opts.timeCost || null,
    memory: opts.memory || null,
    message: opts.message || '',
    code: code.value,
    showCode: false,
    caseResults: opts.caseResults || [],
  }
  runRecords.value.unshift(record)
}

const toggleRecordCode = (record) => {
  record.showCode = !record.showCode
}

// 待加入对话的运行记录（卡片形式，用户可删除）
const aiPendingRecord = ref(null)
// 会话级运行记录上下文（发送后持久保存，整个会话期间每次请求都传递给后端）
const aiSessionRecord = ref(null)

// 将运行记录加入 AI 对话（仅展示卡片，不立即发送）
const addRecordToChat = (record) => {
  const isAccepted = record.status === 'accepted'
  const total = record.caseResults.length
  const passedCount = record.caseResults.filter(c => c.passed).length
  const failedCases = record.caseResults.filter(c => !c.passed)

  aiPendingRecord.value = {
    status: record.status,
    langLabel: record.langLabel,
    langValue: record.langValue,
    total,
    passedCount,
    failedCount: failedCases.length,
    code: record.code,
    judgeResult: isAccepted ? 'accepted' : 'partial_pass',
    failedCases,
    failedCasesJSON: failedCases.length > 0 ? JSON.stringify(failedCases.map(c => ({
      index: c.index, input: c.input, expected_output: c.expected_output,
      actual_output: c.actual_output, status: c.status, error_msg: c.error_msg || '',
    }))) : '',
  }

  aiDrawerVisible.value = true
  loadAIModels()
  loadAISessionList()
  nextTick(() => {
    scrollAIToBottom()
    aiInputEl.value?.focus()
  })
}

// 删除待加入的运行记录卡片
const removeAIPendingRecord = () => {
  aiPendingRecord.value = null
  aiSessionRecord.value = null
}

// ===== 状态 =====
const selectedLang = ref('python')
const code = ref(codeTemplates['python'])
const textareaEl = ref(null)
const highlightEl = ref(null)
const lineNumbersEl = ref(null)
const editorWrap = ref(null)
const scrollbarVEl = ref(null)
const thumbVEl = ref(null)

// 滚动条滑块样式
const thumbVStyle = ref({ top: '0px', height: '40px' })

// 更新滚动条滑块位置和大小
const updateScrollbar = () => {
  if (!textareaEl.value || !scrollbarVEl.value) return
  const ta = textareaEl.value
  const trackH = scrollbarVEl.value.clientHeight
  const contentH = ta.scrollHeight
  const visibleH = ta.clientHeight
  if (contentH <= visibleH) {
    // 内容未超出，隐藏滑块
    thumbVStyle.value = { top: '0px', height: '0px', opacity: '0' }
    return
  }
  const thumbH = Math.max(30, (visibleH / contentH) * trackH)
  const maxScroll = contentH - visibleH
  const thumbTop = (ta.scrollTop / maxScroll) * (trackH - thumbH)
  thumbVStyle.value = {
    top: thumbTop + 'px',
    height: thumbH + 'px',
    opacity: '1'
  }
}

// 拖动滚动条
let isDraggingV = false
let dragStartY = 0
let dragStartScrollTop = 0

const onScrollbarVMousedown = (e) => {
  if (!thumbVEl.value || !textareaEl.value || !scrollbarVEl.value) return
  const thumbRect = thumbVEl.value.getBoundingClientRect()
  const trackRect = scrollbarVEl.value.getBoundingClientRect()
  // 点击轨道空白区域：直接跳转
  if (e.target !== thumbVEl.value) {
    const ta = textareaEl.value
    const trackH = scrollbarVEl.value.clientHeight
    const thumbH = thumbVEl.value.clientHeight
    const clickY = e.clientY - trackRect.top
    const maxScroll = ta.scrollHeight - ta.clientHeight
    const ratio = Math.max(0, Math.min(1, (clickY - thumbH / 2) / (trackH - thumbH)))
    ta.scrollTop = ratio * maxScroll
    syncScroll()
    updateScrollbar()
    return
  }
  // 拖动滑块
  isDraggingV = true
  dragStartY = e.clientY
  dragStartScrollTop = textareaEl.value.scrollTop
  document.addEventListener('mousemove', onScrollbarVMousemove)
  document.addEventListener('mouseup', onScrollbarVMouseup)
}

const onScrollbarVMousemove = (e) => {
  if (!isDraggingV || !textareaEl.value || !scrollbarVEl.value) return
  const ta = textareaEl.value
  const trackH = scrollbarVEl.value.clientHeight
  const thumbH = thumbVEl.value.clientHeight
  const maxScroll = ta.scrollHeight - ta.clientHeight
  const dy = e.clientY - dragStartY
  const ratio = dy / (trackH - thumbH)
  ta.scrollTop = Math.max(0, Math.min(maxScroll, dragStartScrollTop + ratio * maxScroll))
  syncScroll()
  updateScrollbar()
}

const onScrollbarVMouseup = () => {
  isDraggingV = false
  document.removeEventListener('mousemove', onScrollbarVMousemove)
  document.removeEventListener('mouseup', onScrollbarVMouseup)
}

// ===== 主题 =====
const isDark = ref(true)
const toggleTheme = () => { isDark.value = !isDark.value }

const showResult = ref(false)
const resultTitle = ref('测试结果')
const resultStatus = ref('success')
const resultOutput = ref('')
// 测试模式的 case 详细结果（JSON 解析后）
const testCaseResults = ref([])

const langHint = computed(() => langHintMap[selectedLang.value] || '')

const lineCount = computed(() => {
  return code.value.split('\n').length
})

// 最长行宽（用于末尾空白填充，保证每行都能被选中到行尾）
const LINE_PAD = 120  // 每行末尾填充到至少120个字符宽度

const highlightedCode = computed(() => {
  const raw = highlightCode(code.value, selectedLang.value)
  // 在每行末尾追加不可见空格，使高亮层每行都有足够宽度可被选中
  return raw.split('\n').map(line => line + '<span class="line-pad"> </span>').join('\n')
})

// 语言切换
const onLangChange = (lang) => {
  code.value = codeTemplates[lang]
  nextTick(() => syncScroll())
}

// 重置代码
const resetCode = () => {
  code.value = codeTemplates[selectedLang.value]
}

// 代码输入
const onCodeInput = () => {
  nextTick(() => syncScroll())
}

// 同步滚动
const syncScroll = () => {
  if (!textareaEl.value || !highlightEl.value || !lineNumbersEl.value) return
  highlightEl.value.scrollTop = textareaEl.value.scrollTop
  highlightEl.value.scrollLeft = textareaEl.value.scrollLeft
  lineNumbersEl.value.scrollTop = textareaEl.value.scrollTop
  updateScrollbar()
}

// 确保光标所在行在可视区域内（自动滚动）
const ensureCursorVisible = () => {
  const ta = textareaEl.value
  if (!ta) return
  const pos = ta.selectionEnd
  // 计算光标所在行号
  const textBefore = code.value.slice(0, pos)
  const lineIndex = textBefore.split('\n').length - 1
  const lineHeightPx = 14 * 1.6  // font-size 14px * line-height 1.6
  const paddingTop = 16
  const cursorTop = paddingTop + lineIndex * lineHeightPx
  const cursorBottom = cursorTop + lineHeightPx
  const visibleTop = ta.scrollTop
  const visibleBottom = ta.scrollTop + ta.clientHeight

  if (cursorBottom > visibleBottom) {
    // 光标在可视区域下方，向下滚动
    ta.scrollTop = cursorBottom - ta.clientHeight
  } else if (cursorTop < visibleTop) {
    // 光标在可视区域上方，向上滚动
    ta.scrollTop = cursorTop - paddingTop
  }
  syncScroll()
}

// 鼠标滚轮只滚动编辑器容器，不移动光标
const onEditorWheel = (e) => {
  if (!textareaEl.value) return
  textareaEl.value.scrollTop += e.deltaY
  textareaEl.value.scrollLeft += e.deltaX
  syncScroll()
  updateScrollbar()
}

// 用 canvas 测量字符宽度，找到点击位置最近的字符索引
function getCharIndexAtX(text, x, font) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx.font = font
  // 二分查找最近字符
  let lo = 0, hi = text.length
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2)
    const w = ctx.measureText(text.slice(0, mid)).width
    if (w < x) lo = mid + 1
    else hi = mid
  }
  // 比较 lo-1 和 lo 哪个更近
  if (lo > 0) {
    const wPrev = ctx.measureText(text.slice(0, lo - 1)).width
    const wCurr = ctx.measureText(text.slice(0, lo)).width
    if (Math.abs(wPrev - x) < Math.abs(wCurr - x)) lo = lo - 1
  }
  return lo
}

// 将鼠标坐标转换为代码中的字符索引
function clientPosToCharIndex(clientX, clientY) {
  const ta = textareaEl.value
  const rect = highlightEl.value.getBoundingClientRect()
  const relY = clientY - rect.top + ta.scrollTop
  const relX = clientX - rect.left + ta.scrollLeft

  const lineHeightPx = 14 * 1.6  // font-size 14px * line-height 1.6
  const paddingTop = 16
  const paddingLeft = 16

  const lines = code.value.split('\n')
  const lineIndex = Math.max(0, Math.min(
    Math.floor((relY - paddingTop) / lineHeightPx),
    lines.length - 1
  ))

  const lineText = lines[lineIndex]
  let charsBefore = 0
  for (let i = 0; i < lineIndex; i++) {
    charsBefore += lines[i].length + 1
  }

  let colIndex = 0
  if (lineText.length > 0) {
    const font = '14px \'JetBrains Mono\', \'Fira Code\', \'Courier New\', Consolas, monospace'
    const xInLine = relX - paddingLeft
    // 如果点击位置超出行末，直接定位到行末
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx.font = font
    const lineWidth = ctx.measureText(lineText).width
    if (xInLine >= lineWidth) {
      colIndex = lineText.length
    } else {
      colIndex = getCharIndexAtX(lineText, xInLine, font)
    }
  }

  return charsBefore + colIndex
}

// 拖拽选中相关状态
let isDraggingSelect = false
let dragAnchorPos = 0  // 鼠标按下时的字符索引（锚点）

// 点击拦截：精确计算行列，手动设置光标位置；按住拖拽时实时更新选区
const onEditorMousedown = (e) => {
  if (!textareaEl.value || !highlightEl.value) return
  const ta = textareaEl.value

  const pos = clientPosToCharIndex(e.clientX, e.clientY)
  dragAnchorPos = pos
  isDraggingSelect = true

  ta.focus()
  nextTick(() => {
    ta.selectionStart = pos
    ta.selectionEnd = pos
  })

  document.addEventListener('mousemove', onSelectMousemove)
  document.addEventListener('mouseup', onSelectMouseup)
}

const onSelectMousemove = (e) => {
  if (!isDraggingSelect || !textareaEl.value || !highlightEl.value) return
  const ta = textareaEl.value
  const pos = clientPosToCharIndex(e.clientX, e.clientY)

  // 根据当前位置与锚点的关系决定选区方向
  if (pos >= dragAnchorPos) {
    ta.selectionStart = dragAnchorPos
    ta.selectionEnd = pos
  } else {
    ta.selectionStart = pos
    ta.selectionEnd = dragAnchorPos
  }
}

const onSelectMouseup = () => {
  isDraggingSelect = false
  document.removeEventListener('mousemove', onSelectMousemove)
  document.removeEventListener('mouseup', onSelectMouseup)
}

// Tab 键 & 智能回车 & 括号自动补全
const onKeydown = (e) => {
  const ta = e.target
  const start = ta.selectionStart
  const end = ta.selectionEnd
  const val = code.value

  // ===== Tab：插入4个空格 =====
  if (e.key === 'Tab') {
    e.preventDefault()
    code.value = val.slice(0, start) + '    ' + val.slice(end)
    nextTick(() => { ta.selectionStart = ta.selectionEnd = start + 4 })
    return
  }

  // ===== Enter：智能缩进 =====
  if (e.key === 'Enter') {
    e.preventDefault()
    // 找到当前行的起始位置
    const lineStart = val.lastIndexOf('\n', start - 1) + 1
    const currentLine = val.slice(lineStart, start)
    // 提取当前行的前导空格
    const indentMatch = currentLine.match(/^(\s*)/)
    const indent = indentMatch ? indentMatch[1] : ''
    // 判断光标前一个非空字符是否是开括号 { ( [
    const charBefore = val.slice(0, start).trimEnd().slice(-1)
    const charAfter = val[end] // 光标后紧跟的字符
    const openBrackets = ['{', '(', '[']
    const closeBrackets = ['}', ')', ']']
    const isOpenBracket = openBrackets.includes(charBefore)
    const isMatchingClose = closeBrackets[openBrackets.indexOf(charBefore)] === charAfter

    if (isOpenBracket && isMatchingClose) {
      // 情况：光标在 { } 之间，回车后光标在中间行，关闭括号另起一行
      const innerIndent = indent + '    '
      const inserted = '\n' + innerIndent + '\n' + indent
      code.value = val.slice(0, start) + inserted + val.slice(end)
      nextTick(() => {
        const newPos = start + 1 + innerIndent.length
        ta.selectionStart = ta.selectionEnd = newPos
        nextTick(() => ensureCursorVisible())
      })
    } else if (isOpenBracket) {
      // 情况：行尾是开括号，但后面没有对应的关闭括号
      const innerIndent = indent + '    '
      code.value = val.slice(0, start) + '\n' + innerIndent + val.slice(end)
      nextTick(() => {
        ta.selectionStart = ta.selectionEnd = start + 1 + innerIndent.length
        nextTick(() => ensureCursorVisible())
      })
    } else {
      // 普通回车：继承当前行缩进
      code.value = val.slice(0, start) + '\n' + indent + val.slice(end)
      nextTick(() => {
        ta.selectionStart = ta.selectionEnd = start + 1 + indent.length
        nextTick(() => ensureCursorVisible())
      })
    }
    return
  }

  // ===== 括号/引号自动补全 =====
  const pairMap = { '{': '}', '(': ')', '[': ']' }
  if (pairMap[e.key] && start === end) {
    e.preventDefault()
    const close = pairMap[e.key]
    code.value = val.slice(0, start) + e.key + close + val.slice(end)
    nextTick(() => { ta.selectionStart = ta.selectionEnd = start + 1 })
    return
  }

  // ===== 右括号跳过：光标后已有对应右括号时直接跳过 =====
  const skipChars = ['}', ')', ']']
  if (skipChars.includes(e.key) && val[start] === e.key && start === end) {
    e.preventDefault()
    nextTick(() => { ta.selectionStart = ta.selectionEnd = start + 1 })
    return
  }

  // ===== Backspace：删除成对括号 =====
  if (e.key === 'Backspace' && start === end && start > 0) {
    const before = val[start - 1]
    const after = val[start]
    const pairs = { '{': '}', '(': ')', '[': ']' }
    if (pairs[before] === after) {
      e.preventDefault()
      code.value = val.slice(0, start - 1) + val.slice(start + 1)
      nextTick(() => {
        ta.selectionStart = ta.selectionEnd = start - 1
        nextTick(() => ensureCursorVisible())
      })
    }
  }

  // ===== 上/下/Home/End/PageUp/PageDown：导航键滚动跟随光标 =====
  const navKeys = ['ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']
  if (navKeys.includes(e.key)) {
    // 导航键由浏览器原生处理光标移动，之后确保滚动跟随
    nextTick(() => ensureCursorVisible())
  }
}

// ===== 代码运行状态映射 =====
const RUN_STATUS_MAP = {
  accepted:              { statusKey: 'accepted', message: '' },
  wrong_answer:          { statusKey: 'wa',       message: '答案错误' },
  time_limit_exceeded:   { statusKey: 'tle',      message: '执行超时' },
  memory_limit_exceeded: { statusKey: 'mle',      message: '内存超限' },
  compile_error:         { statusKey: 'ce',       message: '编译错误' },
  runtime_error:         { statusKey: 're',       message: '运行错误' },
  pending:               { statusKey: 'pending',  message: '评测中' },
  running:               { statusKey: 'pending',  message: '评测中' },
}

// 轮询查询运行结果
async function pollCodeRunResult(runId, onDone) {
  const MAX_POLL = 30
  const INTERVAL = 1000
  let count = 0

  const poll = async () => {
    count++
    try {
      const res = await teacherAPI.getCodeRunResult(runId)
      const result = res?.data || res
      const status = result?.status || 'pending'

      if (status === 'pending' || status === 'running') {
        if (count < MAX_POLL) {
          setTimeout(poll, INTERVAL)
        } else {
          onDone({ status: 'runtime_error', error_msg: '评测超时，请稍后重试', time_cost: 0, memory_used: 0, output: '' })
        }
        return
      }
      onDone(result)
    } catch (e) {
      onDone({ status: 'runtime_error', error_msg: '查询结果失败: ' + (e?.message || e), time_cost: 0, memory_used: 0, output: '' })
    }
  }
  setTimeout(poll, INTERVAL)
}

const isRunning = ref(false)

// 测试（使用 showcase 用例，不记录到运行记录）
const onTest = async () => {
  if (isRunning.value) return
  isRunning.value = true

  const pid = getProblemNumericId()
  if (!pid) {
    resultTitle.value = '测试结果'
    resultStatus.value = 'error'
    resultOutput.value = '题目ID无效，无法提交'
    showResult.value = true
    isRunning.value = false
    return
  }

  resultTitle.value = '测试结果'
  resultStatus.value = 'success'
  resultOutput.value = '正在提交代码，评测中...'
  showResult.value = true

  try {
    // run_type=test，后端从 showcase 字段取用例执行
    const submitRes = await teacherAPI.submitCodeRun(pid, selectedLang.value, code.value, 'test')
    const runId = submitRes?.data?.run_id || submitRes?.run_id
    if (!runId) {
      resultOutput.value = '提交失败：' + (submitRes?.message || '未知错误')
      resultStatus.value = 'error'
      isRunning.value = false
      return
    }

    pollCodeRunResult(runId, (result) => {
      isRunning.value = false
      const timeCost = result.time_cost || 0
      const memUsed = result.memory_used ? (result.memory_used / 1024).toFixed(1) : null

      // 尝试解析 output 为 case 详细结果 JSON
      let caseResults = []
      try {
        const parsed = JSON.parse(result.output || '[]')
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].index !== undefined) {
          caseResults = parsed
        }
      } catch (e) { /* 非 JSON，走普通文本展示 */ }

      if (caseResults.length > 0) {
        // 可视化 case 列表模式
        testCaseResults.value = caseResults
        const allPassed = caseResults.every(c => c.passed)
        resultTitle.value = `测试结果（${caseResults.filter(c => c.passed).length}/${caseResults.length} 通过）`
        resultStatus.value = allPassed ? 'success' : 'error'
        resultOutput.value = ''
      } else if (result.status === 'compile_error') {
        // 编译错误：无 case 结果，直接展示错误信息
        testCaseResults.value = []
        resultStatus.value = 'error'
        resultTitle.value = '测试结果'
        resultOutput.value = `✗ 编译错误\n\n${result.error_msg || ''}`
      } else {
        testCaseResults.value = []
        resultStatus.value = result.status === 'accepted' ? 'success' : 'error'
        resultTitle.value = '测试结果'
        resultOutput.value = result.error_msg || result.output || ''
      }
      showResult.value = true
    })
  } catch (e) {
    isRunning.value = false
    resultStatus.value = 'error'
    resultOutput.value = '提交失败：' + (e?.message || e)
    testCaseResults.value = []
    showResult.value = true
  }
}

// 运行（执行所有 test_cases，记录到运行记录）
const onRun = async () => {
  if (isRunning.value) return
  isRunning.value = true

  const pid = getProblemNumericId()
  if (!pid) {
    resultTitle.value = '运行结果'
    resultStatus.value = 'error'
    resultOutput.value = '题目ID无效，无法提交'
    showResult.value = true
    isRunning.value = false
    return
  }

  resultTitle.value = '运行结果'
  resultStatus.value = 'success'
  resultOutput.value = `提交成功！\n\n语言：${languages.find(l => l.value === selectedLang.value)?.label}\n代码长度：${code.value.length} 字符\n\n评测中... 请稍候`
  showResult.value = true

  try {
    const submitRes = await teacherAPI.submitCodeRun(pid, selectedLang.value, code.value, 'submit')
    const runId = submitRes?.data?.run_id || submitRes?.run_id
    if (!runId) {
      resultOutput.value = '提交失败：' + (submitRes?.message || '未知错误')
      resultStatus.value = 'error'
      isRunning.value = false
      return
    }

    pollCodeRunResult(runId, (result) => {
      isRunning.value = false
      const statusInfo = RUN_STATUS_MAP[result.status] || { statusKey: 're', message: '未知状态' }
      const timeCost = result.time_cost || 0
      const memUsed = result.memory_used ? (result.memory_used / 1024).toFixed(1) : null

      // 尝试解析 output 为 case 详细结果 JSON（submit 模式后端也返回 JSON）
      let caseResults = []
      try {
        const parsed = JSON.parse(result.output || '[]')
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].index !== undefined) {
          caseResults = parsed
        }
      } catch (e) { /* 非 JSON */ }

      // 构建运行记录的 message
      let recordMessage = result.error_msg || statusInfo.message || ''
      if (caseResults.length > 0) {
        const passedCount = caseResults.filter(c => c.passed).length
        const total = caseResults.length
        // 找到第一个未通过的 case
        const firstFail = caseResults.find(c => !c.passed)
        if (firstFail) {
          const failStatus = firstFail.status === 'wrong_answer' ? '答案错误'
            : firstFail.status === 'runtime_error' ? '运行错误'
            : firstFail.status === 'time_limit_exceeded' ? '执行超时'
            : firstFail.status === 'compile_error' ? '编译错误' : '错误'
          recordMessage = `${passedCount}/${total} 通过\n\n测试点 ${firstFail.index}：${failStatus}\n输入：${firstFail.input}\n预期输出：${firstFail.expected_output}\n实际输出：${firstFail.actual_output || '(无输出)'}${firstFail.error_msg ? '\n错误信息：' + firstFail.error_msg : ''}`
        } else {
          recordMessage = `${passedCount}/${total} 通过`
        }
      }

      addRunRecord(statusInfo.statusKey, {
        timeCost,
        memory: memUsed,
        message: recordMessage,
        rawStatus: result.status,
        caseResults,
      })

      // 运行模式不展示右下角结果面板，只切换到运行记录
      showResult.value = false
      testCaseResults.value = []
      leftTab.value = 'records'
    })
  } catch (e) {
    isRunning.value = false
    resultStatus.value = 'error'
    resultOutput.value = '提交失败：' + (e?.message || e)
    showResult.value = true
  }
}

// 难度标签文字（兼容中英文）
const difficultyLabel = (diff) => {
  const map = { easy: '简单', medium: '中等', hard: '困难', '简单': '简单', '中等': '中等', '困难': '困难' }
  return map[diff] || diff
}
const difficultyType = (diff) => {
  const map = { easy: 'success', medium: 'warning', hard: 'danger', '简单': 'success', '中等': 'warning', '困难': 'danger' }
  return map[diff] || 'info'
}

// 返回：如果是从章节管理跳过来的，返回到对应班级的章节管理 Tab
const goBack = () => {
  const from = route.query.from
  const classId = route.query.classId
  if (from === 'chapters' && classId) {
    router.push({
      name: 'TeacherClassDetail',
      params: { classId: classId },
      query: { tab: 'chapters' }
    })
  } else {
    router.back()
  }
}

// ===== AI 答疑 =====
const aiDrawerVisible = ref(false)
const aiSessionListVisible = ref(false)
const aiMessages = ref([])  // { role: 'user'|'assistant', content: string, type?: 'text'|'image', time: string }
const aiInputText = ref('')
const aiLoading = ref(false)
const aiMessagesEl = ref(null)
const aiInputEl = ref(null)
const aiPendingImages = ref([])  // 待发送的图片（base64 data url）

// AI 会话管理
const aiCurrentSessionId = ref('')  // 当前会话ID
const aiSessionList = ref([])       // 该题目的历史会话列表
const aiIsFavorited = ref(false)     // 当前会话是否已收藏

// 检查AI答疑会话收藏状态
const checkAIFavoriteStatus = async () => {
  if (!aiCurrentSessionId.value) {
    aiIsFavorited.value = false
    return
  }
  try {
    const res = await teacherAPI.checkFavorite(aiCurrentSessionId.value)
    aiIsFavorited.value = res?.data?.data?.is_favorited || false
  } catch (e) {
    console.error('检查收藏状态失败:', e)
  }
}

// 收藏/取消收藏AI答疑会话
const toggleAIFavorite = async () => {
  if (!aiCurrentSessionId.value) {
    ElMessage.warning('请先发送一条消息创建会话')
    return
  }
  try {
    if (aiIsFavorited.value) {
      await teacherAPI.unfavoriteSession(aiCurrentSessionId.value)
      aiIsFavorited.value = false
      ElMessage.success('已取消收藏')
    } else {
      await teacherAPI.favoriteSession(aiCurrentSessionId.value)
      aiIsFavorited.value = true
      ElMessage.success('会话已收藏')
    }
  } catch (e) {
    console.error('收藏操作失败:', e)
    ElMessage.error('操作失败')
  }
}

// 加载该题目的历史会话列表
const loadAISessionList = async () => {
  try {
    const res = await teacherAPI.getAISessions(1, 50)
    const list = res?.data?.sessions || []
    const pid = getProblemNumericId()
    // 只展示该题目的会话（problem_id 匹配）
    aiSessionList.value = list
      .filter(s => s.problem_id && s.problem_id === pid)
      .map(s => ({
        id: s.session_id,
        title: s.session_title || '未命名会话',
        updateTime: s.last_interact_time || s.create_time
      }))
      .sort((a, b) => new Date(b.updateTime) - new Date(a.updateTime))
  } catch (e) {
    console.warn('加载AI会话列表失败:', e)
  }
}

// 加载某个历史会话的消息
const loadAISession = async (sessionId) => {
  if (aiCurrentSessionId.value === sessionId) return
  // 切换会话时清空运行记录上下文
  aiSessionRecord.value = null
  aiPendingRecord.value = null
  try {
    aiCurrentSessionId.value = sessionId
    aiMessages.value = []
    // 检查收藏状态
    checkAIFavoriteStatus()
    const res = await teacherAPI.getAISessionMessages(sessionId, 1, 200)
    const convList = res?.data?.conversations || []
    convList.sort((a, b) => (a.message_seq || 0) - (b.message_seq || 0))
    aiMessages.value = convList.map(c => ({
      role: c.sender_type === 2 ? 'assistant' : 'user',
      content: c.message_content || '',
      displayContent: c.message_content || '',
      type: 'text',
      time: c.send_time || c.create_time,
      thinkContent: '',
      thinkExpanded: false
    }))
    scrollAIToBottom()
  } catch (e) {
    ElMessage.error('加载历史会话失败')
    console.error('加载历史会话失败:', e)
  }
}

// 新建会话
const newAISession = () => {
  aiCurrentSessionId.value = ''
  aiMessages.value = []
  aiInputText.value = ''
  aiPendingImages.value = []
  aiSessionRecord.value = null
  aiPendingRecord.value = null
}

// 格式化会话时间
const formatAISessionTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// AI中止控制器
let aiAbortController = null

// 停止AI对话
const stopAIMessage = () => {
  if (aiAbortController) {
    aiAbortController.abort()
    aiAbortController = null
  }
  aiLoading.value = false
}

// 模型选择
const aiModels = ref([])  // 模型列表
const aiSelectedModel = ref('')  // 当前选中的模型ID
const aiModelsLoading = ref(false)
const aiDeepThink = ref(false)  // 是否开启深度思考模式
const aiIncludeCode = ref(false)  // 是否将IDE中的代码作为上下文发送给AI

// 当前选中模型的描述
const currentAIModelDesc = computed(() => {
  const m = aiModels.value.find(m => m.model_id === aiSelectedModel.value)
  return m?.description || ''
})

// 是否为千问模型
const isQwenModel = computed(() => {
  const m = aiModels.value.find(m => m.model_id === aiSelectedModel.value)
  return m?.provider === 'qwen'
})

// 加载模型列表
const loadAIModels = async () => {
  if (aiModels.value.length > 0) return
  aiModelsLoading.value = true
  try {
    const res = await teacherAPI.getAIModels()
    const models = res?.data?.models || []
    aiModels.value = models
    // 默认选中第一个模型
    if (models.length > 0 && !aiSelectedModel.value) {
      aiSelectedModel.value = models[0].model_id
    }
  } catch (e) {
    console.error('加载模型列表失败:', e)
    // 失败时使用默认模型
    aiModels.value = [
      { model_id: 'doubao-seed-1-6-lite-251015', model_name: 'Doubao-Seed-1.6-lite', provider: 'doubao', description: '多模态模型，支持深度思考' },
      { model_id: 'qwen3-omni-flash', model_name: 'Qwen3-Omni-Flash', provider: 'qwen', description: '全模态模型，Thinker–Talker 架构' }
    ]
    if (!aiSelectedModel.value) aiSelectedModel.value = 'doubao-seed-1-6-lite-251015'
  } finally {
    aiModelsLoading.value = false
  }
}

// 是否可以发送
const canSendAI = computed(() => {
  return (aiInputText.value.trim() !== '' || aiPendingImages.value.length > 0 || aiPendingRecord.value !== null) && !aiLoading.value
})

// 打开AI答疑面板
const openAIChat = () => {
  aiDrawerVisible.value = true
  loadAIModels()  // 打开时加载模型列表
  loadAISessionList()  // 加载该题目的历史会话列表
  nextTick(() => {
    scrollAIToBottom()
    aiInputEl.value?.focus()
  })
}

// 清空对话
const clearAIChat = () => {
  aiMessages.value = []
  aiPendingImages.value = []
  aiInputText.value = ''
}

// 格式化当前时间
function nowTimeStr() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// 格式化AI消息（支持代码块、换行）
const formatAIMessage = (content) => {
  if (!content) return ''
  let html = content.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="ai-code-block"><code>${escapeHtml(code.trim())}</code></pre>`
  })
  html = html.replace(/`([^`]+)`/g, '<code class="ai-inline-code">$1</code>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\n/g, '<br>')
  return html
}

// 滚动到底部
const scrollAIToBottom = () => {
  nextTick(() => {
    if (aiMessagesEl.value) {
      aiMessagesEl.value.scrollTop = aiMessagesEl.value.scrollHeight
    }
  })
}

// 处理粘贴事件（支持粘贴图片和代码）
const onAIPaste = (e) => {
  const items = e.clipboardData?.items
  if (!items) return
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault()
      const file = item.getAsFile()
      if (!file) continue
      const reader = new FileReader()
      reader.onload = (ev) => {
        aiPendingImages.value.push(ev.target.result)
      }
      reader.readAsDataURL(file)
    }
  }
  // 文本粘贴（代码）走默认行为，不拦截
}

// 点击上传图片
const handleAIImageUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isImage) { ElMessage.error('仅支持上传图片文件！'); return false }
  if (!isLt10M) { ElMessage.error('图片大小不能超过10MB！'); return false }
  const reader = new FileReader()
  reader.onload = (ev) => { aiPendingImages.value.push(ev.target.result) }
  reader.readAsDataURL(file)
  return false
}

// 移除待发送图片
const removeAIPendingImage = (idx) => {
  aiPendingImages.value.splice(idx, 1)
}

// 构建题目上下文
function buildProblemInfo() {
  if (!problem.value || !problem.value.id) return null
  return {
    id: problem.value.id,
    title: problem.value.title,
    difficulty: problem.value.difficulty,
    description: problem.value.description,
    input_format: problem.value.inputFormat,
    output_format: problem.value.outputFormat,
    tags: problem.value.tags,
    time_limit: problem.value.timeLimit,
    memory_limit: problem.value.memoryLimit
  }
}

// 发送AI消息（SSE流式）
const sendAIMessage = async () => {
  if (!canSendAI.value) return

  const text = aiInputText.value.trim()
  const images = [...aiPendingImages.value]

  // 构建带图片标记的消息内容（用于传给后端）
  let messageContent = text
  for (const img of images) {
    messageContent += `\n[IMAGE:${img}]`
  }

  // 如果有运行记录卡片但没有文本输入，自动生成消息
  if (!text && images.length === 0 && aiPendingRecord.value) {
    const pr = aiPendingRecord.value
    if (pr.judgeResult === 'accepted') {
      messageContent = `[运行记录分析] 我的代码已全部通过（${pr.passedCount}/${pr.total}），请帮我分析代码是否有优化空间。`
    } else {
      messageContent = `[运行记录分析] 我的代码部分通过（${pr.passedCount}/${pr.total}），请帮我分析为什么没有通过剩余用例，引导我思考如何修复。`
    }
  }

  // 添加用户消息到列表（UI展示：文字 + 图片分开展示）
  if (text) {
    aiMessages.value.push({ role: 'user', content: messageContent, displayContent: text, type: 'text', time: nowTimeStr() })
  } else if (images.length > 0) {
    aiMessages.value.push({ role: 'user', content: messageContent, displayContent: '', type: 'text', time: nowTimeStr() })
  } else if (aiPendingRecord.value) {
    aiMessages.value.push({ role: 'user', content: messageContent, displayContent: messageContent, type: 'text', time: nowTimeStr() })
  }
  for (const img of images) {
    aiMessages.value.push({ role: 'user', content: img, type: 'image', time: nowTimeStr() })
  }

  aiInputText.value = ''
  aiPendingImages.value = []
  aiLoading.value = true
  scrollAIToBottom()

  // 构建发送给后端的消息历史（图片已嵌入文本消息的content中，过滤掉单独的image展示消息）
  const historyMessages = aiMessages.value
    .filter(m => m.type !== 'image')
    .map(m => ({ role: m.role, content: m.content }))

  const assistantMsgIdx = aiMessages.value.length
  aiMessages.value.push({ role: 'assistant', content: '', thinkContent: '', thinkExpanded: true, type: 'text', time: nowTimeStr() })

  try {
    aiAbortController = new AbortController()
    const response = await teacherAPI.aiChatStream({
      session_id: aiCurrentSessionId.value || '',
      problem_id: getProblemNumericId() || 0,
      question_type: 'algorithm_problem',
      problem_info: buildProblemInfo(),
      messages: historyMessages,
      model_id: aiSelectedModel.value || 'doubao-seed-1-6-lite-251015',
      enable_thinking: aiDeepThink.value,
      user_code: (aiPendingRecord.value || aiSessionRecord.value) ? (aiPendingRecord.value || aiSessionRecord.value).code : (aiIncludeCode.value ? (code.value || '') : ''),
      user_code_lang: (aiPendingRecord.value || aiSessionRecord.value) ? (aiPendingRecord.value || aiSessionRecord.value).langValue : (aiIncludeCode.value ? (selectedLang.value || '') : ''),
      judge_result: (aiPendingRecord.value || aiSessionRecord.value) ? (aiPendingRecord.value || aiSessionRecord.value).judgeResult : '',
      failed_cases: (aiPendingRecord.value || aiSessionRecord.value) ? (aiPendingRecord.value || aiSessionRecord.value).failedCasesJSON : '',
    }, aiAbortController.signal)

    if (!response.ok) {
      const errRespType = response.headers.get('Content-Type') || ''
      if (errRespType.includes('application/json')) {
        const errResp = await response.json()
        const errCode = errResp?.error?.code
        const errMsg = errResp?.error?.message
        if (errCode === 4031) {
          ElMessage.error(errMsg || '您的AI对话功能已被禁止使用。')
          aiMessages.value[assistantMsgIdx].content = errMsg || '您的AI对话功能已被禁止使用。'
          aiLoading.value = false
          return
        }
        throw new Error(errMsg || `HTTP ${response.status}`)
      }
      const errText = await response.text()
      throw new Error(errText || `HTTP ${response.status}`)
    }

    // 检查是否为内容审核拦截的 JSON 响应（非SSE流）
    const aiContentType = response.headers.get('Content-Type') || ''
    if (aiContentType.includes('application/json')) {
      const jsonResp = await response.json()
      const errCode = jsonResp?.error?.code
      const errMsg = jsonResp?.error?.message
      if (errCode === 4031 || errCode === 4032) {
        ElMessage.warning(errMsg || '您的消息被系统拦截，请规范用语。')
        aiMessages.value[assistantMsgIdx].content = errMsg || '您的消息被系统拦截，请规范用语。'
        aiLoading.value = false
        return
      }
      throw new Error(errMsg || 'AI对话请求失败')
    }

    // 读取 SSE 流
    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let thinkBuf = ''
    let inThink = false

    const processChunkContent = (raw) => {
      thinkBuf += raw
      const msg = aiMessages.value[assistantMsgIdx]
      while (thinkBuf.length > 0) {
        if (inThink) {
          const endIdx = thinkBuf.indexOf('</think>')
          if (endIdx !== -1) {
            msg.thinkContent += thinkBuf.slice(0, endIdx)
            thinkBuf = thinkBuf.slice(endIdx + 8)
            inThink = false
          } else {
            const safe = thinkBuf.length > 7 ? thinkBuf.slice(0, thinkBuf.length - 7) : ''
            if (safe) { msg.thinkContent += safe; thinkBuf = thinkBuf.slice(safe.length) }
            break
          }
        } else {
          const startIdx = thinkBuf.indexOf('<think>')
          if (startIdx !== -1) {
            msg.content += thinkBuf.slice(0, startIdx)
            thinkBuf = thinkBuf.slice(startIdx + 7)
            inThink = true
          } else {
            const safe = thinkBuf.length > 6 ? thinkBuf.slice(0, thinkBuf.length - 6) : ''
            if (safe) { msg.content += safe; thinkBuf = thinkBuf.slice(safe.length) }
            break
          }
        }
      }
    }

    let streamDone = false
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        if (thinkBuf) {
          const msg = aiMessages.value[assistantMsgIdx]
          if (inThink) msg.thinkContent += thinkBuf
          else msg.content += thinkBuf
          thinkBuf = ''
        }
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() // 保留最后一个不完整的行

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') {
            streamDone = true
            break
          }
          try {
            const chunk = JSON.parse(data)
            if (chunk.content) {
              processChunkContent(chunk.content)
              scrollAIToBottom()
            }
            if (chunk.is_end) {
              streamDone = true
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }

      // 流结束后：刷出 thinkBuf 残留内容，关闭 reader，立即退出
      if (streamDone) {
        if (thinkBuf) {
          const msg = aiMessages.value[assistantMsgIdx]
          if (inThink) msg.thinkContent += thinkBuf
          else msg.content += thinkBuf
          thinkBuf = ''
        }
        aiLoading.value = false
        reader.cancel().catch(() => {})
        break
      }
    }
  } catch (e) {
    if (e?.name === 'AbortError') {
      // 用户主动终止，不提示错误
    } else {
      ElMessage.error('AI答疑请求失败：' + (e?.message || e))
      // 移除空的 assistant 消息
      if (aiMessages.value[assistantMsgIdx]?.content === '' && !aiMessages.value[assistantMsgIdx]?.thinkContent) {
        aiMessages.value.splice(assistantMsgIdx, 1)
      }
    }
  } finally {
    aiLoading.value = false
    aiAbortController = null
    // 发送完成后清除运行记录卡片（UI卡片消失），但保留会话级上下文
    if (aiPendingRecord.value) {
      aiSessionRecord.value = aiPendingRecord.value
      aiPendingRecord.value = null
    }
    // 发送完成后刷新会话列表，并在首轮对话后更新 currentSessionId
    setTimeout(async () => {
      const prevIds = new Set(aiSessionList.value.map(s => s.id))
      await loadAISessionList()
      if (!aiCurrentSessionId.value) {
        // 首轮对话：找到新增的会话
        const newSession = aiSessionList.value.find(s => !prevIds.has(s.id))
        if (newSession) aiCurrentSessionId.value = newSession.id
      }
    }, 1500)
  }
}

onMounted(async () => {
  // 从后端加载题目数据
  const numId = getProblemNumericId()
  if (numId > 0) {
    try {
      const res = await teacherAPI.getProblem(numId)
      const raw = res?.problem
      if (raw) {
        problem.value = adaptProblem(raw)
        // 保存原始字段供编辑弹窗使用
        problem.value.rawShowcase = raw.showcase || ''
        problem.value.rawTestCases = raw.test_cases || ''
        problem.value.titleSlug = raw.title_slug || ''
        problem.value.constraints = raw.constraints || ''
      } else {
        problemLoadError.value = '题目数据为空'
        ElMessage.error('题目数据为空')
      }
    } catch (e) {
      problemLoadError.value = '题目加载失败：' + (e?.message || e)
      ElMessage.error('题目加载失败')
    }

    // 加载历史运行记录（最新10条，倒序）
    try {
      const recordsRes = await teacherAPI.getCodeRunRecords(numId)
      const records = recordsRes?.data?.records || recordsRes?.records || []
      records.forEach(r => {
        // 只展示 submit 类型的记录
        if (r.run_type !== 'submit') return

        const statusInfo = RUN_STATUS_MAP[r.status] || { statusKey: 're', message: '未知状态' }
        const timeCost = r.time_cost || 0
        const memUsed = r.memory_used ? (r.memory_used / 1024).toFixed(1) : null

        // 解析 output 构建 message 和 caseResults
        let recordMessage = r.error_msg || statusInfo.message || ''
        let caseResults = []
        try {
          const parsed = JSON.parse(r.output || '[]')
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].index !== undefined) {
            caseResults = parsed
            const passedCount = parsed.filter(c => c.passed).length
            const total = parsed.length
            const firstFail = parsed.find(c => !c.passed)
            if (firstFail) {
              const failStatus = firstFail.status === 'wrong_answer' ? '答案错误'
                : firstFail.status === 'runtime_error' ? '运行错误'
                : firstFail.status === 'time_limit_exceeded' ? '执行超时'
                : firstFail.status === 'compile_error' ? '编译错误' : '错误'
              recordMessage = `${passedCount}/${total} 通过\n\n测试点 ${firstFail.index}：${failStatus}\n输入：${firstFail.input}\n预期输出：${firstFail.expected_output}\n实际输出：${firstFail.actual_output || '(无输出)'}${firstFail.error_msg ? '\n错误信息：' + firstFail.error_msg : ''}`
            } else {
              recordMessage = `${passedCount}/${total} 通过`
            }
          }
        } catch (e) { /* 非 JSON */ }

        const cfg = STATUS_CONFIG[statusInfo.statusKey] || STATUS_CONFIG.pending
        runRecords.value.push({
          id: r.run_id,
          statusKey: cfg.key,
          statusLabel: cfg.label,
          tagType: cfg.tagType,
          langLabel: languages.find(l => l.value === r.language)?.label || r.language,
          langValue: r.language || '',
          datetime: r.created_at,
          timeCost,
          memory: memUsed,
          message: recordMessage,
          code: r.code,
          showCode: false,
          status: r.status,
          caseResults,
        })
      })
    } catch (e) {
      // 加载历史记录失败不影响主流程，静默处理
      console.warn('加载历史运行记录失败:', e)
    }
  } else {
    problemLoadError.value = '题目ID无效'
  }
  problemLoading.value = false

  nextTick(() => {
    syncScroll()
    updateScrollbar()
  })

  // 如果路由携带 sessionId 参数（从收藏页跳转），自动打开AI答疑面板并加载对应会话
  const targetSessionId = route.query.sessionId
  if (targetSessionId) {
    aiDrawerVisible.value = true
    await loadAIModels()
    await loadAISessionList()
    await loadAISession(targetSessionId)
    nextTick(() => {
      scrollAIToBottom()
    })
  }
})

// ==================== 教师端：编辑题目 ====================
const editProblemVisible = ref(false)
const editProblemSaving = ref(false)
const editProblemForm = ref(null)

const openEditProblemDialog = () => {
  if (!problem.value || !problem.value.id) {
    ElMessage.warning('题目信息未加载')
    return
  }
  // 将当前题目数据填入表单
  // description 是已去掉输入输出格式的 cleanDesc，需要重新组合
  let fullDesc = problem.value.description || ''
  if (problem.value.inputFormat) fullDesc += `\n\n### 输入格式\n${problem.value.inputFormat}`
  if (problem.value.outputFormat) fullDesc += `\n\n### 输出格式\n${problem.value.outputFormat}`
  
  editProblemForm.value = {
    id: problem.value.id,
    title: problem.value.title || '',
    title_slug: problem.value.titleSlug || '',
    difficulty: problem.value.difficulty || '简单',
    tags: Array.isArray(problem.value.tags) ? problem.value.tags.join(',') : (problem.value.tags || ''),
    description: fullDesc.trim(),
    input_format: problem.value.inputFormat || '',
    output_format: problem.value.outputFormat || '',
    hint: problem.value.hint || '',
    constraints: problem.value.constraints || '',
    time_limit: problem.value.timeLimit || 1000,
    memory_limit: problem.value.memoryLimit || 256,
    showcase: problem.value.rawShowcase || '',
    test_cases: problem.value.rawTestCases || ''
  }
  editProblemVisible.value = true
}

const saveEditProblem = async () => {
  if (!editProblemForm.value?.id) return
  if (!editProblemForm.value.title.trim()) {
    ElMessage.warning('题目标题不能为空')
    return
  }
  editProblemSaving.value = true
  try {
    const payload = {
      id: editProblemForm.value.id,
      title: editProblemForm.value.title,
      title_slug: editProblemForm.value.title_slug,
      difficulty: editProblemForm.value.difficulty,
      tags: editProblemForm.value.tags,
      description: editProblemForm.value.description,
      hint: editProblemForm.value.hint,
      constraints: editProblemForm.value.constraints,
      time_limit: editProblemForm.value.time_limit,
      memory_limit: editProblemForm.value.memory_limit,
      showcase: editProblemForm.value.showcase,
      test_cases: editProblemForm.value.test_cases
    }
    await teacherAPI.updateProblem(payload)
    ElMessage.success('题目更新成功')
    editProblemVisible.value = false
    // 重新加载题目
    const numId = getProblemNumericId()
    if (numId > 0) {
      const res = await teacherAPI.getProblem(numId)
      const raw = res?.data?.problem || res?.problem
      if (raw) {
        // 保存原始 showcase/test_cases 供下次编辑使用
        raw._rawShowcase = raw.showcase
        raw._rawTestCases = raw.test_cases
        problem.value = adaptProblem(raw)
        problem.value.rawShowcase = raw._rawShowcase
        problem.value.rawTestCases = raw._rawTestCases
      }
    }
  } catch (e) {
    ElMessage.error('更新失败: ' + (e?.message || e))
  } finally {
    editProblemSaving.value = false
  }
}
</script>

<style scoped lang="scss">
/* ===== 整体布局 ===== */
.problem-code-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #1e1e2e;
  overflow: hidden;
  /* 默认暗黑，主题变量由 .theme-dark/.theme-light 提供 */
}

/* ===== 顶部导航 ===== */
.top-nav {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 20px;
  background: #16213e;
  border-bottom: 1px solid #2d2d4e;
  flex-shrink: 0;
  height: 52px;

  .nav-title {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;

    .nav-problem-title {
      font-size: 15px;
      font-weight: 600;
      color: #e2e8f0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .nav-meta {
    display: flex;
    align-items: center;
    gap: 16px;

    .meta-item {
      font-size: 13px;
      color: #94a3b8;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
}

/* ===== 主体布局 ===== */
.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ===== 左侧题目面板 ===== */
.left-panel {
  flex-shrink: 0;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 280px;
  max-width: 700px;

  .left-tabs {
    display: flex;
    border-bottom: 1px solid #ebedf0;
    flex-shrink: 0;
    background: #fff;
  }

  .left-tab-item {
    flex: 1;
    text-align: center;
    padding: 10px 0;
    font-size: 13px;
    color: #606266;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
    user-select: none;
    position: relative;

    &:hover {
      color: #409eff;
    }

    &.active {
      color: #409eff;
      font-weight: 600;
      border-bottom-color: #409eff;
    }

    .record-badge {
      display: inline-block;
      background: #409eff;
      color: #fff;
      font-size: 10px;
      border-radius: 8px;
      padding: 0 5px;
      min-width: 16px;
      text-align: center;
      line-height: 16px;
      vertical-align: middle;
      margin-left: 4px;
    }
  }

  .left-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;

    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-track {
      background: #f5f5f5;
    }
    &::-webkit-scrollbar-thumb {
      background: #ddd;
      border-radius: 3px;
    }
  }

  .records-panel {
    padding: 12px 16px;
  }
}

/* 运行记录空状态 */
.records-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #c0c4cc;

  .records-empty-icon {
    font-size: 40px;
    margin-bottom: 12px;
  }

  .records-empty-text {
    font-size: 14px;
    color: #909399;
    margin-bottom: 6px;
  }

  .records-empty-hint {
    font-size: 12px;
    color: #c0c4cc;
    text-align: center;
  }
}

/* 运行记录条目 */
.record-item {
  border: 1px solid #ebedf0;
  border-radius: 8px;
  margin-bottom: 10px;
  overflow: hidden;
  transition: border-color 0.2s;

  &.status-accepted { border-left: 3px solid #67c23a; }
  &.status-wa        { border-left: 3px solid #f56c6c; }
  &.status-tle       { border-left: 3px solid #e6a23c; }
  &.status-mle       { border-left: 3px solid #e6a23c; }
  &.status-ce        { border-left: 3px solid #f56c6c; }
  &.status-re        { border-left: 3px solid #f56c6c; }
  &.status-pending   { border-left: 3px solid #909399; }

  .record-item-header {
    padding: 10px 12px 6px;
    background: #fafafa;

    .record-status-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;

      .record-index {
        font-size: 12px;
        color: #909399;
        font-weight: 600;
      }

      .record-status-tag {
        font-size: 11px;
      }

      .record-time-cost,
      .record-memory {
        font-size: 11px;
        color: #606266;
      }
    }

    .record-meta {
      display: flex;
      align-items: center;
      gap: 10px;

      .record-lang {
        font-size: 11px;
        color: #909399;
        background: #f0f2f5;
        padding: 1px 6px;
        border-radius: 4px;
      }

      .record-datetime {
        font-size: 11px;
        color: #c0c4cc;
      }
    }
  }

  .record-detail {
    padding: 8px 12px;
    background: #fff;
    border-top: 1px solid #f0f0f0;

    .record-message {
      margin: 0;
      font-size: 12px;
      font-family: 'Courier New', monospace;
      white-space: pre-wrap;
      line-height: 1.5;
      &.record-message--success { color: #67c23a; }
      &.record-message--error   { color: #f56c6c; }
    }
  }

  .record-actions {
    display: flex;
    align-items: center;
    border-top: 1px solid #f0f0f0;
  }

  .record-code-toggle {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    font-size: 12px;
    color: #409eff;
    cursor: pointer;
    background: #fff;
    user-select: none;
    flex: 1;

    &:hover {
      background: #f5f7fa;
    }
  }

  .record-chat-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    font-size: 12px;
    color: #67c23a;
    cursor: pointer;
    background: #fff;
    user-select: none;
    border-left: 1px solid #f0f0f0;
    white-space: nowrap;

    &:hover {
      background: #f0f9eb;
      color: #529b2e;
    }
  }

  .record-code-block {
    border-top: 1px solid #f0f0f0;
    background: #1e1e2e;
    max-height: 300px;
    overflow-y: auto;

    .record-code-pre {
      margin: 0;
      padding: 12px 14px;
      font-size: 12px;
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      color: #cdd6f4;
      white-space: pre;
      line-height: 1.6;
    }
  }
}

.problem-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;

  .problem-title-text {
    font-size: 20px;
    font-weight: 700;
    color: #303133;
    margin-bottom: 12px;
    line-height: 1.4;
  }

  .problem-meta-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 10px;

    .meta-chip {
      font-size: 13px;
      color: #606266;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  .problem-tags-row {
    display: flex;
    flex-wrap: wrap;
  }
}

.detail-section {
  margin-bottom: 20px;

  .detail-section-title {
    font-size: 14px;
    font-weight: 700;
    color: #303133;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 2px solid #f0f0f0;
  }

  .detail-section-content {
    font-size: 13px;
    color: #606266;
    line-height: 1.8;
    white-space: pre-line;

    :deep(code) {
      background: #f5f7fa;
      padding: 2px 5px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      color: #e6a23c;
      font-size: 12px;
    }

    :deep(strong) {
      color: #303133;
      font-weight: 600;
    }
  }
}

.sample-block {
  margin-bottom: 14px;

  .sample-row {
    display: flex;
    gap: 10px;

    .sample-col {
      flex: 1;
      min-width: 0;

      .sample-label {
        font-size: 11px;
        color: #909399;
        margin-bottom: 4px;
      }

      .sample-code {
        background: #f5f7fa;
        border: 1px solid #ebedf0;
        border-radius: 6px;
        padding: 10px 12px;
        font-size: 12px;
        font-family: 'Courier New', monospace;
        color: #303133;
        margin: 0;
        white-space: pre-wrap;
        word-break: break-all;
        min-height: 40px;
      }
    }
  }

  .sample-explanation {
    margin-top: 6px;
    font-size: 12px;
    color: #909399;
    padding: 6px 10px;
    background: #fafafa;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

/* ===== 可拖拽分隔线 ===== */
.divider {
  width: 5px;
  background: #2d2d4e;
  flex-shrink: 0;
  cursor: col-resize;
  transition: background 0.15s;
  position: relative;

  &:hover, &:active {
    background: #4a5568;
  }

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 3px;
    height: 40px;
    background: #4a5568;
    border-radius: 2px;
    opacity: 0;
    transition: opacity 0.15s;
  }

  &:hover::after {
    opacity: 1;
  }
}

/* ===== 右侧 IDE ===== */
.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  position: relative;
  transition: background 0.2s;
}

/* ===== 暗黑主题变量 ===== */
.theme-dark {
  --ide-bg:          #1e1e2e;
  --ide-bar-bg:      #16213e;
  --ide-border:      #2d2d4e;
  --ide-text:        #cdd6f4;
  --ide-linenum:     #4a5568;
  --ide-scrollbar:   #3d4a6b;
  --ide-scrollbar-h: #5a6a8e;
  --ide-scrollbar-a: #7a8aae;
  --ide-stats:       #64748b;
  --ide-caret:       #cdd6f4;
  --ide-result-out:  #a6e3a1;
  --hl-keyword:      #89b4fa;
  --hl-string:       #a6e3a1;
  --hl-comment:      #6c7086;
  --hl-number:       #fab387;
}

/* ===== 明亮主题变量 ===== */
.theme-light {
  --ide-bg:          #f8f9fc;
  --ide-bar-bg:      #eef0f6;
  --ide-border:      #d0d5e8;
  --ide-text:        #24283b;
  --ide-linenum:     #9aa0b8;
  --ide-scrollbar:   #c0c8e0;
  --ide-scrollbar-h: #a0a8c8;
  --ide-scrollbar-a: #8090b8;
  --ide-stats:       #8890a8;
  --ide-caret:       #24283b;
  --ide-result-out:  #2d8a4e;
  --hl-keyword:      #0550ae;
  --hl-string:       #116329;
  --hl-comment:      #8b949e;
  --hl-number:       #c05000;
}

/* IDE 工具栏 */
.ide-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--ide-bar-bg);
  border-bottom: 1px solid var(--ide-border);
  flex-shrink: 0;
  transition: background 0.2s, border-color 0.2s;

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .lang-hint {
      font-size: 12px;
      color: var(--ide-stats);
    }
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

/* 代码编辑区 */
.ide-editor-wrap {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
  font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', Consolas, monospace;
  font-size: 14px;
  line-height: 1.6;
  background: var(--ide-bg);
  transition: background 0.2s;
}

/* 行号 */
.line-numbers {
  width: 52px;
  flex-shrink: 0;
  background: var(--ide-bar-bg);
  border-right: 1px solid var(--ide-border);
  padding: 16px 0;
  overflow: hidden;
  user-select: none;
  transition: background 0.2s, border-color 0.2s;

  .line-num {
    height: calc(14px * 1.6);
    line-height: calc(14px * 1.6);
    text-align: right;
    padding-right: 12px;
    font-size: 13px;
    color: var(--ide-linenum);
    font-family: inherit;
  }
}

/* 高亮层 */
.highlight-layer {
  position: absolute;
  left: 52px;
  top: 0;
  right: 0;
  bottom: 0;
  margin: 0;
  padding: 16px 16px 16px 16px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  color: var(--ide-text);
  background: transparent;
  white-space: pre;
  overflow: hidden;
  pointer-events: none;
  word-break: normal;
  tab-size: 4;
  border: none;
  outline: none;
  box-sizing: border-box;

  /* 语法高亮颜色 */
  :deep(.hl-keyword) {
    color: var(--hl-keyword);
    font-weight: 500;
  }

  :deep(.hl-string) {
    color: var(--hl-string);
  }

  :deep(.hl-comment) {
    color: var(--hl-comment);
    font-style: italic;
  }

  :deep(.hl-number) {
    color: var(--hl-number);
  }

  /* 行末填充空格：不可见，仅用于撑开行宽 */
  :deep(.line-pad) {
    display: inline-block;
    min-width: 200px;
    color: transparent;
    user-select: none;
    pointer-events: none;
  }
}

/* 点击拦截层：覆盖在 textarea 上方，捕获鼠标点击 */
.click-interceptor {
  position: absolute;
  left: 52px;
  top: 0;
  right: 16px; /* 为滚动条留出空间 */
  bottom: 0;
  z-index: 2;
  cursor: text;
}

/* 自定义垂直滚动条 */
.custom-scrollbar-v {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 8px;
  background: var(--ide-bar-bg);
  z-index: 10;
  border-left: 1px solid var(--ide-border);
  cursor: pointer;
  transition: background 0.2s;

  .scrollbar-thumb-v {
    position: absolute;
    left: 1px;
    right: 1px;
    background: var(--ide-scrollbar);
    border-radius: 4px;
    transition: background 0.15s;
    cursor: grab;

    &:hover {
      background: var(--ide-scrollbar-h);
    }

    &:active {
      cursor: grabbing;
      background: var(--ide-scrollbar-a);
    }
  }
}

/* 真实 textarea */
.code-textarea {
  position: absolute;
  left: 52px;
  top: 0;
  right: 0;
  bottom: 0;
  padding: 16px 16px 16px 16px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  color: transparent;
  caret-color: var(--ide-caret);
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  white-space: pre;
  overflow: hidden;  /* 禁止 textarea 自身滚动，由 onEditorWheel 手动控制 */
  word-break: normal;
  tab-size: 4;
  box-sizing: border-box;
  z-index: 1;
  pointer-events: none; /* 鼠标事件交给 click-interceptor 处理 */
}

/* IDE 底部 */
.ide-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: var(--ide-bar-bg);
  border-top: 1px solid var(--ide-border);
  flex-shrink: 0;
  transition: background 0.2s, border-color 0.2s;

  .footer-left {
    .code-stats {
      font-size: 12px;
      color: var(--ide-stats);
    }
  }

  .footer-right {
    display: flex;
    gap: 10px;
  }
}

/* 结果面板 */
.result-panel {
  position: absolute;
  bottom: 56px;
  left: 0;
  right: 0;
  background: var(--ide-bar-bg);
  border-top: 2px solid var(--ide-border);
  max-height: 340px;
  display: flex;
  flex-direction: column;
  z-index: 10;
  transition: background 0.2s;

  .result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    border-bottom: 1px solid var(--ide-border);

    .result-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--ide-text);
    }

    .result-close {
      cursor: pointer;
      color: var(--ide-stats);
      font-size: 16px;

      &:hover {
        color: var(--ide-text);
      }
    }
  }

  .result-body {
    flex: 1;
    overflow-y: auto;
    padding: 10px 14px;

    .result-output {
      margin-top: 8px;
      font-size: 13px;
      font-family: 'Courier New', monospace;
      color: var(--ide-result-out);
      white-space: pre-wrap;
      line-height: 1.6;
    }
  }
}

/* 测试 case 可视化 */
.test-case-item {
  border-radius: 6px;
  margin-bottom: 8px;
  overflow: hidden;
  border: 1px solid var(--ide-border);

  &.case-pass { border-left: 3px solid #67c23a; }
  &.case-fail  { border-left: 3px solid #f56c6c; }

  .case-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    background: rgba(255,255,255,0.04);
    border-bottom: 1px solid var(--ide-border);

    .case-icon { font-size: 14px; font-weight: 700; }
    .case-title { font-size: 12px; font-weight: 600; color: var(--ide-text); }
    .case-time  { font-size: 11px; color: var(--ide-stats); margin-left: 4px; }
  }

  .case-body {
    padding: 8px 10px;

    .case-row { display: flex; gap: 8px; }

    .case-col {
      flex: 1;
      min-width: 0;

      .case-label {
        font-size: 10px;
        color: var(--ide-stats);
        margin-bottom: 3px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .case-code {
        background: rgba(0,0,0,0.2);
        border: 1px solid var(--ide-border);
        border-radius: 4px;
        padding: 5px 8px;
        font-size: 12px;
        font-family: 'Courier New', monospace;
        color: var(--ide-text);
        margin: 0;
        white-space: pre-wrap;
        word-break: break-all;
        min-height: 28px;
        line-height: 1.5;

        &.case-expected      { color: #94a3b8; }
        &.case-actual-pass   { color: #67c23a; border-color: rgba(103,194,58,0.3); }
        &.case-actual-fail   { color: #f56c6c; border-color: rgba(245,108,108,0.3); }
      }
    }
  }

  .case-error-msg {
    margin-top: 6px;
    padding: 5px 8px;
    background: rgba(245,108,108,0.1);
    border-radius: 4px;
    font-size: 11px;
    font-family: 'Courier New', monospace;
    color: #f56c6c;
    white-space: pre-wrap;
    line-height: 1.5;
  }
}

/* Element Plus 按钮在深色背景下的适配 */
:deep(.el-button--small) {
  font-size: 12px;
}

/* ===== AI 答疑悬浮按钮 ===== */
.ai-fab {
  position: fixed;
  right: 24px;
  bottom: 80px;
  z-index: 999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, #4F6EF7 0%, #60A5FA 100%);
  color: white;
  border-radius: 28px;
  padding: 10px 16px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(79, 110, 247, 0.5);
  transition: all 0.3s ease;
  user-select: none;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(79, 110, 247, 0.6);
  }

  .ai-fab-icon { font-size: 22px; line-height: 1; }
  .ai-fab-text { font-size: 12px; font-weight: 600; }
}

/* ===== AI 答疑抽屉 ===== */
:deep(.ai-chat-drawer) {
  .el-drawer__body { padding: 0; overflow: hidden; }
}

.ai-drawer-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8f9ff;
}

.ai-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: linear-gradient(135deg, #4F6EF7 0%, #60A5FA 100%);
  color: white;
  flex-shrink: 0;
  box-shadow: 0 2px 12px rgba(79, 110, 247, 0.3);

  .ai-drawer-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    .ai-title-icon { font-size: 20px; }
  }

  .ai-drawer-actions {
    display: flex;
    gap: 8px;
    :deep(.el-button) {
      color: white;
      border-color: rgba(255,255,255,0.4);
      background: rgba(255,255,255,0.15);
      border-radius: 8px;
      &:hover { background: rgba(255,255,255,0.28); }
    }
  }
}

.ai-context-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #e8eeff;
  border-bottom: 1px solid #d0d8ff;
  font-size: 12px;
  color: #5a6ea0;
  flex-shrink: 0;
  .el-icon { color: #4F6EF7; flex-shrink: 0; }
  strong { color: #3a4a8a; }
}

/* 历史会话列表 */
.ai-session-list {
  flex-shrink: 0;
  border-bottom: 1px solid #dde0f5;
  background: #f8f9ff;

  .ai-session-list-title {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 7px 14px 5px;
    font-size: 11px;
    font-weight: 600;
    color: #4F6EF7;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    .el-icon { font-size: 12px; }
    .ai-session-list-close {
      margin-left: auto;
      font-size: 11px;
      color: #909399;
      cursor: pointer;
      text-transform: none;
      letter-spacing: 0;
      font-weight: 400;
      &:hover { color: #4F6EF7; }
    }
  }

  .ai-session-list-scroll {
    max-height: 120px;
    overflow-y: auto;
    padding: 0 8px 6px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: #c0c8e8; border-radius: 2px; }
  }

  .ai-session-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px 10px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;

    &:hover {
      background: #e8eeff;
      border-color: rgba(79, 110, 247, 0.2);
    }

    &.active {
      background: linear-gradient(135deg, #e8eeff, #f0f4ff);
      border-color: #4F6EF7;
    }

    .ai-session-item-title {
      font-size: 12px;
      color: #303133;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
      min-width: 0;
    }

    .ai-session-item-time {
      font-size: 10px;
      color: #909399;
      flex-shrink: 0;
      margin-left: 6px;
    }
  }
}

.ai-model-selector {
  padding: 8px 14px;
  background: linear-gradient(to bottom, #f0f2ff, #f8f9ff);
  border-bottom: 1px solid #dde0f5;
  flex-shrink: 0;

  .ai-model-selector-top {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ai-model-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #5a6ea0;
    white-space: nowrap;
    flex-shrink: 0;
    font-weight: 500;
    .el-icon { color: #4F6EF7; }
  }

  .qwen-auto-tip {
    font-size: 12px;
    color: #909399;
    font-style: italic;
  }

  .ai-model-select {
    flex: 1;
    :deep(.el-input__wrapper) {
      background: white;
      border-radius: 8px;
      border: 1px solid #d0d8f0;
      box-shadow: none;
      transition: all 0.2s;
      &:hover { border-color: #4F6EF7; }
    }
    :deep(.el-input__inner) {
      font-size: 13px;
      font-weight: 600;
      color: #3a4a8a;
    }
  }

  .ai-model-desc-bar {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 7px;
    padding: 5px 10px;
    background: rgba(79, 110, 247, 0.07);
    border-radius: 6px;
    border: 1px solid rgba(79, 110, 247, 0.15);
    font-size: 11px;
    color: #4F6EF7;
    line-height: 1.5;
    .el-icon { flex-shrink: 0; font-size: 12px; }
  }

  .ai-deep-think-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 7px;
    padding: 5px 10px;
    background: rgba(230, 162, 60, 0.07);
    border-radius: 6px;
    border: 1px solid rgba(230, 162, 60, 0.2);
    font-size: 12px;
    color: #e6a23c;
  }
}

.ai-model-option {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 3px 0;

  .ai-model-option-header {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .ai-model-option-name {
    font-size: 13px;
    font-weight: 600;
    color: #303133;
  }

  .ai-model-option-tag {
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 10px;
    font-weight: 500;
    &.doubao {
      background: rgba(255, 107, 53, 0.1);
      color: #e05a2b;
    }
    &.qwen {
      background: rgba(79, 110, 247, 0.1);
      color: #4F6EF7;
    }
  }

  .ai-model-option-desc {
    font-size: 11px;
    color: #909399;
    line-height: 1.4;
  }
}

.ai-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-thumb { background: #c0c8e8; border-radius: 3px; }
}

.ai-welcome {
  text-align: center;
  padding: 40px 20px;
  color: #8090b0;
  .ai-welcome-icon { font-size: 48px; margin-bottom: 12px; }
  .ai-welcome-text { font-size: 16px; font-weight: 600; color: #5a6ea0; margin-bottom: 8px; }
  .ai-welcome-sub { font-size: 13px; line-height: 1.6; }
}

.ai-msg-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;

  &.user {
    flex-direction: row-reverse;
    .ai-msg-bubble {
      background: linear-gradient(135deg, #4F6EF7 0%, #60A5FA 100%);
      color: white;
      border-radius: 16px 4px 16px 16px;
      .ai-msg-time { color: rgba(255,255,255,0.7); }
    }
  }

  &.assistant {
    .ai-msg-bubble {
      background: white;
      border-radius: 4px 16px 16px 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
  }

  .ai-msg-avatar {
    font-size: 22px;
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

.ai-msg-bubble {
    max-width: 80%;
    padding: 12px 16px;

    .ai-think-block {
      margin-bottom: 8px;
      border: 1px solid rgba(79, 110, 247, 0.25);
      border-radius: 8px;
      overflow: hidden;
      background: rgba(79, 110, 247, 0.04);

      .ai-think-header {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 7px 12px;
        cursor: pointer;
        background: rgba(79, 110, 247, 0.08);
        user-select: none;
        &:hover { background: rgba(79, 110, 247, 0.14); }
        .ai-think-icon { font-size: 13px; }
        .ai-think-title { font-size: 12px; font-weight: 600; color: #4F6EF7; flex: 1; }
        .ai-think-toggle { font-size: 11px; color: #909399; }
      }

      .ai-think-content {
        padding: 8px 12px;
        font-size: 12px;
        line-height: 1.7;
        color: #606266;
        border-top: 1px dashed rgba(79, 110, 247, 0.2);
        white-space: pre-wrap;
        word-wrap: break-word;
      }
    }

    .ai-msg-text {
      font-size: 14px;
      line-height: 1.7;
      word-break: break-word;
      :deep(.ai-code-block) {
        background: #1e1e2e;
        color: #cdd6f4;
        border-radius: 8px;
        padding: 12px;
        margin: 8px 0;
        overflow-x: auto;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        line-height: 1.5;
      }
      :deep(.ai-inline-code) {
        background: rgba(79, 110, 247, 0.12);
        color: #4F6EF7;
        padding: 1px 5px;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-size: 13px;
      }
    }

    .ai-msg-image {
      max-width: 100%;
      max-height: 200px;
      border-radius: 8px;
      object-fit: contain;
    }

    .ai-msg-time {
      font-size: 11px;
      color: #a0aec0;
      margin-top: 4px;
      text-align: right;
    }

    .ai-loading-dots {
      display: flex;
      gap: 5px;
      padding: 4px 0;
      span {
        width: 8px;
        height: 8px;
        background: #4F6EF7;
        border-radius: 50%;
        animation: ai-bounce 1.4s infinite ease-in-out both;
        &:nth-child(1) { animation-delay: -0.32s; }
        &:nth-child(2) { animation-delay: -0.16s; }
      }
    }
  }
}

@keyframes ai-bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.ai-input-area {
  border-top: 1px solid #e0e6f0;
  padding: 12px 14px;
  background: white;
  flex-shrink: 0;
}

.ai-pending-record {
  margin-bottom: 8px;
  .ai-pending-record-card {
    background: #f0f9eb;
    border: 1px solid #e1f3d8;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 13px;
  }
  .ai-pending-record-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
  }
  .ai-pending-record-icon {
    font-size: 16px;
  }
  .ai-pending-record-title {
    font-weight: 600;
    color: #333;
  }
  .ai-pending-record-close {
    margin-left: auto;
    cursor: pointer;
    font-size: 18px;
    color: #999;
    line-height: 1;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    &:hover {
      background: #fde2e2;
      color: #f56c6c;
    }
  }
  .ai-pending-record-body {
    color: #666;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .ai-pending-record-sep {
    color: #ccc;
  }
}

.ai-pending-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
  .ai-pending-img-wrap {
    position: relative;
    .ai-pending-img {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 6px;
      border: 2px solid #4F6EF7;
    }
    .ai-pending-img-remove {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 18px;
      height: 18px;
      background: #f56c6c;
      color: white;
      border-radius: 50%;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
  }
}

.ai-input-row {
  .ai-textarea {
    width: 100%;
    border: 1.5px solid #d0d8f0;
    border-radius: 10px;
    padding: 10px 12px;
    font-size: 14px;
    line-height: 1.6;
    resize: none;
    outline: none;
    font-family: inherit;
    color: #303133;
    background: #f8f9ff;
    box-sizing: border-box;
    transition: border-color 0.2s;
    &:focus { border-color: #4F6EF7; background: white; }
    &::placeholder { color: #b0bcd0; font-size: 13px; }
  }
}

.ai-input-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  .ai-input-footer-left {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .ai-input-hint { font-size: 11px; color: #a0aec0; }
  :deep(.el-button--primary) {
    background: linear-gradient(135deg, #4F6EF7 0%, #60A5FA 100%);
    border: none;
    padding: 6px 18px;
  }
}

/* AI答疑模型选项下拉（全局，popper在body下） */
:global(.ai-model-select-popper .el-select-dropdown__item) {
  height: auto !important;
  padding: 8px 12px !important;
  line-height: 1 !important;
}

/* 历史会话展开/收起过渡动画 */
.ai-session-slide-enter-active,
.ai-session-slide-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.ai-session-slide-enter-from,
.ai-session-slide-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.ai-session-slide-enter-to,
.ai-session-slide-leave-from {
  max-height: 200px;
  opacity: 1;
}
</style>
