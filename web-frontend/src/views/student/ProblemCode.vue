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

          <!-- 题目头部 -->
          <div class="problem-header">
            <div class="problem-title-text">{{ problem.title }}</div>
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

        </div>

        <!-- 运行记录内容 -->
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
              <pre class="record-message">{{ record.message }}</pre>
            </div>
            <div class="record-code-toggle" @click="toggleRecordCode(record)">
              <el-icon><component :is="record.showCode ? 'ArrowUp' : 'ArrowDown'" /></el-icon>
              {{ record.showCode ? '收起代码' : '查看代码' }}
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
            <el-button size="default" plain @click="onTest">
              <el-icon><VideoPlay /></el-icon>
              测试
            </el-button>
            <el-button size="default" type="primary" @click="onRun">
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
            <el-tag :type="resultStatus === 'success' ? 'success' : 'danger'" size="small">
              {{ resultStatus === 'success' ? '通过' : '错误' }}
            </el-tag>
            <pre class="result-output">{{ resultOutput }}</pre>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft, Timer, Coin, InfoFilled,
  RefreshLeft, VideoPlay, Upload, Close, ArrowUp, ArrowDown
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// ===== 题目数据（从路由 state 获取，降级用 mock） =====
const problemId = route.params.problemId

// 所有题目的 mock 数据（与 CourseStudy.vue 保持一致）
const allProblems = {
  p1: {
    id: 'p1', title: '两数之和', difficulty: 'easy', tags: ['数组', '哈希表'],
    timeLimit: 1000, memoryLimit: 256,
    description: '给定一个整数数组 <code>nums</code> 和一个整数目标值 <code>target</code>，请你在该数组中找出 <strong>和为目标值</strong> <code>target</code> 的那两个整数，并返回它们的数组下标。',
    inputFormat: '第一行输入一个整数 n（1 ≤ n ≤ 10^4），表示数组长度。\n第二行输入 n 个整数，表示数组 nums。\n第三行输入目标值 target。',
    outputFormat: '输出两个整数的下标，用空格分隔（下标从0开始）。',
    samples: [
      { input: '4\n2 7 11 15\n9', output: '0 1', explanation: 'nums[0] + nums[1] = 2 + 7 = 9' },
      { input: '3\n3 2 4\n6', output: '1 2' }
    ],
    hint: '可以使用哈希表将时间复杂度降低到 O(n)。'
  },
  p2: {
    id: 'p2', title: '反转链表', difficulty: 'easy', tags: ['链表', '递归'],
    timeLimit: 1000, memoryLimit: 256,
    description: '给你单链表的头节点 <code>head</code>，请你反转链表，并返回反转后的链表。',
    inputFormat: '第一行输入链表节点数 n。\n第二行输入 n 个整数，表示链表各节点的值。',
    outputFormat: '输出反转后链表的各节点值，用空格分隔。',
    samples: [{ input: '5\n1 2 3 4 5', output: '5 4 3 2 1' }],
    hint: null
  },
  p3: {
    id: 'p3', title: '删除链表的倒数第N个节点', difficulty: 'medium', tags: ['链表', '双指针'],
    timeLimit: 1000, memoryLimit: 256,
    description: '给你一个链表，删除链表的倒数第 <code>n</code> 个节点，并且返回链表的头结点。',
    inputFormat: '第一行输入链表节点数 m 和 n。\n第二行输入 m 个整数，表示链表各节点的值。',
    outputFormat: '输出删除后链表的各节点值，用空格分隔。',
    samples: [{ input: '5 2\n1 2 3 4 5', output: '1 2 3 5', explanation: '删除倒数第2个节点（值为4）' }],
    hint: '使用快慢指针，快指针先走 n 步。'
  },
  p4: {
    id: 'p4', title: '有效的括号', difficulty: 'easy', tags: ['栈', '字符串'],
    timeLimit: 1000, memoryLimit: 256,
    description: '给定一个只包括 <code>(</code>，<code>)</code>，<code>{</code>，<code>}</code>，<code>[</code>，<code>]</code> 的字符串 s，判断字符串是否有效。',
    inputFormat: '输入一行字符串 s（1 ≤ |s| ≤ 10^4）。',
    outputFormat: '若有效输出 true，否则输出 false。',
    samples: [{ input: '()[]{} ', output: 'true' }],
    hint: '使用栈来匹配括号。'
  },
  p5: {
    id: 'p5', title: '用栈实现队列', difficulty: 'easy', tags: ['栈', '队列', '设计'],
    timeLimit: 1000, memoryLimit: 256,
    description: '请你仅使用两个栈实现先入先出队列。',
    inputFormat: '多行输入，每行一个操作。',
    outputFormat: '对每个 pop/peek/empty 操作输出对应结果。',
    samples: [{ input: 'push 1\npush 2\npeek\npop\nempty', output: '1\n1\nfalse' }],
    hint: '使用两个栈，一个用于入队，一个用于出队。'
  },
  p6: {
    id: 'p6', title: '二叉树的最大深度', difficulty: 'easy', tags: ['树', 'DFS', 'BFS'],
    timeLimit: 1000, memoryLimit: 256,
    description: '给定一个二叉树 <code>root</code>，返回其最大深度。',
    inputFormat: '按层序输入二叉树，null 表示空节点。',
    outputFormat: '输出二叉树的最大深度。',
    samples: [{ input: '3 9 20 null null 15 7', output: '3' }],
    hint: '可以使用递归（DFS）或迭代（BFS）两种方式。'
  },
  p7: {
    id: 'p7', title: '二叉树的中序遍历', difficulty: 'easy', tags: ['树', '栈', '递归'],
    timeLimit: 1000, memoryLimit: 256,
    description: '给定一个二叉树的根节点 <code>root</code>，返回它的中序遍历结果。',
    inputFormat: '按层序输入二叉树，null 表示空节点。',
    outputFormat: '输出中序遍历序列，用空格分隔。',
    samples: [{ input: '1 null 2 3', output: '1 3 2' }],
    hint: null
  },
  p8: {
    id: 'p8', title: '路径总和', difficulty: 'medium', tags: ['树', 'DFS', '回溯'],
    timeLimit: 1000, memoryLimit: 256,
    description: '判断该树中是否存在根节点到叶子节点的路径，路径上所有节点值相加等于目标和。',
    inputFormat: '第一行输入目标和 targetSum。\n第二行按层序输入二叉树。',
    outputFormat: '若存在输出 true，否则输出 false。',
    samples: [{ input: '22\n5 4 8 11 null 13 4 7 2 null null null 1', output: 'true', explanation: '路径 5→4→11→2 的和为 22' }],
    hint: '使用 DFS 递归，每次将目标值减去当前节点值。'
  },
  p9: {
    id: 'p9', title: '岛屿数量', difficulty: 'medium', tags: ['图', 'DFS', 'BFS', '并查集'],
    timeLimit: 1000, memoryLimit: 256,
    description: '给你一个由 \'1\'（陆地）和 \'0\'（水）组成的二维网格，请你计算网格中岛屿的数量。',
    inputFormat: '第一行输入 m 和 n（网格行列数）。\n接下来 m 行，每行 n 个字符。',
    outputFormat: '输出岛屿数量。',
    samples: [{ input: '4 5\n11110\n11010\n11000\n00000', output: '1' }],
    hint: '使用 DFS 或 BFS 遍历，将访问过的陆地标记为已访问。'
  },
  p10: {
    id: 'p10', title: '排序数组', difficulty: 'medium', tags: ['排序', '分治', '堆'],
    timeLimit: 1000, memoryLimit: 256,
    description: '给你一个整数数组 <code>nums</code>，请你将该数组升序排列。',
    inputFormat: '第一行输入数组长度 n。\n第二行输入 n 个整数。',
    outputFormat: '输出升序排列后的数组，用空格分隔。',
    samples: [{ input: '6\n5 2 3 1 4 6', output: '1 2 3 4 5 6' }],
    hint: '尝试实现快速排序或归并排序。'
  },
  p11: {
    id: 'p11', title: '爬楼梯', difficulty: 'easy', tags: ['动态规划', '记忆化搜索'],
    timeLimit: 1000, memoryLimit: 256,
    description: '假设你正在爬楼梯。需要 <code>n</code> 阶你才能到达楼顶。每次你可以爬 1 或 2 个台阶。你有多少种不同的方法可以爬到楼顶呢？',
    inputFormat: '输入一个整数 n（1 ≤ n ≤ 45）。',
    outputFormat: '输出爬到楼顶的方法数。',
    samples: [{ input: '3', output: '3', explanation: '1+1+1、1+2 或 2+1，共3种方法' }],
    hint: 'dp[i] = dp[i-1] + dp[i-2]，类似斐波那契数列。'
  },
  p12: {
    id: 'p12', title: '最长递增子序列', difficulty: 'medium', tags: ['动态规划', '二分查找'],
    timeLimit: 1000, memoryLimit: 256,
    description: '给你一个整数数组 <code>nums</code>，找到其中最长严格递增子序列的长度。',
    inputFormat: '第一行输入数组长度 n。\n第二行输入 n 个整数。',
    outputFormat: '输出最长递增子序列的长度。',
    samples: [{ input: '8\n10 9 2 5 3 7 101 18', output: '4', explanation: '最长递增子序列为 [2,3,7,101]' }],
    hint: '使用 dp[i] 表示以 nums[i] 结尾的最长递增子序列长度。'
  },
  p13: {
    id: 'p13', title: '进程调度模拟', difficulty: 'hard', tags: ['模拟', '队列', '优先级'],
    timeLimit: 2000, memoryLimit: 256,
    description: '模拟操作系统的进程调度算法，实现先来先服务（FCFS）调度策略。',
    inputFormat: '第一行输入进程数 n。\n接下来 n 行，每行输入进程ID、到达时间、执行时间。',
    outputFormat: '输出每个进程的完成时间、周转时间和等待时间。',
    samples: [{ input: '3\nP1 0 5\nP2 1 3\nP3 2 4', output: 'P1: 完成=5 周转=5 等待=0\nP2: 完成=8 周转=7 等待=4\nP3: 完成=12 周转=10 等待=6' }],
    hint: '按到达时间排序，依次执行每个进程。'
  }
}

