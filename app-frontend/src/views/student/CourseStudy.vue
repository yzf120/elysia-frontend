<template>
  <div class="course-study-page">

    <!-- ===== 第一层：班级列表 ===== -->
    <template v-if="currentView === 'classList'">
      <van-nav-bar title="课程学习" fixed placeholder>
        <template #right>
          <van-icon name="user-o" size="20" @click="$router.push('/student/profile')" />
        </template>
      </van-nav-bar>

      <div class="page-body">
        <div class="section-header">
          <h3>我加入的班级</h3>
          <span class="sub-text">点击班级进入课程学习</span>
        </div>

        <div v-if="classList.length === 0" class="empty-wrap">
          <van-empty description="暂未加入任何班级" />
        </div>

        <div
          v-for="cls in classList"
          :key="cls.id"
          class="class-card"
          @click="enterClass(cls)"
        >
          <div class="class-icon" :style="{ background: cls.color }">
            <van-icon name="notes-o" size="28" color="#fff" />
          </div>
          <div class="class-info">
            <div class="class-name">{{ cls.name }}</div>
            <div class="class-meta">
              <span><van-icon name="user-o" /> {{ cls.teacher }}</span>
              <span><van-icon name="friends-o" /> {{ cls.studentCount }}人</span>
            </div>
            <div class="class-subject">
              <van-tag type="primary" size="medium">{{ cls.subject }}</van-tag>
              <van-tag :type="cls.status === '进行中' ? 'success' : 'default'" size="medium" style="margin-left:6px">{{ cls.status }}</van-tag>
            </div>
          </div>
          <van-icon name="arrow" color="#c8c9cc" />
        </div>
      </div>
    </template>

    <!-- ===== 第二层：课程目录 ===== -->
    <template v-else-if="currentView === 'catalog'">
      <van-nav-bar
        :title="currentClass.name"
        left-arrow
        @click-left="currentView = 'classList'"
        fixed
        placeholder
      />

      <div class="page-body">
        <div class="course-info-card">
          <div class="course-info-left">
            <div class="course-subject">{{ currentClass.subject }}</div>
            <div class="course-teacher">授课教师：{{ currentClass.teacher }}</div>
          </div>
          <div class="course-progress">
            <van-circle
              :rate="currentClass.progress"
              :speed="100"
              :stroke-width="60"
              size="60px"
              color="#667eea"
              layer-color="#ebedf0"
            >
              <span class="progress-text">{{ currentClass.progress }}%</span>
            </van-circle>
            <div class="progress-label">完成度</div>
          </div>
        </div>

        <!-- 章节列表 -->
        <div class="section-header">
          <h3>课程目录</h3>
        </div>

        <van-collapse v-model="activeChapters" accordion>
          <van-collapse-item
            v-for="chapter in courseChapters"
            :key="chapter.id"
            :name="chapter.id"
          >
            <template #title>
              <div class="chapter-title">
                <van-icon name="bookmark-o" color="#667eea" />
                <span>{{ chapter.title }}</span>
                <van-badge :content="chapter.problems.length" color="#667eea" style="margin-left:auto" />
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
                  <div class="problem-difficulty" :class="'diff-' + problem.difficulty">
                    {{ difficultyLabel(problem.difficulty) }}
                  </div>
                  <div class="problem-info">
                    <div class="problem-title">{{ problem.title }}</div>
                    <div class="problem-tags">
                      <van-tag
                        v-for="tag in problem.tags"
                        :key="tag"
                        size="mini"
                        plain
                        type="primary"
                        style="margin-right:4px"
                      >{{ tag }}</van-tag>
                    </div>
                  </div>
                </div>
                <div class="problem-right">
                  <van-icon v-if="problem.solved" name="checked" color="#67c23a" size="18" />
                  <van-icon v-else name="circle" color="#c8c9cc" size="18" />
                  <van-icon name="arrow" color="#c8c9cc" size="14" style="margin-left:4px" />
                </div>
              </div>
            </div>
          </van-collapse-item>
        </van-collapse>
      </div>
    </template>

    <!-- ===== 第三层：题目详情弹窗 ===== -->
    <van-popup
      v-model:show="showProblemDetail"
      position="bottom"
      round
      :style="{ height: '92%' }"
    >
      <div class="problem-detail" v-if="currentProblem">
        <!-- 弹窗头部 -->
        <div class="detail-header">
          <div class="detail-title-row">
            <span class="detail-title">{{ currentProblem.title }}</span>
            <van-icon name="cross" size="20" color="#909399" @click="showProblemDetail = false" />
          </div>
          <div class="detail-meta">
            <van-tag :class="'diff-tag-' + currentProblem.difficulty" size="medium">
              {{ difficultyLabel(currentProblem.difficulty) }}
            </van-tag>
            <span class="meta-item"><van-icon name="clock-o" /> 时间限制：{{ currentProblem.timeLimit }}ms</span>
            <span class="meta-item"><van-icon name="orders-o" /> 内存限制：{{ currentProblem.memoryLimit }}MB</span>
          </div>
          <div class="detail-tags">
            <van-tag
              v-for="tag in currentProblem.tags"
              :key="tag"
              plain
              type="primary"
              size="medium"
              style="margin-right:6px;margin-bottom:4px"
            >{{ tag }}</van-tag>
          </div>
        </div>

        <div class="detail-body">
          <!-- 题目描述 -->
          <div class="detail-section">
            <div class="section-title-bar">📝 题目描述</div>
            <div class="section-content" v-html="currentProblem.description"></div>
          </div>

          <!-- 输入格式 -->
          <div class="detail-section">
            <div class="section-title-bar">📥 输入格式</div>
            <div class="section-content">{{ currentProblem.inputFormat }}</div>
          </div>

          <!-- 输出格式 -->
          <div class="detail-section">
            <div class="section-title-bar">📤 输出格式</div>
            <div class="section-content">{{ currentProblem.outputFormat }}</div>
          </div>

          <!-- 输入输出样例 -->
          <div class="detail-section">
            <div class="section-title-bar">💡 输入输出样例</div>
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
                <strong>说明：</strong>{{ sample.explanation }}
              </div>
            </div>
          </div>

          <!-- 提示 -->
          <div v-if="currentProblem.hint" class="detail-section">
            <div class="section-title-bar">🔔 提示</div>
            <div class="section-content">{{ currentProblem.hint }}</div>
          </div>
        </div>

        <!-- 底部操作 -->
        <div class="detail-footer">
          <van-button type="primary" block round size="large" @click="goToSubmit">
            <van-icon name="edit" /> 开始作答
          </van-button>
        </div>
      </div>
    </van-popup>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 当前视图层级
