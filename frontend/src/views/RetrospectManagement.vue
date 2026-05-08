<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h2 class="page-title">迭代回顾</h2>
        <p class="page-desc">记录做得好的三件事和待改进的三件事</p>
      </div>
      <div class="iter-select-box">
        <el-select v-model="selectedIterationId" placeholder="选择迭代" @change="onIterationChange" clearable>
          <el-option v-for="iter in iterations" :key="iter.id" :label="iter.name" :value="iter.id" />
        </el-select>
      </div>
    </div>

    <div v-if="!selectedIterationId" class="empty-hero">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="hero-icon">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
      <h3>请选择一个迭代</h3>
      <p>在迭代计划中创建迭代后进行回顾</p>
    </div>

    <template v-if="selectedIterationId">
      <div class="retro-layout">
        <!-- 左侧：编写回顾 -->
        <div class="retro-panel">
          <div class="panel-head">
            <span class="panel-label">✍️ 编写回顾</span>
            <span class="panel-iter">{{ currentIteration ? currentIteration.name : '' }}</span>
          </div>
          <div class="panel-body">
            <!-- 做得好的三件事 -->
            <div class="section">
              <div class="section-head">
                <span class="section-icon good">👍</span>
                <span class="section-title">做得好的三件事</span>
              </div>
              <div class="input-group" v-for="(_, i) in 3" :key="'g'+i">
                <span class="input-num good-num">{{ i + 1 }}</span>
                <input class="retro-input" v-model="goodItems[i]" :placeholder="'第' + (i+1) + '件做得好的事…'" />
              </div>
            </div>

            <!-- 待改进的三件事 -->
            <div class="section">
              <div class="section-head">
                <span class="section-icon improve">💡</span>
                <span class="section-title">待改进的三件事</span>
              </div>
              <div class="input-group" v-for="(_, i) in 3" :key="'m'+i">
                <span class="input-num improve-num">{{ i + 1 }}</span>
                <input class="retro-input" v-model="improveItems[i]" :placeholder="'第' + (i+1) + '件待改进的事…'" />
              </div>
            </div>

            <button class="btn-save" @click="saveRetrospect">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              保存回顾
            </button>
          </div>
        </div>

        <!-- 右侧：历史回顾 -->
        <div class="retro-panel">
          <div class="panel-head">
            <span class="panel-label">📋 历史回顾记录</span>
          </div>
          <div class="panel-body">
            <div v-if="iterations.length === 0" class="empty-small">暂无迭代</div>
            <div v-for="iter in iterations" :key="iter.id" class="history-item" @click="selectHistoryIteration(iter.id)" :class="{ active: selectedIterationId === iter.id }">
              <div class="history-head">
                <span class="history-name">{{ iter.name }}</span>
                <span class="history-date">{{ iter.startDate }} ~ {{ iter.endDate }}</span>
              </div>
              <div v-if="retroMap[iter.id]" class="history-content">
                <div class="history-section">
                  <span class="history-label good-label">做得好的</span>
                  <ul class="history-list">
                    <li v-for="(g, i) in retroMap[iter.id].good" :key="'g'+i">{{ g }}</li>
                  </ul>
                </div>
                <div class="history-section">
                  <span class="history-label improve-label">待改进的</span>
                  <ul class="history-list">
                    <li v-for="(m, i) in retroMap[iter.id].improve" :key="'m'+i">{{ m }}</li>
                  </ul>
                </div>
              </div>
              <div v-else class="no-review">暂无回顾</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { getIterations, getRetrospect, saveRetrospect } from '../api'
import { store } from '../store'