const problem = ref(allProblems[problemId] || allProblems['p1'])

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
    statusKey: cfg.key,
    statusLabel: cfg.label,
    tagType: cfg.tagType,
    langLabel: languages.find(l => l.value === selectedLang.value)?.label || selectedLang.value,
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
      // 例：func main(){|} → 回车后：
      //   func main(){
      //       |          ← 光标在这里（多一级缩进）
      //   }
      const innerIndent = indent + '    '
      const inserted = '\n' + innerIndent + '\n' + indent
      code.value = val.slice(0, start) + inserted + val.slice(end)
      nextTick(() => {
        const newPos = start + 1 + innerIndent.length
        ta.selectionStart = ta.selectionEnd = newPos
      })
    } else if (isOpenBracket) {
      // 情况：行尾是开括号，但后面没有对应的关闭括号
      // 例：if a > b {  → 回车后缩进一级
      const innerIndent = indent + '    '
      code.value = val.slice(0, start) + '\n' + innerIndent + val.slice(end)
      nextTick(() => {
        ta.selectionStart = ta.selectionEnd = start + 1 + innerIndent.length
      })
    } else {
      // 普通回车：继承当前行缩进
      code.value = val.slice(0, start) + '\n' + indent + val.slice(end)
      nextTick(() => {
        ta.selectionStart = ta.selectionEnd = start + 1 + indent.length
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
      nextTick(() => { ta.selectionStart = ta.selectionEnd = start - 1 })
    }
  }
}

