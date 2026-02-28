<template>
  <div class="course-study-page">

    <!-- ===== 第一层：班级列表 ===== -->
    <div v-if="currentView === 'classList'">
      <div class="page-header">
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回首页
        </el-button>
        <h2 class="page-title">课程学习</h2>
      </div>

      <div class="class-list-body">
        <div class="section-header">
          <span class="section-title">我加入的班级</span>
          <span class="section-sub">点击班级进入课程学习</span>
        </div>

        <div v-if="classList.length === 0" class="empty-wrap">
          <el-empty description="暂未加入任何班级" />
        </div>

        <div class="class-grid">
          <div
            v-for="cls in classList"
            :key="cls.id"
            class="class-card"
            @click="enterClass(cls)"
          >
            <div class="class-card-top" :style="{ background: cls.color }">
              <el-icon :size="36" color="#fff"><Reading /></el-icon>
              <div class="class-status-tag">
                <el-tag :type="cls.status === '进行中' ? 'success' : 'info'" size="small" effect="dark">
                  {{ cls.status }}
                </el-tag>
              </div>
            </div>
            <div class="class-card-body">
              <div class="class-name">{{ cls.name }}</div>
              <div class="class-meta">
                <span><el-icon><User /></el-icon> {{ cls.teacher }}</span>
                <span><el-icon><UserFilled /></el-icon> {{ cls.studentCount }}人</span>
              </div>
              <div class="class-subject-row">
                <el-tag type="primary" size="small">{{ cls.subject }}</el-tag>
              </div>
              <div class="class-progress-row">
                <span class="progress-label">完成度</span>
                <el-progress
                  :percentage="cls.progress"
                  :stroke-width="8"
                  :color="progressColor(cls.progress)"
                  style="flex:1"
                />
                <span class="progress-num">{{ cls.progress }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 第二层：课程目录 ===== -->
    <div v-else-if="currentView === 'catalog'">
      <div class="page-header">
        <el-button @click="currentView = 'classList'">
          <el-icon><ArrowLeft /></el-icon>
          返回班级列表
        </el-button>
        <el-breadcrumb separator="/" class="breadcrumb">
          <el-breadcrumb-item @click="currentView = 'classList'" style="cursor:pointer">课程学习</el-breadcrumb-item>
          <el-breadcrumb-item>{{ currentClass.name }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <div class="catalog-body">
        <!-- 课程信息卡 -->
        <div class="course-info-banner" :style="{ background: currentClass.color }">
          <div class="banner-left">
            <div class="banner-subject">{{ currentClass.subject }}</div>
            <div class="banner-name">{{ currentClass.name }}</div>
            <div class="banner-teacher">
              <el-icon><User /></el-icon> {{ currentClass.teacher }}
              &nbsp;&nbsp;
              <el-icon><UserFilled /></el-icon> {{ currentClass.studentCount }}人
            </div>
          </div>
          <div class="banner-right">
            <el-progress
              type="circle"
              :percentage="currentClass.progress"
              :width="80"
              :stroke-width="8"
              color="#fff"
              track-color="rgba(255,255,255,0.3)"
            >
              <template #default>
                <span class="circle-progress-text">{{ currentClass.progress }}%</span>
              </template>
            </el-progress>
            <div class="circle-label">完成度</div>
          </div>
        </div>

        <!-- 章节列表 -->
        <div class="section-header" style="margin-top:20px">
          <span class="section-title">课程目录</span>
          <span class="section-sub">共 {{ courseChapters.length }} 个章节</span>
        </div>

        <el-collapse v-model="activeChapters" class="chapter-collapse">
          <el-collapse-item
            v-for="chapter in courseChapters"
            :key="chapter.id"
            :name="chapter.id"
          >
            <template #title>
              <div class="chapter-title-row">
                <el-icon color="#667eea"><Notebook /></el-icon>
                <span class="chapter-title-text">{{ chapter.title }}</span>
                <el-badge :value="chapter.problems.length" type="primary" class="chapter-badge" />
                <span class="chapter-solved">
                  已完成 {{ chapter.problems.filter(p => p.solved).length }}/{{ chapter.problems.length }}
                </span>
              </div>
            </template>

            <div class="problem-list">
              <div
                v-for="problem in chapter.problems"
                :key="problem.id"
                class="problem-item"
                @click="viewProblem(problem)"
              >
                <div class="problem-left">
                  <el-tag
                    :type="difficultyType(problem.difficulty)"
                    size="small"
                    class="diff-tag"
                  >{{ difficultyLabel(problem.difficulty) }}</el-tag>
                  <div class="problem-info">
                    <div class="problem-title">{{ problem.title }}</div>
                    <div class="problem-tags">
                      <el-tag
                        v-for="tag in problem.tags"
                        :key="tag"
                        size="small"
                        plain
                        type="info"
                        style="margin-right:4px;margin-top:2px"
                      >{{ tag }}</el-tag>
                    </div>
                  </div>
                </div>
                <div class="problem-right">
                  <el-icon v-if="problem.solved" color="#67c23a" :size="20"><CircleCheck /></el-icon>
                  <el-icon v-else color="#c8c9cc" :size="20"><CircleClose /></el-icon>
                  <span class="time-limit">{{ problem.timeLimit }}ms</span>
                  <el-icon color="#c8c9cc"><ArrowRight /></el-icon>
                </div>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>

    <!-- ===== 第三层：题目详情抽屉 ===== -->
    <el-drawer
      v-model="showProblemDetail"
      :title="currentProblem ? currentProblem.title : ''"
      direction="rtl"
      size="680px"
      :destroy-on-close="false"
    >
      <template #header>
        <div class="drawer-header" v-if="currentProblem">
          <div class="drawer-title">{{ currentProblem.title }}</div>
          <div class="drawer-meta">
            <el-tag :type="difficultyType(currentProblem.difficulty)" size="default">
              {{ difficultyLabel(currentProblem.difficulty) }}
            </el-tag>
            <span class="meta-chip">
              <el-icon><Timer /></el-icon> 时间限制：{{ currentProblem.timeLimit }}ms
            </span>
            <span class="meta-chip">
              <el-icon><Coin /></el-icon> 内存限制：{{ currentProblem.memoryLimit }}MB
            </span>
          </div>
          <div class="drawer-tags">
            <el-tag
              v-for="tag in currentProblem.tags"
              :key="tag"
              plain
              type="primary"
              size="small"
              style="margin-right:6px;margin-bottom:4px"
            >{{ tag }}</el-tag>
          </div>
        </div>
      </template>

      <div class="problem-detail-body" v-if="currentProblem">
        <!-- 题目描述 -->
        <div class="detail-section">
          <div class="detail-section-title">📝 题目描述</div>
          <div class="detail-section-content" v-html="currentProblem.description"></div>
        </div>

        <!-- 输入格式 -->
        <div class="detail-section">
          <div class="detail-section-title">📥 输入格式</div>
          <div class="detail-section-content">{{ currentProblem.inputFormat }}</div>
        </div>

        <!-- 输出格式 -->
        <div class="detail-section">
          <div class="detail-section-title">📤 输出格式</div>
          <div class="detail-section-content">{{ currentProblem.outputFormat }}</div>
        </div>

        <!-- 输入输出样例 -->
        <div class="detail-section">
          <div class="detail-section-title">💡 输入输出样例</div>
          <div
            v-for="(sample, idx) in currentProblem.samples"
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
        <div v-if="currentProblem.hint" class="detail-section">
          <div class="detail-section-title">🔔 提示</div>
          <el-alert :title="currentProblem.hint" type="info" :closable="false" show-icon />
        </div>
      </div>

      <template #footer>
        <div class="drawer-footer">
          <el-button @click="showProblemDetail = false">关闭</el-button>
          <el-button type="primary" @click="goToSubmit">
            <el-icon><Edit /></el-icon>
            开始作答
          </el-button>
        </div>
      </template>
    </el-drawer>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft, ArrowRight, Reading, User, UserFilled,
  Notebook, CircleCheck, CircleClose, Timer, Coin,
  InfoFilled, Edit
} from '@element-plus/icons-vue'

const router = useRouter()

// 当前视图层级
const currentView = ref('classList')
const currentClass = ref(null)
const currentProblem = ref(null)
const showProblemDetail = ref(false)
const activeChapters = ref([])

// ===== 模拟数据：班级列表 =====
const classList = ref([
  {
    id: 1,
    name: '数据结构 2024春季班',
    subject: '数据结构',
    teacher: '张伟老师',
    studentCount: 42,
    status: '进行中',
    progress: 65,
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    id: 2,
    name: '算法设计与分析 A班',
    subject: '算法设计',
    teacher: '李明老师',
    studentCount: 38,
    status: '进行中',
    progress: 30,
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    id: 3,
    name: '操作系统原理 2024',
    subject: '操作系统',
    teacher: '王芳老师',
    studentCount: 55,
    status: '已结束',
    progress: 100,
    color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  }
])

// ===== 模拟数据：课程章节与题目 =====
const courseChaptersMap = {
  1: [
    {
      id: 'c1',
      title: '第一章 线性表',
      problems: [
        {
          id: 'p1',
          title: '两数之和',
          difficulty: 'easy',
          tags: ['数组', '哈希表'],
          solved: true,
          timeLimit: 1000,
          memoryLimit: 256,
          description: '给定一个整数数组 <code>nums</code> 和一个整数目标值 <code>target</code>，请你在该数组中找出 <strong>和为目标值</strong> <code>target</code> 的那两个整数，并返回它们的数组下标。',
          inputFormat: '第一行输入一个整数 n（1 ≤ n ≤ 10^4），表示数组长度。\n第二行输入 n 个整数，表示数组 nums。\n第三行输入目标值 target。',
          outputFormat: '输出两个整数的下标，用空格分隔（下标从0开始）。',
          samples: [
            { input: '4\n2 7 11 15\n9', output: '0 1', explanation: 'nums[0] + nums[1] = 2 + 7 = 9' },
            { input: '3\n3 2 4\n6', output: '1 2' }
          ],
          hint: '可以使用哈希表将时间复杂度降低到 O(n)。'
        },
        {
          id: 'p2',
          title: '反转链表',
          difficulty: 'easy',
          tags: ['链表', '递归'],
          solved: false,
          timeLimit: 1000,
          memoryLimit: 256,
          description: '给你单链表的头节点 <code>head</code>，请你反转链表，并返回反转后的链表。',
          inputFormat: '第一行输入链表节点数 n。\n第二行输入 n 个整数，表示链表各节点的值。',
          outputFormat: '输出反转后链表的各节点值，用空格分隔。',
          samples: [
            { input: '5\n1 2 3 4 5', output: '5 4 3 2 1' },
            { input: '2\n1 2', output: '2 1' }
          ],
          hint: null
        },
        {
          id: 'p3',
          title: '删除链表的倒数第N个节点',
          difficulty: 'medium',
          tags: ['链表', '双指针'],
          solved: false,
          timeLimit: 1000,
          memoryLimit: 256,
          description: '给你一个链表，删除链表的倒数第 <code>n</code> 个节点，并且返回链表的头结点。',
          inputFormat: '第一行输入链表节点数 m 和 n。\n第二行输入 m 个整数，表示链表各节点的值。',
          outputFormat: '输出删除后链表的各节点值，用空格分隔。',
          samples: [
            { input: '5 2\n1 2 3 4 5', output: '1 2 3 5', explanation: '删除倒数第2个节点（值为4）' }
          ],
          hint: '使用快慢指针，快指针先走 n 步。'
        }
      ]
    },
    {
      id: 'c2',
      title: '第二章 栈与队列',
      problems: [
        {
          id: 'p4',
          title: '有效的括号',
          difficulty: 'easy',
          tags: ['栈', '字符串'],
          solved: true,
          timeLimit: 1000,
          memoryLimit: 256,
          description: '给定一个只包括 <code>(</code>，<code>)</code>，<code>{</code>，<code>}</code>，<code>[</code>，<code>]</code> 的字符串 s，判断字符串是否有效。',
          inputFormat: '输入一行字符串 s（1 ≤ |s| ≤ 10^4）。',
          outputFormat: '若有效输出 true，否则输出 false。',
          samples: [
            { input: '()', output: 'true' },
            { input: '()[]{} ', output: 'true' },
            { input: '(]', output: 'false' }
          ],
          hint: '使用栈来匹配括号。'
        },
        {
          id: 'p5',
          title: '用栈实现队列',
          difficulty: 'easy',
          tags: ['栈', '队列', '设计'],
          solved: false,
          timeLimit: 1000,
          memoryLimit: 256,
          description: '请你仅使用两个栈实现先入先出队列。队列应当支持一般队列支持的所有操作（push、pop、peek、empty）。',
          inputFormat: '多行输入，每行一个操作：\npush x：将元素 x 入队\npop：出队并输出队首元素\npeek：输出队首元素但不出队\nempty：输出队列是否为空',
          outputFormat: '对每个 pop/peek/empty 操作输出对应结果。',
          samples: [
            { input: 'push 1\npush 2\npeek\npop\nempty', output: '1\n1\nfalse' }
          ],
          hint: '使用两个栈，一个用于入队，一个用于出队。'
        }
      ]
    },
    {
      id: 'c3',
      title: '第三章 树与二叉树',
      problems: [
        {
          id: 'p6',
          title: '二叉树的最大深度',
          difficulty: 'easy',
          tags: ['树', 'DFS', 'BFS'],
          solved: false,
          timeLimit: 1000,
          memoryLimit: 256,
          description: '给定一个二叉树 <code>root</code>，返回其最大深度。二叉树的最大深度是指从根节点到最远叶子节点的最长路径上的节点数。',
          inputFormat: '按层序输入二叉树，null 表示空节点。',
          outputFormat: '输出二叉树的最大深度。',
          samples: [
            { input: '3 9 20 null null 15 7', output: '3' },
            { input: '1 null 2', output: '2' }
          ],
          hint: '可以使用递归（DFS）或迭代（BFS）两种方式。'
        },
        {
          id: 'p7',
          title: '二叉树的中序遍历',
          difficulty: 'easy',
          tags: ['树', '栈', '递归'],
          solved: true,
          timeLimit: 1000,
          memoryLimit: 256,
          description: '给定一个二叉树的根节点 <code>root</code>，返回它的中序遍历结果。',
          inputFormat: '按层序输入二叉树，null 表示空节点。',
          outputFormat: '输出中序遍历序列，用空格分隔。',
          samples: [
            { input: '1 null 2 3', output: '1 3 2' },
            { input: '1 2 3 4 5', output: '4 2 5 1 3' }
          ],
          hint: null
        },
        {
          id: 'p8',
          title: '路径总和',
          difficulty: 'medium',
          tags: ['树', 'DFS', '回溯'],
          solved: false,
          timeLimit: 1000,
          memoryLimit: 256,
          description: '给你二叉树的根节点 <code>root</code> 和一个表示目标和的整数 <code>targetSum</code>。判断该树中是否存在根节点到叶子节点的路径，这条路径上所有节点值相加等于目标和 <code>targetSum</code>。',
          inputFormat: '第一行输入目标和 targetSum。\n第二行按层序输入二叉树。',
          outputFormat: '若存在输出 true，否则输出 false。',
          samples: [
            { input: '22\n5 4 8 11 null 13 4 7 2 null null null 1', output: 'true', explanation: '路径 5→4→11→2 的和为 22' }
          ],
          hint: '使用 DFS 递归，每次将目标值减去当前节点值。'
        }
      ]
    },
    {
      id: 'c4',
      title: '第四章 图论基础',
      problems: [
        {
          id: 'p9',
          title: '岛屿数量',
          difficulty: 'medium',
          tags: ['图', 'DFS', 'BFS', '并查集'],
          solved: false,
          timeLimit: 1000,
          memoryLimit: 256,
          description: '给你一个由 <code>\'1\'</code>（陆地）和 <code>\'0\'</code>（水）组成的二维网格，请你计算网格中岛屿的数量。',
          inputFormat: '第一行输入 m 和 n（网格行列数）。\n接下来 m 行，每行 n 个字符（\'0\' 或 \'1\'）。',
          outputFormat: '输出岛屿数量。',
          samples: [
            { input: '4 5\n11110\n11010\n11000\n00000', output: '1' },
            { input: '4 5\n11000\n11000\n00100\n00011', output: '3' }
          ],
          hint: '使用 DFS 或 BFS 遍历，将访问过的陆地标记为已访问。'
        }
      ]
    }
  ],
  2: [
    {
      id: 'c5',
      title: '第一章 排序算法',
      problems: [
        {
          id: 'p10',
          title: '排序数组',
          difficulty: 'medium',
          tags: ['排序', '分治', '堆'],
          solved: false,
          timeLimit: 1000,
          memoryLimit: 256,
          description: '给你一个整数数组 <code>nums</code>，请你将该数组升序排列。',
          inputFormat: '第一行输入数组长度 n。\n第二行输入 n 个整数。',
          outputFormat: '输出升序排列后的数组，用空格分隔。',
          samples: [
            { input: '6\n5 2 3 1 4 6', output: '1 2 3 4 5 6' }
          ],
          hint: '尝试实现快速排序或归并排序。'
        }
      ]
    },
    {
      id: 'c6',
      title: '第二章 动态规划',
      problems: [
        {
          id: 'p11',
          title: '爬楼梯',
          difficulty: 'easy',
          tags: ['动态规划', '记忆化搜索'],
          solved: false,
          timeLimit: 1000,
          memoryLimit: 256,
          description: '假设你正在爬楼梯。需要 <code>n</code> 阶你才能到达楼顶。每次你可以爬 <code>1</code> 或 <code>2</code> 个台阶。你有多少种不同的方法可以爬到楼顶呢？',
          inputFormat: '输入一个整数 n（1 ≤ n ≤ 45）。',
          outputFormat: '输出爬到楼顶的方法数。',
          samples: [
            { input: '2', output: '2', explanation: '1+1 或 2，共2种方法' },
            { input: '3', output: '3', explanation: '1+1+1、1+2 或 2+1，共3种方法' }
          ],
          hint: 'dp[i] = dp[i-1] + dp[i-2]，类似斐波那契数列。'
        },
        {
          id: 'p12',
          title: '最长递增子序列',
          difficulty: 'medium',
          tags: ['动态规划', '二分查找'],
          solved: false,
          timeLimit: 1000,
          memoryLimit: 256,
          description: '给你一个整数数组 <code>nums</code>，找到其中最长严格递增子序列的长度。',
          inputFormat: '第一行输入数组长度 n。\n第二行输入 n 个整数。',
          outputFormat: '输出最长递增子序列的长度。',
          samples: [
            { input: '8\n10 9 2 5 3 7 101 18', output: '4', explanation: '最长递增子序列为 [2,3,7,101]' }
          ],
          hint: '使用 dp[i] 表示以 nums[i] 结尾的最长递增子序列长度。'
        }
      ]
    }
  ],
  3: [
    {
      id: 'c7',
      title: '第一章 进程管理',
      problems: [
        {
          id: 'p13',
          title: '进程调度模拟',
          difficulty: 'hard',
          tags: ['模拟', '队列', '优先级'],
          solved: false,
          timeLimit: 2000,
          memoryLimit: 256,
          description: '模拟操作系统的进程调度算法，实现先来先服务（FCFS）调度策略。',
          inputFormat: '第一行输入进程数 n。\n接下来 n 行，每行输入进程ID、到达时间、执行时间。',
          outputFormat: '输出每个进程的完成时间、周转时间和等待时间。',
          samples: [
            { input: '3\nP1 0 5\nP2 1 3\nP3 2 4', output: 'P1: 完成=5 周转=5 等待=0\nP2: 完成=8 周转=7 等待=4\nP3: 完成=12 周转=10 等待=6' }
          ],
          hint: '按到达时间排序，依次执行每个进程。'
        }
      ]
    }
  ]
}

const courseChapters = ref([])

// 进入班级
const enterClass = (cls) => {
  currentClass.value = cls
  courseChapters.value = courseChaptersMap[cls.id] || []
  activeChapters.value = []
  currentView.value = 'catalog'
}

// 查看题目详情
const viewProblem = (problem) => {
  currentProblem.value = problem
  showProblemDetail.value = true
}

// 难度标签文字
const difficultyLabel = (diff) => {
  const map = { easy: '简单', medium: '中等', hard: '困难' }
  return map[diff] || diff
}

// 难度标签类型
const difficultyType = (diff) => {
  const map = { easy: 'success', medium: 'warning', hard: 'danger' }
  return map[diff] || 'info'
}

// 进度条颜色
const progressColor = (val) => {
  if (val >= 80) return '#67c23a'
  if (val >= 50) return '#409eff'
  return '#e6a23c'
}

// 去作答
const goToSubmit = () => {
  showProblemDetail.value = false
  router.push({
    name: 'ProblemCode',
    params: { problemId: currentProblem.value.id }
  })
}

// 返回首页
const goBack = () => {
  router.push({ name: 'StudentDashboard' })
}
</script>

<style scoped lang="scss">
.course-study-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
}

