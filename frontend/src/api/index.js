const BASE_URL = 'http://localhost:4000'

async function request(url, options = {}) {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  return res.json()
}

// ==================== 用户故事 ====================
export function getStories(params = {}) {
  const query = new URLSearchParams(params).toString()
  return request(`/userStories${query ? '?' + query : ''}`)
}
export function saveStory(data) {
  return request('/userStories', { method: 'POST', body: JSON.stringify(data) })
}
export function deleteStory(id) {
  return request(`/userStories/${id}`, { method: 'DELETE' })
}
export function updatePriority(priorityList) {
  return request('/userStories/priority', { method: 'POST', body: JSON.stringify({ stories: priorityList }) })
}

// ==================== 迭代 ====================
export function getIterations(params = {}) {
  const query = new URLSearchParams(params).toString()
  return request(`/iterations${query ? '?' + query : ''}`)
}
export function createIteration(data) {
  return request('/iterations', { method: 'POST', body: JSON.stringify(data) })
}
export function deleteIteration(id) {
  return request(`/iterations/${id}`, { method: 'DELETE' })
}

// ==================== 迭代回顾 ====================
export function getRetrospect(iterationId) {
  return request(`/retrospects/${iterationId}`)
}
export function saveRetrospect(data) {
  return request('/retrospects', { method: 'POST', body: JSON.stringify(data) })
}

// ==================== 统计 ====================
export function getDashboard(iterationId) {
  return request(`/dashboard/iteration/${iterationId}`)
}

// ==================== 项目管理 ====================
export function getProjects() {
  return request('/projects')
}
export function createProject(data) {
  return request('/projects', { method: 'POST', body: JSON.stringify(data) })
}
export function deleteProject(id) {
  return request(`/projects/${id}`, { method: 'DELETE' })
}
