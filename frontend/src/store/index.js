import { reactive, watch } from 'vue'

function loadState() {
  try {
    return JSON.parse(localStorage.getItem('scrum_store') || '{}')
  } catch { return {} }
}

const saved = loadState()

// 全局共享响应式状态——解决页面切换后迭代选择丢失的问题
export const store = reactive({
  currentIterationId: saved.currentIterationId || null,
  backlogFilter: saved.backlogFilter || 'all',
  iterations: saved.iterations || []
})

// 计算属性：从缓存迭代列表中获取当前迭代
Object.defineProperty(store, 'currentIteration', {
  get() {
    return this.iterations.find(i => i.id === this.currentIterationId) || null
  }
})

// 切换数据库后，旧 localStorage 中的迭代 ID 可能失效，在此校验
store.validateIterationId = function () {
  if (this.currentIterationId && this.iterations.length > 0) {
    const exists = this.iterations.some(i => i.id === this.currentIterationId)
    if (!exists) {
      this.currentIterationId = null
    }
  }
}

// 监听 store 变更，自动保存到 localStorage
watch(
  () => ({
    currentIterationId: store.currentIterationId,
    backlogFilter: store.backlogFilter,
    iterations: store.iterations
  }),
  (val) => {
    localStorage.setItem('scrum_store', JSON.stringify(val))
  },
  { deep: true }
)