/* 页面头部 */
.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  margin-bottom: 20px;

  .page-title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #303133;
  }

  .breadcrumb {
    font-size: 14px;
  }
}

/* 区块标题 */
.section-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 16px;

  .section-title {
    font-size: 17px;
    font-weight: 700;
    color: #303133;
  }

  .section-sub {
    font-size: 13px;
    color: #909399;
  }
}

/* ===== 班级列表 ===== */
.class-list-body {
  max-width: 1200px;
  margin: 0 auto;
}

.class-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.class-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.14);
  }

  .class-card-top {
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    .class-status-tag {
      position: absolute;
      top: 12px;
      right: 12px;
    }
  }

  .class-card-body {
    padding: 16px 20px;

    .class-name {
      font-size: 16px;
      font-weight: 700;
      color: #303133;
      margin-bottom: 10px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .class-meta {
      display: flex;
      gap: 16px;
      font-size: 13px;
      color: #909399;
      margin-bottom: 10px;

      span {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }

    .class-subject-row {
      margin-bottom: 12px;
    }

    .class-progress-row {
      display: flex;
      align-items: center;
      gap: 8px;

      .progress-label {
        font-size: 12px;
        color: #909399;
        white-space: nowrap;
      }

      .progress-num {
        font-size: 12px;
        font-weight: 600;
        color: #606266;
        white-space: nowrap;
      }
    }
  }
}

/* ===== 课程目录 ===== */
.catalog-body {
  max-width: 960px;
  margin: 0 auto;
}

.course-info-banner {
  border-radius: 16px;
  padding: 24px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
  margin-bottom: 8px;

  .banner-left {
    .banner-subject {
      font-size: 22px;
      font-weight: 800;
      margin-bottom: 6px;
    }

    .banner-name {
      font-size: 15px;
      opacity: 0.9;
      margin-bottom: 8px;
    }

    .banner-teacher {
      font-size: 13px;
      opacity: 0.8;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  .banner-right {
    text-align: center;

    .circle-progress-text {
      font-size: 16px;
      font-weight: 700;
      color: #fff;
    }

    .circle-label {
      font-size: 12px;
      margin-top: 6px;
      opacity: 0.85;
    }
  }
}

/* 章节折叠 */
.chapter-collapse {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);

  :deep(.el-collapse-item__header) {
    padding: 0 20px;
    height: 56px;
    font-size: 15px;
    background: #fff;

    &:hover {
      background: #f5f7fa;
    }
  }

  :deep(.el-collapse-item__content) {
    padding: 0;
  }

  :deep(.el-collapse-item__wrap) {
    border-bottom: 1px solid #ebedf0;
  }
}

.chapter-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;

  .chapter-title-text {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    flex: 1;
  }

  .chapter-badge {
    margin-right: 4px;
  }

  .chapter-solved {
    font-size: 12px;
    color: #909399;
    margin-right: 8px;
  }
}

/* 题目列表 */
.problem-list {
  background: #fafafa;
}

.problem-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.15s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #f0f4ff;
  }

  .problem-left {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex: 1;
    min-width: 0;

    .diff-tag {
      flex-shrink: 0;
      margin-top: 2px;
    }

    .problem-info {
      flex: 1;
      min-width: 0;

      .problem-title {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 6px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .problem-tags {
        display: flex;
        flex-wrap: wrap;
      }
    }
  }

  .problem-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    margin-left: 12px;

    .time-limit {
      font-size: 12px;
      color: #909399;
    }
  }
}

