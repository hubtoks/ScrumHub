<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h2 class="page-title">产品待办列表</h2>
        <p class="page-desc">拖拽行调整优先级，数字越小越优先</p>
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
        <span class="toolbar-hint">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="hint-icon">
            <line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/>
            <line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/>
          </svg>
          拖拽行调整顺序，修改后点击保存
        </span>
        <button class="btn-primary sm" @click="savePriority">保存排序</button>
      </div>

      <!-- 表头 -->
      <div class="list-header">
        <span class="col-grip"></span>
        <span class="col-priority">优先级</span>
        <span class="col-title">故事标题</span>
        <span class="col-desc">描述</span>
        <span class="col-points">故事点</span>
        <span class="col-status">状态</span>
      </div>

      <!-- 拖拽列表 -->
      <div class="drag-list" ref="dragList">
        <div
          v-for="(story, index) in stories"
          :key="story.id"
          class="drag-row"
          :class="{
            'drag-over': dragOverIndex === index,
            'dragging': dragIndex === index,
            'drag-before': dragBeforeIndex === index && dragIndex !== index
          }"
          draggable="true"
          @dragstart="onDragStart($event, index)"
          @dragover.prevent="onDragOver($event, index)"
          @dragenter.prevent="onDragEnter(index)"
          @dragleave="onDragLeave(index)"
          @drop="onDrop($event, index)"
          @dragend="onDragEnd"
        >
          <span class="col-grip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="grip-icon">
              <line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/>
              <line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/>
            </svg>
          </span>
          <span class="col-priority">
            <span class="priority-num-badge" v-if="dirtyPriorities[story.id] !== undefined">{{ dirtyPriorities[story.id] }}</span>
            <span class="priority-num-badge muted" v-else>{{ story.priority }}</span>
          </span>
          <span class="col-title story-title-link">{{ story.title }}</span>
          <span class="col-desc story-desc">{{ story.description }}</span>
          <span class="col-points">
            <span class="points-badge">{{ story.points }}</span>
          </span>
          <span class="col-status">
            <span class="status-dot" :class="story.status">{{ statusLabel(story.status) }}</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getStories, updatePriority } from '../api'
import { store } from '../store'

