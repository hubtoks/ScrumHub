<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h2 class="page-title">迭代计划</h2>
        <p class="page-desc">规划迭代目标，从待办列表拖拽故事加入迭代</p>
      </div>
      <div class="head-actions">
        <button class="btn-primary" @click="openCreateDialog">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          创建迭代
        </button>
        <button class="btn-danger" @click="handleDeleteIteration" :disabled="!selectedIterationId">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          删除迭代
        </button>
      </div>
    </div>

    <div class="plan-layout">
      <!-- 左侧：待办列表 -->
      <div class="plan-panel">
        <div class="panel-header">
          <span class="panel-title">未开始故事列表</span>
          <span class="panel-badge">{{ backlogStories.length }}</span>
        </div>
        <div class="panel-body">
          <div v-if="backlogStories.length === 0" class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="empty-icon">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <p>暂无可用的未开始故事</p>
          </div>
          <div v-for="story in backlogStories" :key="story.id" class="plan-story">
            <div class="plan-story-body">
              <div class="plan-story-title">{{ story.title }}</div>
              <div class="plan-story-meta">
                <span class="points-badge sm">{{ story.points }}点</span>
                <span class="plan-story-desc">{{ story.description }}</span>
              </div>
            </div>
            <button class="btn-add" @click="addToIteration(story, selectedIterationId)" :disabled="!selectedIterationId" title="加入迭代">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：迭代目标 -->
      <div class="plan-panel accent-border">
        <div class="panel-header">
          <span class="panel-title">迭代目标</span>
          <div v-if="currentIteration" class="panel-header-right">
            <span class="iter-name-tag">{{ currentIteration.name }}</span>
            <span class="iter-date-tag">{{ currentIteration.startDate }} → {{ currentIteration.endDate }}</span>
          </div>
        </div>
        <div class="panel-body">
          <div class="iter-select-wrap">
            <el-select v-model="selectedIterationId" placeholder="选择迭代" @change="onIterationChange" clearable>
              <el-option v-for="iter in iterations" :key="iter.id" :label="iter.name + ' (' + iter.startDate + ' ~ ' + iter.endDate + ')'" :value="iter.id" />
            </el-select>
          </div>

          <div v-if="!selectedIterationId" class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="empty-icon">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p>请选择或创建一个迭代</p>
          </div>

          <template v-if="selectedIterationId">
            <div class="iter-stats-bar">
              <span>📦 {{ iterStories.length }} 个故事</span>
              <span>⚡ {{ totalPoints }} 点</span>
            </div>
            <div v-if="iterStories.length === 0" class="empty-sub">尚未添加故事</div>
            <div v-for="story in iterStories" :key="story.id" class="plan-story iter-story">
              <div class="plan-story-body">
                <div class="plan-story-title">{{ story.title }}</div>
                <div class="plan-story-meta">
                  <span class="points-badge sm">{{ story.points }}点</span>
                  <span class="status-dot" :class="story.status">{{ statusLabel(story.status) }}</span>
                </div>
              </div>
              <button class="btn-remove" @click="removeFromIteration(story)" title="移出迭代">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- 创建迭代对话框 -->
    <el-dialog v-model="dialogVisible" title="创建新迭代" width="460px">
      <el-form :model="iterForm" label-position="top">
        <el-form-item label="迭代名称">
          <el-input v-model="iterForm.name" placeholder="如：Sprint 1" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="开始日期">
              <el-date-picker v-model="iterForm.startDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束日期">
              <el-date-picker v-model="iterForm.endDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateIteration">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { getStories, saveStory, getIterations, createIteration, deleteIteration } from '../api'
import { store } from '../store'

