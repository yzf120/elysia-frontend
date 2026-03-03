<template>
  <div class="problem-code-page">

    <!-- 顶部导航 -->
    <van-nav-bar
      :title="problem.title"
      left-arrow
      @click-left="goBack"
      fixed
      placeholder
    >
      <template #right>
        <van-tag :class="'diff-tag-' + problem.difficulty" size="medium">
          {{ difficultyLabel(problem.difficulty) }}
        </van-tag>
      </template>
    </van-nav-bar>

    <!-- Tab 切换：题目 / 代码 -->
    <van-tabs v-model:active="activeTab" sticky offset-top="46px" class="main-tabs">

      <!-- ===== Tab 1：题目详情 ===== -->
      <van-tab title="题目" name="problem">
        <!-- 左侧内容 Tab -->
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
        <div v-show="leftTab === 'problem'" class="tab-body">

          <!-- 加载状态 -->
          <div v-if="problemLoading" style="text-align:center;padding:40px 0;color:#999;">
            <van-loading size="24px">题目加载中...</van-loading>
          </div>
          <!-- 加载错误 -->
          <div v-else-if="problemLoadError" style="text-align:center;padding:40px 16px;color:#ee0a24;">
            {{ problemLoadError }}
          </div>

          <!-- 题目内容（加载完成后显示） -->
          <template v-else>

          <!-- 题目头部信息 -->
          <div class="problem-header">
            <div class="problem-meta-row">
              <van-tag :class="'diff-tag-' + problem.difficulty" size="medium">
                {{ difficultyLabel(problem.difficulty) }}
              </van-tag>
              <span class="meta-item"><van-icon name="clock-o" /> {{ problem.timeLimit }}ms</span>
              <span class="meta-item"><van-icon name="orders-o" /> {{ problem.memoryLimit }}MB</span>
            </div>
            <div class="problem-tags-row">
              <van-tag
                v-for="tag in problem.tags"
                :key="tag"
                plain
                type="primary"
                size="medium"
                style="margin-right:6px;margin-bottom:4px"
              >{{ tag }}</van-tag>
            </div>
          </div>

          <!-- 题目描述 -->
          <div class="detail-section">
            <div class="section-title-bar">📝 题目描述</div>
            <div class="section-content" v-html="problem.description"></div>
          </div>

          <!-- 输入格式 -->
          <div class="detail-section">
            <div class="section-title-bar">📥 输入格式</div>
            <div class="section-content">{{ problem.inputFormat }}</div>
          </div>

          <!-- 输出格式 -->
          <div class="detail-section">
            <div class="section-title-bar">📤 输出格式</div>
            <div class="section-content">{{ problem.outputFormat }}</div>
          </div>

          <!-- 输入输出样例 -->
          <div class="detail-section">
            <div class="section-title-bar">💡 输入输出样例</div>
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
                <strong>说明：</strong>{{ sample.explanation }}
              </div>
            </div>
          </div>

          <!-- 提示 -->
          <div v-if="problem.hint" class="detail-section">
            <div class="section-title-bar">🔔 提示</div>
            <van-notice-bar
              :text="problem.hint"
              color="#409eff"
              background="#ecf5ff"
              left-icon="info-o"
              wrapable
              :scrollable="false"
            />
          </div>

          <!-- 底部去作答按钮 -->
          <div class="tab-footer">
            <van-button type="primary" block round @click="activeTab = 'code'">
              <van-icon name="edit" /> 去写代码
            </van-button>
          </div>

          </template>

        </div>

        <!-- 运行记录内容 -->
        <div v-show="leftTab === 'records'" class="tab-body records-panel">
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
                <van-tag :type="record.vanTagType" size="medium" class="record-status-tag">{{ record.statusLabel }}</van-tag>
                <span class="record-time-cost" v-if="record.timeCost">⏱ {{ record.timeCost }}ms</span>
                <span class="record-memory" v-if="record.memory">💾 {{ record.memory }}MB</span>
              </div>
              <div class="record-meta">
                <span class="record-lang">{{ record.langLabel }}</span>
                <span class="record-datetime">{{ record.datetime }}</span>
              </div>
            </div>
            <div class="record-detail" v-if="record.message">
              <pre class="record-message">{{ record.message }}</pre>
            </div>
            <div class="record-code-toggle" @click="toggleRecordCode(record)">
              <van-icon :name="record.showCode ? 'arrow-up' : 'arrow-down'" />
              {{ record.showCode ? '收起代码' : '查看代码' }}
            </div>
            <div v-if="record.showCode" class="record-code-block">
              <pre class="record-code-pre">{{ record.code }}</pre>
            </div>
          </div>
        </div>

      </van-tab>

      <!-- ===== Tab 2：代码编辑 ===== -->
      <van-tab title="代码" name="code">
        <div class="ide-container" :class="isDark ? 'theme-dark' : 'theme-light'">

          <!-- IDE 工具栏 -->
          <div class="ide-toolbar">
            <van-dropdown-menu active-color="#667eea" class="lang-dropdown">
              <van-dropdown-item
                v-model="selectedLang"
                :options="langOptions"
                @change="onLangChange"
              />
            </van-dropdown-menu>
            <span class="lang-hint">{{ langHint }}</span>
            <van-button size="mini" plain @click="toggleTheme" style="margin-left:auto;margin-right:6px" :title="isDark ? '切换为明亮' : '切换为暗黑'">
              {{ isDark ? '☀️' : '🌙' }}
            </van-button>
            <van-button size="mini" plain @click="resetCode">
              <van-icon name="replay" /> 重置
            </van-button>
          </div>

          <!-- 代码编辑区 -->
          <div class="ide-editor-wrap" ref="editorWrap" @wheel.prevent="onEditorWheel">
            <!-- 行号 -->
            <div class="line-numbers" ref="lineNumbersEl">
              <div
                v-for="n in lineCount"
                :key="n"
                class="line-num"
              >{{ n }}</div>
            </div>
            <!-- 高亮层 -->
            <pre
              class="highlight-layer"
              ref="highlightEl"
              aria-hidden="true"
              v-html="highlightedCode"
            ></pre>
            <!-- 点击拦截层 -->
            <div
              class="click-interceptor"
              @mousedown.prevent="onEditorMousedown"
              @wheel.prevent="onEditorWheel"
            ></div>
            <!-- 真实 textarea -->
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

          <!-- 底部操作栏 -->
          <div class="ide-footer">
            <span class="code-stats">{{ lineCount }} 行 · {{ code.length }} 字符</span>
            <div class="footer-btns">
              <van-button size="small" plain @click="onTest" :loading="isRunning" :disabled="isRunning">
                <van-icon name="play-circle-o" /> 测试
              </van-button>
              <van-button size="small" type="primary" @click="onRun" :loading="isRunning" :disabled="isRunning">
                <van-icon name="upgrade" /> 运行
              </van-button>
            </div>
          </div>

          <!-- 结果面板 -->
          <van-popup
            v-model:show="showResult"
            position="bottom"
            round
            :style="{ height: '45%' }"
          >
            <div class="result-popup">
              <div class="result-header">
                <span class="result-title">{{ resultTitle }}</span>
                <van-icon name="cross" @click="showResult = false" />
              </div>
              <div class="result-body">
                <van-tag :type="resultStatus === 'success' ? 'success' : 'danger'" size="medium">
                  {{ resultStatus === 'success' ? '通过' : '错误' }}
                </van-tag>
                <pre class="result-output">{{ resultOutput }}</pre>
              </div>
            </div>
          </van-popup>

        </div>
      </van-tab>

    </van-tabs>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { studentAPI } from '../../api/index.js'