export default {
  name: 'RetrospectManagement',
  data() {
    return { iterations: [], selectedIterationId: null, goodItems: ['','',''], improveItems: ['','',''], retroMap: {} }
  },
  computed: {
    currentIteration() { return store.currentIteration },
    iterationId() { return store.currentIterationId },
    projectId() { return store.currentProjectId }
  },
  watch: {
    iterationId(val) {
      this.selectedIterationId = val
    },
    projectId: {
      handler() {
        this.iterations = []
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
        this.iterations.forEach(iter => this.loadRetrospectForIteration(iter.id))
      }
      if (this.selectedIterationId) this.onIterationChange()
    },
    async loadRetrospectForIteration(iterId) {
      const res = await getRetrospect(iterId)
      if (res.code === 200 && res.data) this.retroMap[iterId] = res.data
    },
    async onIterationChange() {
      store.currentIterationId = this.selectedIterationId
      if (!this.selectedIterationId) return
      const res = await getRetrospect(this.selectedIterationId)
      if (res.code === 200 && res.data) {
        this.goodItems = [...res.data.good, '', '', ''].slice(0, 3)
        this.improveItems = [...res.data.improve, '', '', ''].slice(0, 3)
      } else {
        this.goodItems = ['', '', '']
        this.improveItems = ['', '', '']
      }
    },
    selectHistoryIteration(iterId) {
      store.currentIterationId = iterId
      this.selectedIterationId = iterId
      this.onIterationChange()
    },
    async saveRetrospect() {
      if (!this.selectedIterationId) { this.$message.warning('请先选择迭代'); return }
      const good = this.goodItems.filter(s => s.trim())
      const improve = this.improveItems.filter(s => s.trim())
      if (good.length === 0 && improve.length === 0) { this.$message.warning('请至少填写一项内容'); return }
      const res = await saveRetrospect({ iterationId: this.selectedIterationId, good, improve })
      if (res.code === 200) {
        this.$message.success('回顾已保存')
        this.retroMap[this.selectedIterationId] = res.data
      } else this.$message.error(res.msg)
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

.empty-hero { text-align: center; padding: 80px 20px; }
.hero-icon { width: 56px; height: 56px; color: var(--text-muted); margin: 0 auto 16px; display: block; }
.empty-hero h3 { font-size: 17px; color: var(--text-secondary); font-weight: 600; }
.empty-hero p { font-size: 13px; color: var(--text-muted); margin-top: 6px; }

/* 双列布局 */
.retro-layout { display: flex; gap: 20px; }
.retro-panel {
  flex: 1; min-width: 0;
  background: #fff; border-radius: var(--radius); border: 1px solid var(--border);
  box-shadow: var(--shadow); display: flex; flex-direction: column;
}
.panel-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; border-bottom: 1px solid var(--border);
}
.panel-label { font-weight: 600; font-size: 15px; color: var(--text-primary); }
.panel-iter { font-size: 12px; color: var(--primary); background: #eef2ff; padding: 2px 10px; border-radius: 20px; font-weight: 600; }
.panel-body { padding: 20px; flex: 1; overflow-y: auto; max-height: calc(100vh - 260px); }

/* 编写区域 */
.section { margin-bottom: 24px; }
.section-head { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
.section-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; }
.section-title { font-weight: 600; font-size: 14px; color: var(--text-primary); }
.input-group { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.input-num {
  width: 26px; height: 26px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; flex-shrink: 0;
}
.good-num { background: #d1fae5; color: #065f46; }
.improve-num { background: #fef3c7; color: #92400e; }
.retro-input {
  flex: 1; padding: 10px 14px; border: 1px solid var(--border);
  border-radius: var(--radius-sm); font-size: 13px; color: var(--text-primary);
  background: #f8fafc; transition: all var(--transition);
  outline: none; font-family: inherit;
}
.retro-input:focus { border-color: var(--primary); background: #fff; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
.retro-input::placeholder { color: var(--text-muted); }

.btn-save {
  display: inline-flex; align-items: center; gap: 8px; width: 100%;
  padding: 12px 20px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: #fff; border: none; border-radius: var(--radius-sm);
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: all var(--transition); box-shadow: 0 2px 8px rgba(99,102,241,.25);
  justify-content: center;
}
.btn-save:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(99,102,241,.35); }
.btn-save svg { width: 17px; height: 17px; }

/* 历史回顾 */
.history-item {
  padding: 14px 16px; margin-bottom: 10px;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: #fafbfc; cursor: pointer;
  transition: all var(--transition);
}
.history-item:hover { border-color: var(--primary); box-shadow: 0 2px 8px rgba(99,102,241,.08); }
.history-item.active { border-color: var(--primary); background: #f5f3ff; }
.history-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.history-name { font-weight: 600; font-size: 14px; color: var(--text-primary); }
.history-date { font-size: 11px; color: var(--text-muted); }
.history-content { margin-top: 8px; }
.history-section { margin-bottom: 8px; }
.history-label { display: inline-block; font-size: 11px; font-weight: 600; margin-bottom: 4px; padding: 1px 8px; border-radius: 4px; }
.good-label { background: #d1fae5; color: #065f46; }
.improve-label { background: #fef3c7; color: #92400e; }
.history-list { padding-left: 16px; margin: 4px 0 0; }
.history-list li { font-size: 13px; color: var(--text-secondary); padding: 2px 0; }
.no-review { font-size: 12px; color: var(--text-muted); padding: 6px 0; }
.empty-small { text-align: center; color: var(--text-muted); font-size: 13px; padding: 30px 0; }
</style>
