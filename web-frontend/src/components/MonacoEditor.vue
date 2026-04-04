<!--
  MonacoEditor.vue - Monaco Editor 封装组件
  功能：代码编辑、语法高亮、自动补全、实时语法检查、主题切换
-->
<template>
  <div ref="editorContainer" class="monaco-editor-container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as monaco from 'monaco-editor'

// 配置 Monaco Editor Web Worker（Vite 环境下必须）
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') return new jsonWorker()
    if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker()
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker()
    if (label === 'typescript' || label === 'javascript') return new tsWorker()
    return new editorWorker()
  }
}

const props = defineProps({
  /** 代码内容（v-model） */
  modelValue: { type: String, default: '' },
  /** 编程语言：python / java / go / cpp / c */
  language: { type: String, default: 'python' },
  /** 主题：dark / light */
  theme: { type: String, default: 'dark' },
  /** 是否只读 */
  readOnly: { type: Boolean, default: false },
  /** 字体大小 */
  fontSize: { type: Number, default: 14 },
  /** 语法检查函数（由父组件传入，返回 Promise<{ has_error, diagnostics }> ） */
  syntaxChecker: { type: Function, default: null },
  /** 语法检查 debounce 延迟（毫秒） */
  checkDelay: { type: Number, default: 1000 },
})

const emit = defineEmits(['update:modelValue', 'change', 'editorReady', 'diagnosticsChange'])

const editorContainer = ref(null)
let editor = null

// Monaco 语言映射
const LANG_MAP = {
  python: 'python',
  java: 'java',
  go: 'go',
  cpp: 'cpp',
  c: 'c',
}

// Monaco 主题映射
const THEME_MAP = {
  dark: 'elysia-dark',
  light: 'elysia-light',
}

// 注册自定义暗黑主题（Catppuccin Mocha 风格）
monaco.editor.defineTheme('elysia-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6c7086', fontStyle: 'italic' },
    { token: 'keyword', foreground: '89b4fa' },
    { token: 'string', foreground: 'a6e3a1' },
    { token: 'number', foreground: 'fab387' },
    { token: 'type', foreground: 'f9e2af' },
    { token: 'function', foreground: '89dceb' },
    { token: 'variable', foreground: 'cdd6f4' },
    { token: 'operator', foreground: '94e2d5' },
  ],
  colors: {
    'editor.background': '#1e1e2e',
    'editor.foreground': '#cdd6f4',
    'editor.lineHighlightBackground': '#2a2b3d',
    'editor.selectionBackground': '#3d4a6b88',
    'editorCursor.foreground': '#cdd6f4',
    'editorLineNumber.foreground': '#4a5568',
    'editorLineNumber.activeForeground': '#89b4fa',
    'editor.inactiveSelectionBackground': '#2d3555',
    'editorIndentGuide.background': '#2d2d4e',
    'editorIndentGuide.activeBackground': '#4a5568',
    'editorGutter.background': '#16213e',
    'editorWidget.background': '#1e1e2e',
    'editorWidget.border': '#2d2d4e',
    'editorSuggestWidget.background': '#1e1e2e',
    'editorSuggestWidget.border': '#2d2d4e',
    'editorSuggestWidget.selectedBackground': '#3d4a6b',
    'scrollbar.shadow': '#00000000',
    'scrollbarSlider.background': '#3d4a6b88',
    'scrollbarSlider.hoverBackground': '#5a6a8eaa',
    'scrollbarSlider.activeBackground': '#7a8aaecc',
  }
})

// 注册自定义明亮主题
monaco.editor.defineTheme('elysia-light', {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
    { token: 'keyword', foreground: '0550ae' },
    { token: 'string', foreground: '116329' },
    { token: 'number', foreground: 'c05000' },
    { token: 'type', foreground: '953800' },
    { token: 'function', foreground: '0969da' },
    { token: 'variable', foreground: '24283b' },
    { token: 'operator', foreground: '0550ae' },
  ],
  colors: {
    'editor.background': '#f8f9fc',
    'editor.foreground': '#24283b',
    'editor.lineHighlightBackground': '#eef0f6',
    'editor.selectionBackground': '#c0c8e088',
    'editorCursor.foreground': '#24283b',
    'editorLineNumber.foreground': '#9aa0b8',
    'editorLineNumber.activeForeground': '#0550ae',
    'editorGutter.background': '#eef0f6',
    'editorWidget.background': '#f8f9fc',
    'editorWidget.border': '#d0d5e8',
    'editorSuggestWidget.background': '#f8f9fc',
    'editorSuggestWidget.border': '#d0d5e8',
    'editorSuggestWidget.selectedBackground': '#e0e4f0',
    'scrollbar.shadow': '#00000000',
    'scrollbarSlider.background': '#c0c8e088',
    'scrollbarSlider.hoverBackground': '#a0a8c8aa',
    'scrollbarSlider.activeBackground': '#8090b8cc',
  }
})