const route = useRoute()
const router = useRouter()

const problemId = route.params.problemId

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
  // 解析 test_cases JSON 字符串为 samples 数组
  let samples = []
  try {
    const cases = JSON.parse(raw.test_cases || '[]')
    samples = cases.map(c => ({ input: c.input || '', output: c.output || '', explanation: c.explanation || '' }))
  } catch (e) {
    samples = []
  }
  // 解析 tags 字符串为数组
  const tags = raw.tags ? raw.tags.split(',').map(t => t.trim()).filter(Boolean) : []
  // 将中文难度转换为英文（匹配 CSS 类名）
  const diffMap = { '简单': 'easy', '中等': 'medium', '困难': 'hard' }
  const difficulty = diffMap[raw.difficulty] || raw.difficulty || ''
  return {
    id: raw.id,
    title: raw.title || '',
    difficulty,
    tags,
    timeLimit: 1000,
    memoryLimit: 256,
    description: raw.description || '',
    inputFormat: '',
    outputFormat: '',
    samples,
    hint: raw.hint || ''
  }
}

// ===== 语言配置 =====
const langOptions = [
  { text: 'Python', value: 'python' },
  { text: 'Java', value: 'java' },
  { text: 'Go', value: 'go' },
  { text: 'C++', value: 'cpp' },
  { text: 'C', value: 'c' }
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
      'abstract', 'synchronized', 'System', 'out', 'println', 'Integer', 'Arrays', 'ArrayList', 'HashMap']
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

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function highlightLine(line, lang) {
  if (!lang || !highlightRules[lang]) return escapeHtml(line)
  const keywords = highlightRules[lang].keywords
  let result = ''
  let i = 0
  const len = line.length
  while (i < len) {
    if ((line[i] === '/' && line[i + 1] === '/') || (lang === 'python' && line[i] === '#')) {
      result += `<span class="hl-comment">${escapeHtml(line.slice(i))}</span>`
      break
    }
    if (line[i] === '"' || line[i] === "'") {
      const quote = line[i]
      let j = i + 1
      while (j < len && line[j] !== quote) {
        if (line[j] === '\\') j++
        j++
      }
      j++
      result += `<span class="hl-string">${escapeHtml(line.slice(i, j))}</span>`
      i = j
      continue
    }
    if (/[0-9]/.test(line[i]) && (i === 0 || !/[a-zA-Z_]/.test(line[i - 1]))) {
      let j = i
      while (j < len && /[0-9.]/.test(line[j])) j++
      result += `<span class="hl-number">${escapeHtml(line.slice(i, j))}</span>`
      i = j
      continue
    }
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
    result += escapeHtml(line[i])
    i++
  }
  return result
}