export default {
  name: 'BacklogManagement',
  data() {
    return {
      stories: [],
      filter: store.backlogFilter || 'all',
      dragIndex: null,
      dragOverIndex: null,
      dragBeforeIndex: null,
      dirtyPriorities: {}  // 记录本地排序后的新优先级
    }
  },
  computed: {
    projectId() { return store.currentProjectId }
  },
  watch: {
    projectId: { handler() { this.loadStories() }, immediate: true }
  },
  methods: {
    async loadStories() {
      this.dirtyPriorities = {}
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

    // ==================== 拖拽排序 ====================
    onDragStart(e, index) {
      this.dragIndex = index
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', index)
      // 拖拽时降低透明度
      e.target.classList.add('dragging')
    },

    onDragOver(e, index) {
      e.dataTransfer.dropEffect = 'move'
    },

    onDragEnter(index) {
      if (this.dragIndex === null || this.dragIndex === index) return
      this.dragOverIndex = index
      // 拖入位置在源之后 → 插入线在下方；在源之前 → 插入线在上方
      this.dragBeforeIndex = index
    },

    onDragLeave(index) {
      if (this.dragOverIndex === index) {
        this.dragOverIndex = null
        this.dragBeforeIndex = null
      }
    },

    onDrop(e, targetIndex) {
      e.preventDefault()
      const sourceIndex = this.dragIndex
      if (sourceIndex === null || sourceIndex === targetIndex) return

      // 移动数组元素
      const item = this.stories.splice(sourceIndex, 1)[0]
      this.stories.splice(targetIndex, 0, item)

      // 重新计算所有行优先级
      this.stories.forEach((s, i) => {
        this.dirtyPriorities[s.id] = i + 1
      })
    },

    onDragEnd(e) {
      e.target.classList.remove('dragging')
      this.dragIndex = null
      this.dragOverIndex = null
      this.dragBeforeIndex = null
    },

    // ==================== 保存优先级 ====================
    async savePriority() {
      if (Object.keys(this.dirtyPriorities).length === 0) {
        this.$message.info('排序没有变化')
        return
      }
      const list = Object.entries(this.dirtyPriorities).map(([id, priority]) => ({ id, priority }))
      const res = await updatePriority(list)
      if (res.code === 200) {
        this.$message.success('优先级已保存')
        this.dirtyPriorities = {}
        this.loadStories()
      } else {
        this.$message.error(res.msg)
      }
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

.filter-tabs { display: flex; gap: 0; background: #f1f5f9; border-radius: var(--radius-sm); padding: 3px; }
.tab {
  padding: 7px 18px; border: none; background: transparent;
  font-size: 13px; font-weight: 500; color: var(--text-secondary);
  border-radius: 4px; cursor: pointer; transition: all var(--transition);
}
.tab.active { background: #fff; color: var(--primary); box-shadow: var(--shadow-sm); }

.btn-primary {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 10px 20px; background: var(--primary); color: #fff;
  border: none; border-radius: var(--radius-sm);
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: all var(--transition); box-shadow: 0 2px 8px rgba(99,102,241,.25);
}
.btn-primary:hover { background: var(--primary-dark); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(99,102,241,.35); }
.btn-primary.sm { padding: 8px 16px; font-size: 13px; }

.card { background: #fff; border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow); }

.table-toolbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 20px; border-bottom: 1px solid var(--border);
}
.toolbar-hint { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-muted); }
.hint-icon { width: 16px; height: 16px; color: var(--text-muted); }

/* 列表表头 */
.list-header {
  display: flex; align-items: center;
  padding: 10px 16px;
  font-size: 11px; font-weight: 600; color: var(--text-secondary);
  text-transform: uppercase; letter-spacing: 0.5px;
  border-bottom: 2px solid var(--border);
  background: #f8fafc;
}

/* 拖拽列表 */
.drag-list { user-select: none; }

/* 拖拽行 */
.drag-row {
  display: flex; align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  transition: all 0.15s ease;
  cursor: grab;
  position: relative;
}
.drag-row:hover { background: #f8fafc; }
.drag-row:active { cursor: grabbing; }

/* 拖拽中自己 */
.drag-row.dragging { opacity: 0.4; background: #eef2ff; }

/* 插入指示线 */
.drag-row.drag-before::before {
  content: '';
  position: absolute;
  top: -2px; left: 12px; right: 12px;
  height: 4px;
  background: var(--primary);
  border-radius: 2px;
  z-index: 5;
  animation: pulse 0.6s ease infinite alternate;
}
@keyframes pulse { from { opacity: 0.6; } to { opacity: 1; } }

/* 列宽 */
.col-grip { width: 40px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.col-priority { width: 80px; flex-shrink: 0; }
.col-title { width: 200px; flex-shrink: 0; }
.col-desc { flex: 1; min-width: 0; }
.col-points { width: 90px; flex-shrink: 0; text-align: center; }
.col-status { width: 90px; flex-shrink: 0; text-align: center; }

.grip-icon { width: 18px; height: 18px; color: var(--text-muted); }
.story-title-link { font-weight: 600; font-size: 14px; color: var(--text-primary); }
.story-desc { font-size: 13px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.priority-num-badge {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px;
  background: var(--primary); color: #fff;
  border-radius: 50%; font-size: 13px; font-weight: 700;
  transition: all 0.2s ease;
}
.priority-num-badge.muted {
  background: #f1f5f9; color: var(--text-secondary);
}

.points-badge {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 2px 10px; height: 26px;
  background: #fef3c7; color: #92400e;
  border-radius: 6px; font-size: 12px; font-weight: 700;
}

.status-dot {
  display: inline-block; padding: 3px 10px; border-radius: 20px;
  font-size: 12px; font-weight: 600;
}
.status-dot.todo { background: #dbeafe; color: #1d4ed8; }
.status-dot.doing { background: #fef3c7; color: #92400e; }
.status-dot.done { background: #d1fae5; color: #065f46; }

.empty-state { text-align: center; padding: 60px 20px; }
.empty-icon { width: 48px; height: 48px; color: var(--text-muted); margin: 0 auto 12px; display: block; }
.empty-state p { color: var(--text-muted); font-size: 14px; }
</style>