/* ===== 题目详情抽屉 ===== */
.drawer-header {
  .drawer-title {
    font-size: 18px;
    font-weight: 700;
    color: #303133;
    margin-bottom: 10px;
    line-height: 1.4;
  }

  .drawer-meta {
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

  .drawer-tags {
    display: flex;
    flex-wrap: wrap;
  }
}

.problem-detail-body {
  padding: 0 4px;

  .detail-section {
    margin-bottom: 24px;

    .detail-section-title {
      font-size: 15px;
      font-weight: 700;
      color: #303133;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 2px solid #f0f0f0;
    }

    .detail-section-content {
      font-size: 14px;
      color: #606266;
      line-height: 1.8;
      white-space: pre-line;

      :deep(code) {
        background: #f5f7fa;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        color: #e6a23c;
        font-size: 13px;
      }

      :deep(strong) {
        color: #303133;
        font-weight: 600;
      }
    }
  }
}

/* 样例块 */
.sample-block {
  margin-bottom: 16px;

  .sample-row {
    display: flex;
    gap: 12px;

    .sample-col {
      flex: 1;
      min-width: 0;

      .sample-label {
        font-size: 12px;
        color: #909399;
        margin-bottom: 6px;
      }

      .sample-code {
        background: #f5f7fa;
        border: 1px solid #ebedf0;
        border-radius: 8px;
        padding: 12px 14px;
        font-size: 13px;
        font-family: 'Courier New', monospace;
        color: #303133;
        margin: 0;
        white-space: pre-wrap;
        word-break: break-all;
        min-height: 48px;
      }
    }
  }

  .sample-explanation {
    margin-top: 8px;
    font-size: 13px;
    color: #909399;
    padding: 8px 12px;
    background: #fafafa;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 空状态 */
.empty-wrap {
  padding: 60px 0;
  text-align: center;
}

/* 响应式 */
@media (max-width: 768px) {
  .class-grid {
    grid-template-columns: 1fr;
  }

  .course-info-banner {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
}
</style>