function highlightCode(code, lang) {
  if (!lang || !highlightRules[lang]) return escapeHtml(code)
  const lines = code.split('\n')
  let inBlockComment = false
  const processedLines = lines.map(line => {
    if (inBlockComment) {
      const endIdx = line.indexOf('*/')
      if (endIdx !== -1) {
        inBlockComment = false
        return `<span class="hl-comment">${escapeHtml(line.slice(0, endIdx + 2))}</span>` + highlightLine(line.slice(endIdx + 2), lang)
      }
      return `<span class="hl-comment">${escapeHtml(line)}</span>`
    }
    const blockStart = line.indexOf('/*')
    if (blockStart !== -1) {
      const blockEnd = line.indexOf('*/', blockStart + 2)
      if (blockEnd !== -1) {
        return highlightLine(line.slice(0, blockStart), lang) +
          `<span class="hl-comment">${escapeHtml(line.slice(blockStart, blockEnd + 2))}</span>` +
          highlightLine(line.slice(blockEnd + 2), lang)
      } else {
        inBlockComment = true
        return highlightLine(line.slice(0, blockStart), lang) + `<span class="hl-comment">${escapeHtml(line.slice(blockStart))}</span>`
      }
    }
    return highlightLine(line, lang)
  })
  return processedLines.join('\n')
}

// ===== 状态 =====
// ===== 左侧 Tab =====
const leftTab = ref('problem')

// ===== 运行记录 =====
const runRecords = ref([])
let recordIdCounter = 0