const currentView = ref('classList')
const currentClass = ref(null)
const currentProblem = ref(null)
const showProblemDetail = ref(false)
const activeChapters = ref('')

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
          description: '给你一个由 <code>\'1\'</code>（陆地）和 <code>\'0\'</code>（水）组成的二维网格，请你计算网格中岛屿的数量。岛屿总是被水拥围，并且每座岛屿只能由水平方向和/或垂直方向上相邻的陆地连接形成。',
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
  ]
}

const courseChapters = ref([])

// 进入班级
const enterClass = (cls) => {
  currentClass.value = cls
  courseChapters.value = courseChaptersMap[cls.id] || []
  activeChapters.value = ''
  currentView.value = 'catalog'
}

// 查看题目详情
const viewProblem = (problem) => {
  currentProblem.value = problem
  showProblemDetail.value = true
}

// 难度标签
const difficultyLabel = (diff) => {
  const map = { easy: '简单', medium: '中等', hard: '困难' }
  return map[diff] || diff
}

// 去作答（跳转到代码编辑页）
const goToSubmit = () => {
  showProblemDetail.value = false
  router.push({
    name: 'student-problem-code',
    params: { problemId: currentProblem.value.id }
  })
}
</script>

<style scoped>
.course-study-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.page-body {
  padding: 12px;
  padding-bottom: 30px;
}

/* 区块标题 */
.section-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
  padding: 4px 0;
}
.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #303133;
}
.sub-text {
  font-size: 12px;
  color: #909399;
}

/* 班级卡片 */
.class-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: transform 0.15s;
}
.class-card:active {
  transform: scale(0.98);
}
.class-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.class-info {
  flex: 1;
  min-width: 0;
}
.class-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.class-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}
.class-meta span {
  display: flex;
  align-items: center;
  gap: 3px;
}
.class-subject {
  display: flex;
  align-items: center;
}

/* 课程信息卡片 */
.course-info-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 14px;
  padding: 16px 20px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
}
.course-subject {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 6px;
}
.course-teacher {
  font-size: 13px;
  opacity: 0.85;
}
.progress-text {
  font-size: 13px;
  font-weight: 700;
  color: #667eea;
}
.progress-label {
  font-size: 12px;
  text-align: center;
  margin-top: 4px;
  opacity: 0.85;
}

/* 章节标题 */
.chapter-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

/* 题目列表 */
.problem-list {
  padding: 4px 0;
}
.problem-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  background: #fff;
}
.problem-item:last-child {
  border-bottom: none;
}
.problem-item:active {
  background: #f5f7fa;
}
.problem-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
  min-width: 0;
}
.problem-difficulty {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 10px;
  white-space: nowrap;
  flex-shrink: 0;
  margin-top: 2px;
}
.diff-easy { background: #e8f5e9; color: #4caf50; }
.diff-medium { background: #fff3e0; color: #ff9800; }
.diff-hard { background: #fce4ec; color: #e91e63; }

.problem-info {
  flex: 1;
  min-width: 0;
}
.problem-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.problem-tags {
  display: flex;
  flex-wrap: wrap;
}
.problem-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: 8px;
}

/* 题目详情弹窗 */
.problem-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.detail-header {
  padding: 16px 16px 12px;
  border-bottom: 1px solid #ebedf0;
  flex-shrink: 0;
}
.detail-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}
.detail-title {
  font-size: 17px;
  font-weight: 700;
  color: #303133;
  line-height: 1.4;
  flex: 1;
}
.detail-meta {
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
.diff-tag-easy { background: #e8f5e9 !important; color: #4caf50 !important; border-color: #4caf50 !important; }
.diff-tag-medium { background: #fff3e0 !important; color: #ff9800 !important; border-color: #ff9800 !important; }
.diff-tag-hard { background: #fce4ec !important; color: #e91e63 !important; border-color: #e91e63 !important; }

.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px;
  -webkit-overflow-scrolling: touch;
}
.detail-section {
  margin-top: 16px;
}
.section-title-bar {
  font-size: 14px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
}
.section-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.7;
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

/* 样例块 */
.sample-block {
  margin-bottom: 12px;
}
.sample-row {
  display: flex;
  gap: 10px;
}
.sample-col {
  flex: 1;
  min-width: 0;
}
.sample-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}
.sample-code {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
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
  padding: 6px 10px;
  background: #fafafa;
  border-radius: 6px;
}

/* 底部操作 */
.detail-footer {
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid #ebedf0;
  flex-shrink: 0;
}

/* 折叠面板样式 */
:deep(.van-collapse-item__content) {
  padding: 0;
}
:deep(.van-collapse-item__title) {
  padding: 14px 16px;
}

.empty-wrap {
  padding: 60px 0;
}
</style>
