<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h2 class="page-title">迭代开发看板</h2>
        <p class="page-desc">拖拽故事变更状态，实时追踪迭代进度</p>
      </div>
      <div class="iter-select-box">
        <el-select v-model="selectedIterationId" placeholder="选择迭代" @change="onIterationChange" clearable>
          <el-option v-for="iter in iterations" :key="iter.id" :label="iter.name" :value="iter.id" />
        </el-select>
        <span v-if="currentIteration" class="iter-range">{{ currentIteration.startDate }} → {{ currentIteration.endDate }}</span>
      </div>
    </div>

    <div v-if="!selectedIterationId" class="empty-hero">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="hero-icon">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
      </svg>
      <h3>请选择一个迭代开始工作</h3>
      <p>在左侧导航中选择迭代计划创建迭代</p>
    </div>

    <template v-if="selectedIterationId">
      <!-- 统计卡片 -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon total">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/><line x1="12" y1="22" x2="12" y2="15.5"/><polyline points="22 8.5 12 15.5 2 8.5"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.totalPoints }}</span>
            <span class="stat-desc">总故事点</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon done">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-value green">{{ stats.completedPoints }}</span>
            <span class="stat-desc">已完成</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon remain">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-value amber">{{ stats.remainingPoints }}</span>
            <span class="stat-desc">剩余点数</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon rate">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </div>
          <div class="stat-info">
            <span class="stat-value primary">{{ stats.completionRate }}%</span>
            <span class="stat-desc">完成率</span>
          </div>
        </div>
      </div>

      <!-- 看板三列 -->
      <div class="board-row">
        <div class="board-col">
          <div class="col-header todo-header">
            <div class="col-title">
              <span class="col-dot todo-dot"></span>
              <span>未开始</span>
            </div>
            <span class="col-points">{{ stats.todoPoints }}点</span>
          </div>
          <div class="col-body" @dragover.prevent @drop="onDrop($event, 'todo')">
            <div v-for="story in todoStories" :key="story.id" class="board-card"
              draggable="true" @dragstart="onDragStart($event, story)">
              <div class="board-card-head">
                <span class="card-points">{{ story.points }}点</span>
              </div>
              <div class="board-card-title">{{ story.title }}</div>
              <div class="board-card-desc">{{ story.description }}</div>
            </div>
            <div v-if="todoStories.length === 0" class="col-placeholder">拖拽故事到此处</div>
          </div>
        </div>

        <div class="board-col">
          <div class="col-header doing-header">
            <div class="col-title">
              <span class="col-dot doing-dot"></span>
              <span>进行中</span>
            </div>
            <span class="col-points">{{ stats.doingPoints }}点</span>
          </div>
          <div class="col-body" @dragover.prevent @drop="onDrop($event, 'doing')">
            <div v-for="story in doingStories" :key="story.id" class="board-card doing"
              draggable="true" @dragstart="onDragStart($event, story)">
              <div class="board-card-head">
                <span class="card-points">{{ story.points }}点</span>
              </div>
              <div class="board-card-title">{{ story.title }}</div>
              <div class="board-card-desc">{{ story.description }}</div>
            </div>
            <div v-if="doingStories.length === 0" class="col-placeholder">拖拽故事到此处</div>
          </div>
        </div>

        <div class="board-col">
          <div class="col-header done-header">
            <div class="col-title">
              <span class="col-dot done-dot"></span>
              <span>已完成</span>
            </div>
            <span class="col-points">{{ stats.donePoints }}点</span>
          </div>
          <div class="col-body" @dragover.prevent @drop="onDrop($event, 'done')">
            <div v-for="story in doneStories" :key="story.id" class="board-card done"
              draggable="true" @dragstart="onDragStart($event, story)">
              <div class="board-card-head">
                <span class="card-points">{{ story.points }}点</span>
              </div>
              <div class="board-card-title">{{ story.title }}</div>
              <div class="board-card-desc">{{ story.description }}</div>
            </div>
            <div v-if="doneStories.length === 0" class="col-placeholder">拖拽故事到此处</div>
          </div>
        </div>
      </div>

      <!-- 燃尽图 -->
      <div class="chart-card">
        <div class="chart-head">
          <span class="chart-title">📉 故事点燃尽图</span>
          <div class="chart-legend">
            <span><span class="legend-dot planned"></span> 控制线</span>
            <span><span class="legend-dot actual"></span> 趋势线</span>
          </div>
        </div>
        <div class="chart-body">
          <canvas ref="chartCanvas" width="750" height="360"></canvas>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { getStories, saveStory, getIterations, getDashboard } from '../api'