const STATUS_CONFIG = {
  accepted: { label: '通过',     vanTagType: 'success' },
  tle:      { label: '超时',     vanTagType: 'warning' },
  mle:      { label: '内存超限', vanTagType: 'warning' },
  ce:       { label: '编译错误', vanTagType: 'danger'  },
  re:       { label: '运行错误', vanTagType: 'danger'  },
  wa:       { label: '答案错误', vanTagType: 'danger'  },
  pending:  { label: '评测中',   vanTagType: 'default' },
}

function formatDatetime(d) {
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function addRunRecord(statusKey, opts = {}) {
  const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending
  const record = {
    id: ++recordIdCounter,
    statusKey,
    statusLabel: cfg.label,
    vanTagType: cfg.vanTagType,
    langLabel: langOptions.find(l => l.value === selectedLang.value)?.text || selectedLang.value,
    datetime: formatDatetime(new Date()),
    timeCost: opts.timeCost || null,
    memory: opts.memory || null,
    message: opts.message || '',
    code: code.value,
    showCode: false,
  }
  runRecords.value.unshift(record)
}

const toggleRecordCode = (record) => {
  record.showCode = !record.showCode
}

// ===== 主题 =====
const isDark = ref(true)
const toggleTheme = () => { isDark.value = !isDark.value }

const activeTab = ref('problem')
const selectedLang = ref('python')
const code = ref(codeTemplates['python'])
const textareaEl = ref(null)
const highlightEl = ref(null)
const lineNumbersEl = ref(null)
const editorWrap = ref(null)
const scrollbarVEl = ref(null)
const thumbVEl = ref(null)
const showResult = ref(false)
const resultTitle = ref('测试结果')
const resultStatus = ref('success')
const resultOutput = ref('')

// 滚动条滑块样式
const thumbVStyle = ref({ top: '0px', height: '40px', opacity: '0' })

// 更新滚动条滑块位置和大小
const updateScrollbar = () => {
  if (!textareaEl.value || !scrollbarVEl.value) return
  const ta = textareaEl.value
  const trackH = scrollbarVEl.value.clientHeight
  const contentH = ta.scrollHeight
  const visibleH = ta.clientHeight
  if (contentH <= visibleH) {
    thumbVStyle.value = { top: '0px', height: '0px', opacity: '0' }
    return
  }
  const thumbH = Math.max(24, (visibleH / contentH) * trackH)
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
  const trackRect = scrollbarVEl.value.getBoundingClientRect()
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

const langHint = computed(() => langHintMap[selectedLang.value] || '')
const lineCount = computed(() => code.value.split('\n').length)
const highlightedCode = computed(() => {
  const raw = highlightCode(code.value, selectedLang.value)
  // 在每行末尾追加不可见空格，使高亮层每行都有足够宽度可被选中
  return raw.split('\n').map(line => line + '<span class="line-pad"> </span>').join('\n')
})

const onLangChange = (lang) => {
  code.value = codeTemplates[lang]
  nextTick(() => syncScroll())
}

const resetCode = () => {
  code.value = codeTemplates[selectedLang.value]
}

const onCodeInput = () => {
  nextTick(() => syncScroll())
}

const syncScroll = () => {
  if (!textareaEl.value || !highlightEl.value || !lineNumbersEl.value) return
  highlightEl.value.scrollTop = textareaEl.value.scrollTop
  highlightEl.value.scrollLeft = textareaEl.value.scrollLeft
  lineNumbersEl.value.scrollTop = textareaEl.value.scrollTop
  updateScrollbar()
}

const onEditorScroll = () => syncScroll()

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
  let lo = 0, hi = text.length
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2)
    const w = ctx.measureText(text.slice(0, mid)).width
    if (w < x) lo = mid + 1
    else hi = mid
  }
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

  const lineHeightPx = 13 * 1.6  // font-size 13px * line-height 1.6
  const paddingTop = 12
  const paddingLeft = 12

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
    const font = '13px \'Courier New\', Consolas, monospace'
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
let dragAnchorPos = 0