export default {
  name: 'IterationPlan',
  data() {
    return {
      backlogStories: [], iterations: [], iterStories: [],
      selectedIterationId: null,
      dialogVisible: false,
      iterForm: { name: '', startDate: '', endDate: '' }
    }
  },
  computed: {
    currentIteration() { return store.currentIteration },
    iterationId() { return store.currentIterationId },
    projectId() { return store.currentProjectId },
    totalPoints() { return this.iterStories.reduce((s, st) => s + Number(st.points), 0) }
  },
  watch: {
    iterationId(val) {
      this.selectedIterationId = val
    },
    projectId: {
      handler() {
        // 同步清空旧数据，避免异步加载前闪现上一个项目的内容
        this.iterations = []
        this.iterStories = []
        this.backlogStories = []
        this.selectedIterationId = null
        this.loadData()
      },
      immediate: true
    }
  },
  methods: {
    async loadData() {
      const projectId = store.currentProjectId
      if (!projectId) { this.iterations = []; this.backlogStories = []; return }
      await this.loadIterations()
      await this.loadBacklog()
      if (this.selectedIterationId) await this.loadIterStories()
    },
    async loadIterations() {
      const projectId = store.currentProjectId
      if (!projectId) return
      const res = await getIterations({ projectId })
      if (res.code === 200) {
        store.iterations = res.data
        this.iterations = res.data
        store.validateIterationId()
        this.selectedIterationId = store.currentIterationId
      }
    },
    async loadBacklog() {
      const projectId = store.currentProjectId
      if (!projectId) return
      const res = await getStories({ iterationId: 'null', status: 'todo', projectId })
      if (res.code === 200) this.backlogStories = res.data
    },
    async loadIterStories() {
      if (!this.selectedIterationId) { this.iterStories = []; return }
      const res = await getStories({ iterationId: this.selectedIterationId })
      if (res.code === 200) this.iterStories = res.data
    },
    async onIterationChange() {
      // el-select change 写入 store，跨页面共享
      store.currentIterationId = this.selectedIterationId
      await this.loadIterStories()
      await this.loadBacklog()
    },
    async addToIteration(story, iterId) {
      if (!iterId) { this.$message.warning('请先选择迭代'); return }
      const res = await saveStory({ id: story.id, iterationId: iterId, status: 'todo' })
      if (res.code === 200) { this.$message.success('已加入迭代'); this.loadData() }
      else this.$message.error(res.msg)
    },
    async removeFromIteration(story) {
      const res = await saveStory({ id: story.id, iterationId: null, status: 'todo' })
      if (res.code === 200) { this.$message.success('已移出迭代'); this.loadData() }
      else this.$message.error(res.msg)
    },
    openCreateDialog() { this.iterForm = { name: '', startDate: '', endDate: '' }; this.dialogVisible = true },
    async handleCreateIteration() {
      const { name, startDate, endDate } = this.iterForm
      if (!name || !startDate || !endDate) { this.$message.warning('请填写完整信息'); return }
      const res = await createIteration({ ...this.iterForm, projectId: store.currentProjectId })
      if (res.code === 200) {
        this.$message.success('迭代创建成功'); this.dialogVisible = false
        store.currentIterationId = res.data.id
        this.selectedIterationId = res.data.id
        this.loadData()
      } else this.$message.error(res.msg)
    },
    async handleDeleteIteration() {
      try {
        await this.$confirm('删除迭代将同步清空关联故事和回顾，确定？', '警告', { type: 'warning' })
        const res = await deleteIteration(this.selectedIterationId)
        if (res.code === 200) {
          this.$message.success('已删除')
          store.currentIterationId = null
          this.selectedIterationId = null
          this.iterStories = []
          this.loadData()
        } else this.$message.error(res.msg)
      } catch (_) {}
    },
    statusLabel(s) {
      return { todo:'未开始', doing:'进行中', done:'已完成' }[s] || s
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
.head-actions { display: flex; gap: 10px; }

.btn-primary {
  display: inline-flex; align-items: center; gap: 7px; padding: 10px 20px;
  background: var(--primary); color: #fff; border: none; border-radius: var(--radius-sm);
  font-size: 14px; font-weight: 600; cursor: pointer; transition: all var(--transition);
  box-shadow: 0 2px 8px rgba(99,102,241,.25);
}
.btn-primary:hover { background: var(--primary-dark); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(99,102,241,.35); }
.btn-primary svg { width: 16px; height: 16px; }

.btn-danger {
  display: inline-flex; align-items: center; gap: 7px; padding: 10px 20px;
  background: #fff; color: var(--danger); border: 1px solid var(--danger);
  border-radius: var(--radius-sm); font-size: 14px; font-weight: 600; cursor: pointer; transition: all var(--transition);
}
.btn-danger:hover:not(:disabled) { background: #fef2f2; }
.btn-danger:disabled { opacity: .4; cursor: not-allowed; }
.btn-danger svg { width: 16px; height: 16px; }

/* 布局 */
.plan-layout { display: flex; gap: 20px; }
.plan-panel {
  flex: 1; min-width: 0;
  background: #fff; border-radius: var(--radius); border: 1px solid var(--border);
  box-shadow: var(--shadow); display: flex; flex-direction: column;
}
.plan-panel.accent-border { border-top: 3px solid var(--primary); }
.panel-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; border-bottom: 1px solid var(--border);
}
.panel-title { font-weight: 600; font-size: 15px; color: var(--text-primary); }
.panel-header-right { display: flex; gap: 8px; align-items: center; }
.iter-name-tag {
  font-size: 12px; color: var(--primary); background: #eef2ff;
  padding: 3px 12px; border-radius: 20px; font-weight: 600;
}
.panel-badge {
  background: #f1f5f9; color: var(--text-secondary);
  font-size: 12px; padding: 2px 10px; border-radius: 20px; font-weight: 600;
}
.iter-date-tag {
  font-size: 11px; color: var(--primary); background: #eef2ff;
  padding: 3px 10px; border-radius: 20px; font-weight: 600;
}
.panel-body { padding: 16px 20px; flex: 1; overflow-y: auto; max-height: calc(100vh - 260px); }
.iter-select-wrap { margin-bottom: 16px; }
.iter-stats-bar {
  display: flex; gap: 20px; padding: 10px 0 16px;
  font-size: 14px; color: var(--text-secondary); font-weight: 600;
  border-bottom: 1px dashed var(--border); margin-bottom: 12px;
}

/* 故事卡片 */
.plan-story {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; margin-bottom: 8px;
  background: #f8fafc; border: 1px solid var(--border);
  border-radius: var(--radius-sm); transition: all var(--transition);
}
.plan-story:hover { border-color: var(--primary); background: #f5f3ff; box-shadow: 0 2px 6px rgba(99,102,241,.08); }
.plan-story.iter-story { border-left: 3px solid var(--primary); }
.plan-story-body { flex: 1; min-width: 0; }
.plan-story-title { font-weight: 600; font-size: 14px; color: var(--text-primary); margin-bottom: 4px; }
.plan-story-meta { display: flex; gap: 8px; align-items: center; }
.plan-story-desc { font-size: 12px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; }

.points-badge.sm {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 1px 8px; height: 22px;
  background: #fef3c7; color: #92400e;
  border-radius: 6px; font-size: 12px; font-weight: 700;
}
.status-dot {
  display: inline-block; padding: 2px 8px; border-radius: 20px;
  font-size: 11px; font-weight: 600;
}
.status-dot.todo { background: #dbeafe; color: #1d4ed8; }
.status-dot.doing { background: #fef3c7; color: #92400e; }
.status-dot.done { background: #d1fae5; color: #065f46; }

.btn-add, .btn-remove {
  width: 34px; height: 34px; border-radius: 50%; border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all var(--transition); flex-shrink: 0; margin-left: 8px;
}
.btn-add { background: var(--primary); color: #fff; }
.btn-add:hover:not(:disabled) { background: var(--primary-dark); transform: scale(1.1); box-shadow: 0 2px 8px rgba(99,102,241,.3); }
.btn-add:disabled { background: #cbd5e1; cursor: not-allowed; }
.btn-add svg, .btn-remove svg { width: 16px; height: 16px; }
.btn-remove { background: #fee2e2; color: var(--danger); }
.btn-remove:hover { background: #fecaca; transform: scale(1.1); }

.empty-state { text-align: center; padding: 40px 20px; }
.empty-icon { width: 40px; height: 40px; color: var(--text-muted); margin: 0 auto 10px; display: block; }
.empty-state p { color: var(--text-muted); font-size: 13px; }
.empty-sub { text-align: center; color: var(--text-muted); padding: 20px; font-size: 13px; }
</style>