// 测试
const onTest = () => {
  resultTitle.value = '测试结果'
  resultStatus.value = 'success'
  resultOutput.value = `运行样例输入：\n${problem.value.samples[0]?.input || ''}\n\n期望输出：\n${problem.value.samples[0]?.output || ''}\n\n实际输出：\n${problem.value.samples[0]?.output || ''}\n\n✓ 样例通过`
  showResult.value = true
}

// 运行（模拟评测，并记录到运行记录）
const onRun = () => {
  resultTitle.value = '运行结果'
  resultStatus.value = 'success'
  resultOutput.value = `提交成功！\n\n语言：${languages.find(l => l.value === selectedLang.value)?.label}\n代码长度：${code.value.length} 字符\n\n评测中... 请稍候`
  showResult.value = true

  // 模拟评测结果（实际对接后端时替换此处逻辑）
  const mockResults = [
    { statusKey: 'accepted', timeCost: Math.floor(Math.random() * 200 + 50), memory: (Math.random() * 10 + 5).toFixed(1) },
    { statusKey: 'wa',       timeCost: Math.floor(Math.random() * 100 + 30), memory: (Math.random() * 8 + 4).toFixed(1), message: '第 2 个测试点答案错误\n期望输出：1 2 3\n实际输出：3 2 1' },
    { statusKey: 'tle',      timeCost: problem.value.timeLimit + 100, memory: (Math.random() * 20 + 10).toFixed(1), message: `执行时间超过限制 ${problem.value.timeLimit}ms` },
    { statusKey: 'mle',      timeCost: Math.floor(Math.random() * 300 + 100), memory: problem.value.memoryLimit + 10, message: `内存使用超过限制 ${problem.value.memoryLimit}MB` },
    { statusKey: 'ce',       message: `编译错误：\nerror: expected ';' before '}' token\n  printf("%s", result)\n                      ^` },
    { statusKey: 're',       timeCost: Math.floor(Math.random() * 50 + 10), memory: (Math.random() * 5 + 2).toFixed(1), message: '运行时错误：Segmentation fault (core dumped)' },
  ]
  const picked = mockResults[Math.floor(Math.random() * mockResults.length)]
  setTimeout(() => {
    addRunRecord(picked.statusKey, picked)
    // 切换到运行记录 Tab
    leftTab.value = 'records'
  }, 800)
}

// 难度
const difficultyLabel = (diff) => {
  const map = { easy: '简单', medium: '中等', hard: '困难' }
  return map[diff] || diff
}
const difficultyType = (diff) => {
  const map = { easy: 'success', medium: 'warning', hard: 'danger' }
  return map[diff] || 'info'
}

// 返回
const goBack = () => {
  router.back()
}

onMounted(() => {
  nextTick(() => {
    syncScroll()
    updateScrollbar()
  })
})
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
      color: #f56c6c;
      white-space: pre-wrap;
      line-height: 1.5;
    }
  }

  .record-code-toggle {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    font-size: 12px;
    color: #409eff;
    cursor: pointer;
    border-top: 1px solid #f0f0f0;
    background: #fff;
    user-select: none;

    &:hover {
      background: #f5f7fa;
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
  max-height: 220px;
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
    padding: 12px 16px;

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

/* Element Plus 按钮在深色背景下的适配 */
:deep(.el-button--small) {
  font-size: 12px;
}
</style>
