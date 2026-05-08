<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h2 class="page-title">产品待办列表</h2>
        <p class="page-desc">按优先级排序管理待办事项，拖拽调整优先级</p>
      </div>
      <div class="filter-tabs">
        <button :class="['tab', { active: filter === 'all' }]" @click="setFilter('all')">全部</button>
        <button :class="['tab', { active: filter === 'todo' }]" @click="setFilter('todo')">未开始</button>
      </div>
    </div>

    <div class="card" v-if="stories.length === 0">
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="empty-icon">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <p>暂无待办故事</p>
      </div>
    </div>

    <div class="card" v-else>
      <div class="table-toolbar">
        <span class="toolbar-hint">拖拽 ↑ ↓ 调整优先级，数字越小越优先</span>
        <button class="btn-primary sm" @click="savePriority">保存排序</button>
      </div>
      <el-table :data="stories" stripe row-key="id">
        <el-table-column width="48" align="center">
          <template #default>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="grip-icon">
              <line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/>
              <line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/>
            </svg>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80" align="center">
          <template #default="scope">
            <span class="priority-num">{{ scope.row.priority }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="故事标题" min-width="180">
          <template #default="scope">
            <span class="story-title-link">{{ scope.row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="points" label="故事点" width="90" align="center">
          <template #default="scope">
            <span class="points-badge">{{ scope.row.points }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="scope">
            <span class="status-dot" :class="scope.row.status">{{ statusLabel(scope.row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="排序" width="100" align="center">
          <template #default="scope">
            <button class="sort-btn" @click="moveUp(scope.$index)" :disabled="scope.$index === 0">▲</button>
            <button class="sort-btn" @click="moveDown(scope.$index)" :disabled="scope.$index === stories.length - 1">▼</button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import { getStories, updatePriority } from '../api'
import { store } from '../store'

export default {
  name: 'BacklogManagement',
  data() {
    return { stories: [], filter: store.backlogFilter || 'all' }
  },
  computed: {
    projectId() { return store.currentProjectId }
  },
  watch: {
    projectId: { handler() { this.loadStories() }, immediate: true }
  },
  methods: {
    async loadStories() {
      const projectId = store.currentProjectId
      if (!projectId) { this.stories = []; return }
      const params = { projectId }
      if (this.filter === 'todo') params.status = 'todo'
      const res = await getStories(params)
      if (res.code === 200) this.stories = res.data
    },
    setFilter(v) {
      this.filter = v
      store.backlogFilter = v
      this.loadStories()
    },
    statusLabel(s) {
      return { todo:'未开始', doing:'进行中', done:'已完成' }[s] || s
    },
    moveUp(i) {
      if (i === 0) return
      ;[this.stories[i-1], this.stories[i]] = [this.stories[i], this.stories[i-1]]
      this.recalcPriority()
    },
    moveDown(i) {
      if (i === this.stories.length - 1) return
      ;[this.stories[i], this.stories[i+1]] = [this.stories[i+1], this.stories[i]]
      this.recalcPriority()
    },
    recalcPriority() {
      this.stories.forEach((s, i) => { s.priority = i + 1 })
    },
    async savePriority() {
      const list = this.stories.map(s => ({ id: s.id, priority: s.priority }))
      const res = await updatePriority(list)
      if (res.code === 200) this.$message.success('优先级已保存')
      else this.$message.error(res.msg)
    }
  }
}
</script>

<style scoped>
.page { animation: fadeIn .35s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

.page-head {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 24px;
}
.page-title { font-size: 22px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.3px; }
.page-desc { font-size: 13px; color: var(--text-muted); margin-top: 4px; }

.filter-tabs { display: flex; gap: 0; background: #f1f5f9; border-radius: var(--radius-sm); padding: 3px; }
.tab {
  padding: 7px 18px; border: none; background: transparent;
  font-size: 13px; font-weight: 500; color: var(--text-secondary);
  border-radius: 4px; cursor: pointer; transition: all var(--transition);
}
.tab.active { background: #fff; color: var(--primary); box-shadow: var(--shadow-sm); }

.btn-primary {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 10px 20px;
  background: var(--primary); color: #fff;
  border: none; border-radius: var(--radius-sm);
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: all var(--transition);
  box-shadow: 0 2px 8px rgba(99,102,241,.25);
}
.btn-primary:hover { background: var(--primary-dark); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(99,102,241,.35); }
.btn-primary.sm { padding: 8px 16px; font-size: 13px; }

.card {
  background: #fff; border-radius: var(--radius);
  border: 1px solid var(--border); box-shadow: var(--shadow);
}
.table-toolbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 20px; border-bottom: 1px solid var(--border);
}
.toolbar-hint { font-size: 13px; color: var(--text-muted); }

.grip-icon { width: 17px; height: 17px; color: var(--text-muted); cursor: grab; }
.story-title-link { font-weight: 600; color: var(--text-primary); }
.points-badge {
  display: inline-flex; align-items: center; justify-content: center;
  width: 36px; height: 28px;
  background: #fef3c7; color: #92400e;
  border-radius: 6px; font-size: 13px; font-weight: 700;
}
.priority-num {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px;
  background: #f1f5f9; color: var(--text-secondary);
  border-radius: 50%; font-size: 13px; font-weight: 700;
}
.status-dot {
  display: inline-block; padding: 3px 10px; border-radius: 20px;
  font-size: 12px; font-weight: 600;
}
.status-dot.todo { background: #dbeafe; color: #1d4ed8; }
.status-dot.doing { background: #fef3c7; color: #92400e; }
.status-dot.done { background: #d1fae5; color: #065f46; }

.sort-btn {
  width: 28px; height: 26px; border: 1px solid var(--border);
  background: #fff; border-radius: 4px; cursor: pointer;
  font-size: 11px; color: var(--text-secondary); margin: 0 1px;
  transition: all var(--transition);
}
.sort-btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); background: #f5f3ff; }
.sort-btn:disabled { opacity: .35; cursor: not-allowed; }

.empty-state { text-align: center; padding: 60px 20px; }
.empty-icon { width: 48px; height: 48px; color: var(--text-muted); margin: 0 auto 12px; display: block; }
.empty-state p { color: var(--text-muted); font-size: 14px; }
</style>