// 点击拦截：精确计算行列，手动设置光标位置
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
    const lineStart = val.lastIndexOf('\n', start - 1) + 1
    const currentLine = val.slice(lineStart, start)
    const indentMatch = currentLine.match(/^(\s*)/)
    const indent = indentMatch ? indentMatch[1] : ''
    const charBefore = val.slice(0, start).trimEnd().slice(-1)
    const charAfter = val[end]
    const openBrackets = ['{', '(', '[']
    const closeBrackets = ['}', ')', ']']
    const isOpenBracket = openBrackets.includes(charBefore)
    const isMatchingClose = closeBrackets[openBrackets.indexOf(charBefore)] === charAfter

    if (isOpenBracket && isMatchingClose) {
      // 光标在 { } 之间：中间行缩进，关闭括号另起一行
      const innerIndent = indent + '    '
      const inserted = '\n' + innerIndent + '\n' + indent
      code.value = val.slice(0, start) + inserted + val.slice(end)
      nextTick(() => {
        const newPos = start + 1 + innerIndent.length
        ta.selectionStart = ta.selectionEnd = newPos
      })
    } else if (isOpenBracket) {
      // 行尾是开括号：回车后多缩进一级
      const innerIndent = indent + '    '
      code.value = val.slice(0, start) + '\n' + innerIndent + val.slice(end)
      nextTick(() => { ta.selectionStart = ta.selectionEnd = start + 1 + innerIndent.length })
    } else {
      // 普通回车：继承当前行缩进
      code.value = val.slice(0, start) + '\n' + indent + val.slice(end)
      nextTick(() => { ta.selectionStart = ta.selectionEnd = start + 1 + indent.length })
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
      nextTick(() => { ta.selectionStart = ta.selectionEnd = start - 1 })
    }
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
  const MAX_POLL = 30   // 最多轮询30次
  const INTERVAL = 1000 // 每次间隔1秒
  let count = 0

  const poll = async () => {
    count++
    try {
      const res = await studentAPI.getCodeRunResult(runId)
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

// 从路由参数中提取数字 problem_id（兼容 '1'、'p1' 等格式）
function getProblemNumericId() {
  const raw = String(problemId || '')
  // 如果是纯数字直接返回
  const num = parseInt(raw, 10)
  if (!isNaN(num) && num > 0) return num
  // 如果是 'p1' 格式，提取数字部分
  const match = raw.match(/\d+/)
  if (match) return parseInt(match[0], 10)
  return 0
}

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
    // 取第一个样例的输入作为测试输入
    const testInput = (problem.value.samples && problem.value.samples[0]?.input) || ''
    const submitRes = await studentAPI.submitCodeRun(pid, selectedLang.value, code.value, 'test', testInput)
    const runId = submitRes?.data?.run_id || submitRes?.run_id
    if (!runId) {
      resultOutput.value = '提交失败：' + (submitRes?.message || '未知错误')
      resultStatus.value = 'error'
      isRunning.value = false
      return
    }

    // 轮询结果
    pollCodeRunResult(runId, (result) => {
      isRunning.value = false
      const statusInfo = RUN_STATUS_MAP[result.status] || { statusKey: 're', message: '未知状态' }
      const timeCost = result.time_cost || 0
      const memUsed = result.memory_used ? (result.memory_used / 1024).toFixed(1) : null

      addRunRecord(statusInfo.statusKey, {
        timeCost,
        memory: memUsed,
        message: result.error_msg || statusInfo.message,
      })

      if (result.status === 'accepted') {
        resultStatus.value = 'success'
        resultOutput.value = `✓ 样例通过\n\n实际输出：\n${result.output || ''}\n\n执行时间：${timeCost}ms${memUsed ? '\n内存使用：' + memUsed + 'MB' : ''}`
      } else {
        resultStatus.value = 'error'
        resultOutput.value = `✗ ${statusInfo.message || result.status}\n\n${result.error_msg || ''}\n\n实际输出：\n${result.output || ''}`
      }

      // 重新打开弹窗展示结果
      showResult.value = true
      // 切换到运行记录
      activeTab.value = 'problem'
      nextTick(() => { leftTab.value = 'records' })
    })
  } catch (e) {
    isRunning.value = false
    resultStatus.value = 'error'
    resultOutput.value = '提交失败：' + (e?.message || e)
    showResult.value = true
  }
}

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
  resultOutput.value = `提交成功！\n\n语言：${langOptions.find(l => l.value === selectedLang.value)?.text}\n代码长度：${code.value.length} 字符\n\n评测中... 请稍候`
  showResult.value = true

  try {
    const submitRes = await studentAPI.submitCodeRun(pid, selectedLang.value, code.value, 'submit')
    const runId = submitRes?.data?.run_id || submitRes?.run_id
    if (!runId) {
      resultOutput.value = '提交失败：' + (submitRes?.message || '未知错误')
      resultStatus.value = 'error'
      isRunning.value = false
      return
    }

    // 轮询结果
    pollCodeRunResult(runId, (result) => {
      isRunning.value = false
      const statusInfo = RUN_STATUS_MAP[result.status] || { statusKey: 're', message: '未知状态' }
      const timeCost = result.time_cost || 0
      const memUsed = result.memory_used ? (result.memory_used / 1024).toFixed(1) : null

      addRunRecord(statusInfo.statusKey, {
        timeCost,
        memory: memUsed,
        message: result.error_msg || statusInfo.message,
      })

      if (result.status === 'accepted') {
        resultStatus.value = 'success'
        resultOutput.value = `✓ 全部通过\n\n执行时间：${timeCost}ms${memUsed ? '\n内存使用：' + memUsed + 'MB' : ''}`
      } else {
        resultStatus.value = 'error'
        resultOutput.value = `✗ ${statusInfo.message || result.status}\n\n${result.error_msg || ''}`
      }

      // 重新打开弹窗展示结果
      showResult.value = true
      // 切换到运行记录
      activeTab.value = 'problem'
      nextTick(() => { leftTab.value = 'records' })
    })
  } catch (e) {
    isRunning.value = false
    resultStatus.value = 'error'
    resultOutput.value = '提交失败：' + (e?.message || e)
    showResult.value = true
  }
}

