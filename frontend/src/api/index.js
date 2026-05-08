const BASE_URL = 'http://localhost:4000'

// 通用fetch封装，自动拼接baseURL，统一处理响应
async function request(url, options = {}) {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  return res.json()
}

// ==================== 用户故事相关API ====================

// 获取用户故事列表，支持status和iterationId筛选
export function getStories(params = {}) {
  const query = new URLSearchParams(params).toString()
  return request(`/userStories${query ? '?' + query : ''}`)
}

// 新增/编辑用户故事
export function saveStory(data) {
  return request('/userStories', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

// 删除用户故事
export function deleteStory(id) {
  return request(`/userStories/${id}`, { method: 'DELETE' })
}

// 批量更新优先级（拖拽排序后调用）
export function updatePriority(priorityList) {
  return request('/userStories/priority', {
    method: 'POST',
    body: JSON.stringify({ stories: priorityList })
  })
}

// ==================== 迭代相关API ====================

// 获取所有迭代
export function getIterations() {
  return request('/iterations')
}

// 创建迭代
export function createIteration(data) {
  return request('/iterations', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

// 删除迭代
export function deleteIteration(id) {
  return request(`/iterations/${id}`, { method: 'DELETE' })
}

// ==================== 迭代回顾相关API ====================

// 获取指定迭代的回顾
export function getRetrospect(iterationId) {
  return request(`/retrospects/${iterationId}`)
}

// 创建/编辑回顾
export function saveRetrospect(data) {
  return request('/retrospects', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

// ==================== 统计相关API ====================

// 获取迭代统计和燃尽图数据
export function getDashboard(iterationId) {
  return request(`/dashboard/iteration/${iterationId}`)
}