import { store } from '../store'

export default {
  name: 'BoardManagement',
  data() {
    return {
      iterations: [], stories: [],
      selectedIterationId: null,
      stats: { totalPoints:0, completedPoints:0, remainingPoints:0, todoPoints:0, doingPoints:0, donePoints:0, completionRate:0 },
      burndownData: { planned:[], actual:[], dates:[] },
      dragStory: null
    }
  },
  computed: {
    currentIteration() { return store.currentIteration },
    iterationId() { return store.currentIterationId },
    projectId() { return store.currentProjectId },
    todoStories() { return this.stories.filter(s => s.status === 'todo') },
    doingStories() { return this.stories.filter(s => s.status === 'doing') },
    doneStories() { return this.stories.filter(s => s.status === 'done') }
  },
  watch: {
    iterationId(val) {
      this.selectedIterationId = val
    },
    projectId: {
      handler() {
        // 同步清空旧数据，避免异步加载前闪现上一个项目的内容
        this.iterations = []
        this.stories = []
        this.selectedIterationId = null
        this.loadIterations()
      },
      immediate: true
    }
  },
  methods: {
    async loadIterations() {
      const projectId = store.currentProjectId
      if (!projectId) { this.iterations = []; return }
      const res = await getIterations({ projectId })
      if (res.code === 200) {
        store.iterations = res.data
        this.iterations = res.data
        store.validateIterationId()
        this.selectedIterationId = store.currentIterationId
      }
      if (this.selectedIterationId) await this.loadBoard()
    },
    async onIterationChange() {
      store.currentIterationId = this.selectedIterationId
      if (this.selectedIterationId) await this.loadBoard()
    },
    async loadBoard() {
      const sRes = await getStories({ iterationId: this.selectedIterationId })
      if (sRes.code === 200) this.stories = sRes.data
      const dRes = await getDashboard(this.selectedIterationId)
      if (dRes.code === 200) {
        Object.assign(this.stats, dRes.data.statistics)
        this.burndownData = { ...dRes.data.burndownData }
        this.$nextTick(() => this.drawChart())
      }
    },

    // 拖拽：开始拖拽时记录故事
    onDragStart(event, story) {
      this.dragStory = story
      event.dataTransfer.effectAllowed = 'move'
    },

    // 拖拽：放置时更新故事状态，自动刷新燃尽图
    // 状态流转限制：doing→todo 和 done→* 需要确认
    async onDrop(event, newStatus) {
      if (!this.dragStory || this.dragStory.status === newStatus) return
      const current = this.dragStory.status

      // 非正向流转（doing→todo 或 done→doing/todo）需要弹窗确认
      const needsConfirm =
        (current === 'doing' && newStatus === 'todo') ||
        (current === 'done' && (newStatus === 'todo' || newStatus === 'doing'))

      if (needsConfirm) {
        // 构建合适的提示文案
        let msg = ''
        if (current === 'doing' && newStatus === 'todo') {
          msg = '确定要将进行中的故事退回未开始吗？'
        } else if (current === 'done') {
          msg = newStatus === 'doing'
            ? '确定要将已完成的故事退回进行中吗？'
            : '确定要将已完成的故事退回未开始吗？'
        }

        try {
          await this.$confirm(msg, '状态变更确认', { type: 'warning' })
        } catch (_) {
          this.dragStory = null
          return
        }
      }

      const res = await saveStory({ id: this.dragStory.id, status: newStatus })
      if (res.code === 200) { await this.loadBoard() } else { this.$message.error(res.msg) }
      this.dragStory = null
    },

    // Canvas 绘制燃尽图
    drawChart() {
      const canvas = this.$refs.chartCanvas
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      const { dates, planned, actual } = this.burndownData
      if (!dates || dates.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.font = '15px -apple-system, sans-serif'; ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'center'
        ctx.fillText('暂无燃尽图数据', canvas.width / 2, canvas.height / 2)
        return
      }
      const pad = { t: 35, r: 50, b: 55, l: 55 }
      const cw = canvas.width - pad.l - pad.r
      const ch = canvas.height - pad.t - pad.b
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const maxV = Math.max(...planned, ...actual, 1)
      const yMax = Math.ceil(maxV * 1.15)

      // 网格背景
      const ySteps = 5
      ctx.font = '11px -apple-system, sans-serif'; ctx.textAlign = 'right'
      for (let i = 0; i <= ySteps; i++) {
        const y = pad.t + (ch / ySteps) * i
        const val = yMax - (yMax / ySteps) * i
        ctx.fillStyle = '#64748b'; ctx.fillText(Math.round(val), pad.l - 10, y + 4)
        ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(pad.l + 1, y); ctx.lineTo(pad.l + cw, y); ctx.stroke()
      }

      // X 轴标签
      ctx.font = '10px -apple-system, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#64748b'
      const xStep = cw / (dates.length - 1) || 1
      dates.forEach((d, i) => {
        const x = pad.l + xStep * i
        ctx.save(); ctx.translate(x, pad.t + ch + 10); ctx.rotate(-Math.PI / 4.5)
        ctx.fillText(d, 0, 0); ctx.restore()
      })

      // 坐标轴
      ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + ch); ctx.lineTo(pad.l + cw, pad.t + ch); ctx.stroke()

      const plotY = (v) => pad.t + ch - (v / yMax) * ch
      const plotX = (i) => pad.l + xStep * i

      // 面积填充——计划线下
      ctx.beginPath(); ctx.moveTo(plotX(0), pad.t + ch)
      planned.forEach((v, i) => ctx.lineTo(plotX(i), plotY(v)))
      ctx.lineTo(plotX(planned.length - 1), pad.t + ch); ctx.closePath()
      ctx.fillStyle = 'rgba(99,102,241,.06)'; ctx.fill()

      // 面积填充——实际线下
      ctx.beginPath(); ctx.moveTo(plotX(0), pad.t + ch)
      actual.forEach((v, i) => ctx.lineTo(plotX(i), plotY(v)))
      ctx.lineTo(plotX(actual.length - 1), pad.t + ch); ctx.closePath()
      ctx.fillStyle = 'rgba(239,68,68,.05)'; ctx.fill()

      // 计划线（虚线）
      ctx.strokeStyle = '#818cf8'; ctx.lineWidth = 2; ctx.setLineDash([6, 4])
      ctx.beginPath(); planned.forEach((v, i) => { const x = plotX(i), y = plotY(v); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y) }); ctx.stroke(); ctx.setLineDash([])

      // 实际线（实线）
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2.5
      ctx.beginPath(); actual.forEach((v, i) => { const x = plotX(i), y = plotY(v); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y) }); ctx.stroke()

      // 数据点
      planned.forEach((v, i) => { ctx.fillStyle = '#818cf8'; ctx.beginPath(); ctx.arc(plotX(i), plotY(v), 4, 0, Math.PI * 2); ctx.fill() })
      actual.forEach((v, i) => { ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(plotX(i), plotY(v), 4.5, 0, Math.PI * 2); ctx.fill() })
    }
  }
}
</script>