const difficultyLabel = (diff) => {
  // 后端直接返回中文，兼容英文格式
  const map = { easy: '简单', medium: '中等', hard: '困难' }
  return map[diff] || diff || ''
}

const goBack = () => router.back()

onMounted(async () => {
  // 从后端加载题目数据
  const numId = getProblemNumericId()
  if (numId > 0) {
    try {
      const res = await studentAPI.getProblem(numId)
      const raw = res?.data?.problem || res?.problem
      if (raw) {
        problem.value = adaptProblem(raw)
      } else {
        problemLoadError.value = '题目数据为空'
      }
    } catch (e) {
      problemLoadError.value = '题目加载失败：' + (e?.message || e)
    }
  } else {
    problemLoadError.value = '题目ID无效'
  }
  problemLoading.value = false

  nextTick(() => {
    syncScroll()
    updateScrollbar()
  })
})
</script>

<style scoped>
.problem-code-page {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

/* Tab 主体 */
.main-tabs {
  flex: 1;
}

/* 左侧内容 Tab 切换 */
.left-tabs {
  display: flex;
  border-bottom: 1px solid #ebedf0;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 5;
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
}
.left-tab-item:active {
  background: #f5f5f5;
}
.left-tab-item.active {
  color: #1989fa;
  font-weight: 600;
  border-bottom-color: #1989fa;
}
.record-badge {
  display: inline-block;
  background: #1989fa;
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

.tab-body {
  padding: 12px 14px;
  padding-bottom: 30px;
}

/* 运行记录面板 */
.records-panel {
  padding: 12px 14px;
}
.records-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}
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

/* 记录条目 */
.record-item {
  border: 1px solid #ebedf0;
  border-radius: 8px;
  margin-bottom: 10px;
  overflow: hidden;
  background: #fff;
}
.record-item.status-accepted { border-left: 3px solid #07c160; }
.record-item.status-wa        { border-left: 3px solid #ee0a24; }
.record-item.status-tle       { border-left: 3px solid #ff976a; }
.record-item.status-mle       { border-left: 3px solid #ff976a; }
.record-item.status-ce        { border-left: 3px solid #ee0a24; }
.record-item.status-re        { border-left: 3px solid #ee0a24; }
.record-item.status-pending   { border-left: 3px solid #c8c9cc; }

.record-item-header {
  padding: 10px 12px 6px;
  background: #fafafa;
}
.record-status-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.record-index {
  font-size: 12px;
  color: #909399;
  font-weight: 600;
}
.record-time-cost,
.record-memory {
  font-size: 11px;
  color: #606266;
}
.record-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}
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
.record-detail {
  padding: 8px 12px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
}
.record-message {
  margin: 0;
  font-size: 12px;
  font-family: 'Courier New', monospace;
  color: #ee0a24;
  white-space: pre-wrap;
  line-height: 1.5;
}
.record-code-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  font-size: 12px;
  color: #1989fa;
  cursor: pointer;
  border-top: 1px solid #f0f0f0;
  background: #fff;
  user-select: none;
}
.record-code-block {
  border-top: 1px solid #f0f0f0;
  background: #1e1e2e;
  max-height: 260px;
  overflow-y: auto;
}
.record-code-pre {
  margin: 0;
  padding: 12px 14px;
  font-size: 12px;
  font-family: 'Courier New', monospace;
  color: #cdd6f4;
  white-space: pre;
  line-height: 1.6;
}

/* 题目头部 */
.problem-header {
  background: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 12px;
}
.problem-meta-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 8px;
}
.meta-item {
  font-size: 12px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 3px;
}
.problem-tags-row {
  display: flex;
  flex-wrap: wrap;
}

/* 难度标签 */
.diff-tag-easy { background: #e8f5e9 !important; color: #4caf50 !important; border-color: #4caf50 !important; }
.diff-tag-medium { background: #fff3e0 !important; color: #ff9800 !important; border-color: #ff9800 !important; }
.diff-tag-hard { background: #fce4ec !important; color: #e91e63 !important; border-color: #e91e63 !important; }

/* 题目详情区块 */
.detail-section {
  background: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 10px;
}
.section-title-bar {
  font-size: 14px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
}
.section-content {
  font-size: 13px;
  color: #606266;
  line-height: 1.7;
  white-space: pre-line;
}
.section-content :deep(code) {
  background: #f5f7fa;
  padding: 1px 5px;
  border-radius: 4px;
  font-family: monospace;
  color: #e6a23c;
}
.section-content :deep(strong) {
  color: #303133;
  font-weight: 600;
}

/* 样例 */
.sample-block { margin-bottom: 12px; }
.sample-row { display: flex; gap: 8px; }
.sample-col { flex: 1; min-width: 0; }
.sample-label { font-size: 11px; color: #909399; margin-bottom: 4px; }
.sample-code {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 12px;
  font-family: 'Courier New', monospace;
  color: #303133;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  border: 1px solid #ebedf0;
}
.sample-explanation {
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
  padding: 5px 8px;
  background: #fafafa;
  border-radius: 4px;
}

.tab-footer {
  margin-top: 16px;
}

/* ===== IDE 区域 ===== */
.ide-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 92px);
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
  --ide-scrollbar-a: #7a8aae;
  --ide-stats:       #64748b;
  --ide-caret:       #cdd6f4;
  --ide-result-out:  #4caf50;
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
  padding: 6px 12px;
  background: var(--ide-bar-bg);
  border-bottom: 1px solid var(--ide-border);
  flex-shrink: 0;
  gap: 10px;
  transition: background 0.2s, border-color 0.2s;
}
.lang-dropdown {
  height: 32px;
}
.lang-dropdown :deep(.van-dropdown-menu__bar) {
  background: transparent;
  box-shadow: none;
  height: 32px;
}
.lang-dropdown :deep(.van-dropdown-menu__title) {
  color: #e2e8f0;
  font-size: 13px;
  padding: 0 8px;
}
.lang-hint {
  font-size: 11px;
  color: var(--ide-stats);
}

/* 代码编辑区 */
.ide-editor-wrap {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
  font-family: 'Courier New', Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  background: var(--ide-bg);
  transition: background 0.2s;
}

/* 行号 */
.line-numbers {
  width: 44px;
  flex-shrink: 0;
  background: var(--ide-bar-bg);
  border-right: 1px solid var(--ide-border);
  padding: 12px 0;
  overflow: hidden;
  user-select: none;
  transition: background 0.2s, border-color 0.2s;
}
.line-num {
  height: calc(13px * 1.6);
  line-height: calc(13px * 1.6);
  text-align: right;
  padding-right: 10px;
  font-size: 12px;
  color: var(--ide-linenum);
  font-family: inherit;
}

/* 高亮层 */
.highlight-layer {
  position: absolute;
  left: 44px;
  top: 0;
  right: 0;
  bottom: 0;
  margin: 0;
  padding: 12px 12px;
  font-family: inherit;
  font-size: 13px;
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
}
.highlight-layer :deep(.hl-keyword) {
  color: var(--hl-keyword);
  font-weight: 500;
}
.highlight-layer :deep(.hl-string) {
  color: var(--hl-string);
}
.highlight-layer :deep(.hl-comment) {
  color: var(--hl-comment);
  font-style: italic;
}
.highlight-layer :deep(.hl-number) {
  color: var(--hl-number);
}
/* 行末填充空格：不可见，仅用于撑开行宽 */
.highlight-layer :deep(.line-pad) {
  display: inline-block;
  min-width: 200px;
  color: transparent;
  user-select: none;
  pointer-events: none;
}

/* 点击拦截层 */
.click-interceptor {
  position: absolute;
  left: 44px;
  top: 0;
  right: 8px; /* 为滚动条留出空间 */
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
  width: 6px;
  background: var(--ide-bar-bg);
  z-index: 10;
  border-left: 1px solid var(--ide-border);
  cursor: pointer;
  transition: background 0.2s;
}
.scrollbar-thumb-v {
  position: absolute;
  left: 1px;
  right: 1px;
  background: var(--ide-scrollbar);
  border-radius: 3px;
  cursor: grab;
  transition: background 0.15s;
}
.scrollbar-thumb-v:active {
  cursor: grabbing;
  background: var(--ide-scrollbar-a);
}

/* textarea */
.code-textarea {
  position: absolute;
  left: 44px;
  top: 0;
  right: 0;
  bottom: 0;
  padding: 12px 12px;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.6;
  color: transparent;
  caret-color: var(--ide-caret);
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  white-space: pre;
  overflow: hidden;  /* 禁止 textarea 自身滚动 */
  word-break: normal;
  tab-size: 4;
  box-sizing: border-box;
  z-index: 1;
  pointer-events: none; /* 鼠标事件交给 click-interceptor */
  -webkit-overflow-scrolling: touch;
}

/* IDE 底部 */
.ide-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--ide-bar-bg);
  border-top: 1px solid var(--ide-border);
  flex-shrink: 0;
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
  transition: background 0.2s, border-color 0.2s;
}
.code-stats {
  font-size: 11px;
  color: var(--ide-stats);
}
.footer-btns {
  display: flex;
  gap: 8px;
}

/* 结果弹窗 */
.result-popup {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #ebedf0;
  flex-shrink: 0;
}
.result-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}
.result-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px 16px;
}
.result-output {
  margin-top: 10px;
  font-size: 13px;
  font-family: 'Courier New', monospace;
  color: var(--ide-result-out);
  white-space: pre-wrap;
  line-height: 1.6;
}
</style>