onMounted(() => {
  if (!editorContainer.value) return

  editor = monaco.editor.create(editorContainer.value, {
    value: props.modelValue,
    language: LANG_MAP[props.language] || 'plaintext',
    theme: THEME_MAP[props.theme] || 'elysia-dark',
    readOnly: props.readOnly,
    fontSize: props.fontSize,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', Consolas, monospace",
    fontLigatures: true,
    lineNumbers: 'on',
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 4,
    insertSpaces: true,
    wordWrap: 'off',
    renderWhitespace: 'none',
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    smoothScrolling: true,
    bracketPairColorization: { enabled: true },
    autoClosingBrackets: 'always',
    autoClosingQuotes: 'always',
    autoIndent: 'full',
    formatOnPaste: false,
    formatOnType: false,
    suggestOnTriggerCharacters: true,
    quickSuggestions: true,
    parameterHints: { enabled: true },
    folding: true,
    foldingStrategy: 'indentation',
    showFoldingControls: 'mouseover',
    renderLineHighlight: 'line',
    overviewRulerBorder: false,
    hideCursorInOverviewRuler: true,
    scrollbar: {
      vertical: 'auto',
      horizontal: 'auto',
      verticalScrollbarSize: 8,
      horizontalScrollbarSize: 8,
    },
    padding: { top: 12, bottom: 12 },
  })

  // 监听内容变化
  editor.onDidChangeModelContent(() => {
    const value = editor.getValue()
    emit('update:modelValue', value)
    emit('change', value)
    // 代码发生变化时，触发 debounce 语法检查
    triggerSyntaxCheck()
  })

  emit('editorReady', editor)
})

// ===== Debounce 语法检查逻辑 =====
// 核心原则：仅在代码「变化后」静止 N 秒才触发检查，防止用户一直静止也会一直调用
let checkTimer = null          // debounce 定时器
let lastCheckedCode = null     // 上次检查时的代码内容（防止重复检查相同代码）
let lastCheckedLang = null     // 上次检查时的语言
let isChecking = false         // 是否正在检查中（防止并发）

/** 触发语法检查（debounce） */
function triggerSyntaxCheck() {
  // 清除上一次的定时器
  if (checkTimer) {
    clearTimeout(checkTimer)
    checkTimer = null
  }

  // 设置新的定时器：代码变化后静止 N 秒才执行
  checkTimer = setTimeout(() => {
    doSyntaxCheck()
  }, props.checkDelay)
}

/** 执行语法检查 */
async function doSyntaxCheck() {
  if (!editor || !props.syntaxChecker) return

  const currentCode = editor.getValue()
  const currentLang = props.language

  // 如果代码和语言都没变，跳过（防止重复检查相同内容）
  if (currentCode === lastCheckedCode && currentLang === lastCheckedLang) return

  // 如果正在检查中，跳过（等下次 debounce 触发）
  if (isChecking) return

  // 空代码不检查，直接清除标记
  if (!currentCode.trim()) {
    clearDiagnostics()
    lastCheckedCode = currentCode
    lastCheckedLang = currentLang
    return
  }

  isChecking = true
  lastCheckedCode = currentCode
  lastCheckedLang = currentLang

  try {
    const result = await props.syntaxChecker(currentLang, currentCode)

    // 检查返回后，代码可能已经又变了，如果变了就不设置标记（等新的 debounce 触发）
    if (editor && editor.getValue() !== currentCode) {
      return
    }

    if (result && result.has_error && result.diagnostics && result.diagnostics.length > 0) {
      setDiagnostics(result.diagnostics)
    } else {
      clearDiagnostics()
    }
  } catch (e) {
    // 网络错误等，静默忽略，不影响编辑体验
    console.warn('[MonacoEditor] 语法检查失败:', e)
  } finally {
    isChecking = false
  }
}

/** 将后端返回的诊断信息设置为 Monaco Editor 的 markers（红色/黄色波浪线） */
function setDiagnostics(diagnostics) {
  if (!editor) return
  const model = editor.getModel()
  if (!model) return

  const markers = diagnostics.map(d => ({
    severity: d.severity === 'warning'
      ? monaco.MarkerSeverity.Warning
      : monaco.MarkerSeverity.Error,
    startLineNumber: d.line || 1,
    startColumn: d.column || 1,
    endLineNumber: d.end_line || d.line || 1,
    endColumn: d.end_column || (d.column ? d.column + 1 : 2),
    message: d.message || 'compile error',
    source: 'elysia-compiler',
  }))

  monaco.editor.setModelMarkers(model, 'elysia-compiler', markers)
  emit('diagnosticsChange', diagnostics)
}

/** 清除所有诊断标记 */
function clearDiagnostics() {
  if (!editor) return
  const model = editor.getModel()
  if (model) {
    monaco.editor.setModelMarkers(model, 'elysia-compiler', [])
  }
  emit('diagnosticsChange', [])
}

// 监听外部 modelValue 变化
watch(() => props.modelValue, (newVal) => {
  if (editor && editor.getValue() !== newVal) {
    editor.setValue(newVal)
  }
})

// 监听语言变化
watch(() => props.language, (newLang) => {
  if (editor) {
    const model = editor.getModel()
    if (model) {
      monaco.editor.setModelLanguage(model, LANG_MAP[newLang] || 'plaintext')
    }
    // 语言切换后，重置上次检查记录，触发新的语法检查
    lastCheckedLang = null
    triggerSyntaxCheck()
  }
})

// 监听主题变化
watch(() => props.theme, (newTheme) => {
  monaco.editor.setTheme(THEME_MAP[newTheme] || 'elysia-dark')
})

// 监听只读状态变化
watch(() => props.readOnly, (newVal) => {
  if (editor) {
    editor.updateOptions({ readOnly: newVal })
  }
})

onBeforeUnmount(() => {
  // 清理 debounce 定时器
  if (checkTimer) {
    clearTimeout(checkTimer)
    checkTimer = null
  }
  if (editor) {
    editor.dispose()
    editor = null
  }
})

/** 暴露编辑器实例方法 */
defineExpose({
  /** 获取 Monaco Editor 实例 */
  getEditor: () => editor,
  /** 聚焦编辑器 */
  focus: () => editor?.focus(),
  /** 获取行数 */
  getLineCount: () => editor?.getModel()?.getLineCount() || 0,
  /** 格式化代码 */
  formatCode: () => editor?.getAction('editor.action.formatDocument')?.run(),
})
</script>

<style scoped>
.monaco-editor-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