<style scoped>
.page { animation: fadeIn .35s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

.page-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.page-title { font-size: 22px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.3px; }
.page-desc { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
.iter-select-box { display: flex; align-items: center; gap: 12px; }
.iter-range { font-size: 12px; color: var(--text-muted); background: #f1f5f9; padding: 3px 10px; border-radius: 4px; }

/* 空地状态 */
.empty-hero { text-align: center; padding: 80px 20px; }
.hero-icon { width: 56px; height: 56px; color: var(--text-muted); margin: 0 auto 16px; display: block; }
.empty-hero h3 { font-size: 17px; color: var(--text-secondary); font-weight: 600; }
.empty-hero p { font-size: 13px; color: var(--text-muted); margin-top: 6px; }

/* 统计卡片 */
.stats-row { display: flex; gap: 16px; margin-bottom: 20px; }
.stat-card {
  flex: 1; display: flex; align-items: center; gap: 14px;
  padding: 18px 20px; background: #fff;
  border-radius: var(--radius); border: 1px solid var(--border);
  box-shadow: var(--shadow-sm); transition: box-shadow var(--transition);
}
.stat-card:hover { box-shadow: var(--shadow-md); }
.stat-icon {
  width: 44px; height: 44px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
}
.stat-icon svg { width: 22px; height: 22px; }
.stat-icon.total { background: #eef2ff; color: var(--primary); }
.stat-icon.done { background: #d1fae5; color: var(--success); }
.stat-icon.remain { background: #fef3c7; color: var(--warning); }
.stat-icon.rate { background: #ede9fe; color: #7c3aed; }
.stat-info { display: flex; flex-direction: column; }
.stat-value { font-size: 26px; font-weight: 800; color: var(--text-primary); line-height: 1; }
.stat-value.green { color: var(--success); }
.stat-value.amber { color: var(--warning); }
.stat-value.primary { color: #7c3aed; }
.stat-desc { font-size: 11px; color: var(--text-muted); letter-spacing: .3px; margin-top: 2px; }

/* 看板 */
.board-row {
  display: flex; gap: 16px; margin-bottom: 20px;
  height: calc(100vh - 420px);
  min-height: 360px;
}
.board-col {
  flex: 1; min-width: 0;
  background: #f8fafc; border-radius: var(--radius);
  border: 1px solid var(--border); display: flex; flex-direction: column;
  overflow: hidden;
}
.col-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px; border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.col-title { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; color: var(--text-primary); }
.col-dot { width: 9px; height: 9px; border-radius: 50%; }
.todo-dot { background: #3b82f6; }
.doing-dot { background: #f59e0b; }
.done-dot { background: #10b981; }
.col-points { font-size: 12px; color: var(--text-muted); font-weight: 600; }
.col-body {
  flex: 1; padding: 10px 12px; min-height: 0;
  overflow-y: auto;
}
.col-placeholder { text-align: center; color: var(--text-muted); font-size: 13px; padding: 40px 0; }

/* 看板卡片 */
.board-card {
  background: #fff; border: 1px solid var(--border); border-radius: 8px;
  padding: 12px 14px; margin-bottom: 10px; cursor: grab;
  transition: all var(--transition); box-shadow: var(--shadow-sm);
}
.board-card:hover { border-color: var(--primary); box-shadow: 0 4px 12px rgba(99,102,241,.12); transform: translateY(-1px); }
.board-card:active { cursor: grabbing; }
.board-card.doing { border-left: 3px solid var(--warning); }
.board-card.done { border-left: 3px solid var(--success); }
.board-card-head { margin-bottom: 6px; }
.card-points {
  display: inline-block; padding: 2px 8px; background: #fef3c7; color: #92400e;
  border-radius: 4px; font-size: 11px; font-weight: 700;
}
.board-card-title { font-weight: 600; font-size: 14px; color: var(--text-primary); margin-bottom: 4px; }
.board-card-desc { font-size: 12px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 燃尽图 */
.chart-card {
  background: #fff; border-radius: var(--radius); border: 1px solid var(--border);
  box-shadow: var(--shadow);
}
.chart-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 24px; border-bottom: 1px solid var(--border);
}
.chart-title { font-weight: 600; font-size: 15px; color: var(--text-primary); }
.chart-legend { display: flex; gap: 24px; font-size: 12px; color: var(--text-muted); }
.chart-legend span { display: flex; align-items: center; gap: 6px; }
.legend-dot { display: inline-block; width: 26px; height: 3px; border-radius: 2px; }
.legend-dot.planned { background: #818cf8; border: 1px dashed #818cf8; }
.legend-dot.actual { background: #ef4444; }
.chart-body { text-align: center; padding: 16px 10px; }
.chart-body canvas { max-width: 100%; height: auto; }
</style>
