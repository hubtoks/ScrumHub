import { reactive, watch } from 'vue'

function loadState() {
  try {
    return JSON.parse(localStorage.getItem('scrum_store') || '{}')
  } catch { return {} }
}

const saved = loadState()

export const store = reactive({
  currentProjectId: saved.currentProjectId || null,
  currentIterationId: saved.currentIterationId || null,
  backlogFilter: saved.backlogFilter || 'all',
  projects: saved.projects || [],
  iterations: saved.iterations || []
})

Object.defineProperty(store, 'currentProject', {
  get() {
    return this.projects.find(p => p.id === this.currentProjectId) || null
  }
})

Object.defineProperty(store, 'currentIteration', {
  get() {
    return this.iterations.find(i => i.id === this.currentIterationId) || null
  }
})

store.validateIterationId = function () {
  if (this.iterations.length === 0) {
    this.currentIterationId = null
  } else if (this.currentIterationId) {
    const exists = this.iterations.some(i => i.id === this.currentIterationId)
    if (!exists) this.currentIterationId = null
  }
}

store.validateProjectId = function () {
  if (this.currentProjectId && this.projects.length > 0) {
    const exists = this.projects.some(p => p.id === this.currentProjectId)
    if (!exists) this.currentProjectId = null
  }
}

watch(
  () => ({
    currentProjectId: store.currentProjectId,
    currentIterationId: store.currentIterationId,
    backlogFilter: store.backlogFilter,
    projects: store.projects,
    iterations: store.iterations
  }),
  (val) => {
    localStorage.setItem('scrum_store', JSON.stringify(val))
  },
  { deep: true }
)
