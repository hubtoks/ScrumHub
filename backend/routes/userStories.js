const express = require('express')
const router = express.Router()
const { query, generateId, now } = require('../db')

const VALID_POINTS = [0.5, 1, 2, 3, 5, 8, 20, 40]

// ==================== GET /userStories ====================
// 支持 status、iterationId、projectId 筛选
router.get('/', async (req, res) => {
  try {
    const { status, iterationId, projectId } = req.query

    let sql = 'SELECT * FROM user_stories WHERE 1=1'
    const params = []

    if (projectId) {
      sql += ' AND project_id = ?'
      params.push(projectId)
    }

    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }

    if (iterationId !== undefined) {
      if (iterationId === 'null') {
        sql += ' AND iteration_id IS NULL'
      } else {
        sql += ' AND iteration_id = ?'
        params.push(iterationId)
      }
    }

    sql += ' ORDER BY priority ASC'

    const stories = await query(sql, params)
    res.json({ code: 200, data: stories, msg: '查询成功' })
  } catch (e) {
    res.json({ code: 500, data: null, msg: e.message })
  }
})

// ==================== POST /userStories - 新增/编辑 ====================
router.post('/', async (req, res) => {
  try {
    const { id, title, description, points, priority, status, iterationId, projectId, assignee } = req.body

    if (points !== undefined && !VALID_POINTS.includes(Number(points))) {
      return res.json({ code: 400, data: null, msg: `故事点只能为：${VALID_POINTS.join('、')}` })
    }

    if (!id && !projectId) {
      return res.json({ code: 400, data: null, msg: '请选择项目' })
    }

    if (id) {
      const existing = await query('SELECT * FROM user_stories WHERE id = ?', [id])
      if (existing.length === 0) {
        return res.json({ code: 404, data: null, msg: '用户故事不存在' })
      }
      const oldStory = existing[0]

      const fields = []
      const values = []
      if (title !== undefined) { fields.push('title = ?'); values.push(title) }
      if (description !== undefined) { fields.push('description = ?'); values.push(description) }
      if (points !== undefined) { fields.push('points = ?'); values.push(points) }
      if (priority !== undefined) { fields.push('priority = ?'); values.push(priority) }
      if (iterationId !== undefined) { fields.push('iteration_id = ?'); values.push(iterationId) }
      if (assignee !== undefined) { fields.push('assignee = ?'); values.push(assignee) }

      // 状态变更：记录 history + 维护 completed_at
      if (status !== undefined && status !== oldStory.status) {
        fields.push('status = ?'); values.push(status)

        const timeNow = now()
        // 变为 done：记录完成时间
        if (status === 'done') {
          fields.push('completed_at = ?'); values.push(timeNow)
        }
        // 从 done 退回：清空完成时间
        if (oldStory.status === 'done' && status !== 'done') {
          fields.push('completed_at = NULL'); values.push(null)
        }

        // 插入状态变更历史
        const historyId = generateId()
        const iterId = oldStory.iterationId || null
        await query(
          `INSERT INTO story_history (id, story_id, iteration_id, from_status, to_status, points, changed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [historyId, id, iterId, oldStory.status, status, oldStory.points, timeNow]
        )
      }

      if (fields.length > 0) {
        const sql2 = `UPDATE user_stories SET ${fields.join(', ')} WHERE id = ?`
        await query(sql2, [...values, id])
      }

      const [updated] = await query('SELECT * FROM user_stories WHERE id = ?', [id])
      res.json({ code: 200, data: updated, msg: '更新成功' })
    } else {
      const newId = generateId()
      const allStories = await query('SELECT MAX(priority) as maxP FROM user_stories WHERE project_id = ?', [projectId])
      const maxPriority = allStories[0].maxP || 0

      await query(
        `INSERT INTO user_stories (id, title, description, points, priority, status, iteration_id, project_id, assignee, create_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId, title || '', description || '',
          points || 0.5, priority || (maxPriority + 1),
          status || 'todo', iterationId || null,
          projectId, assignee || '',
          now()
        ]
      )

      const [newStory] = await query('SELECT * FROM user_stories WHERE id = ?', [newId])
      res.json({ code: 200, data: newStory, msg: '创建成功' })
    }
  } catch (e) {
    res.json({ code: 500, data: null, msg: e.message })
  }
})

// ==================== DELETE /userStories/:id ====================
router.delete('/:id', async (req, res) => {
  try {
    const [story] = await query('SELECT * FROM user_stories WHERE id = ?', [req.params.id])
    if (!story) {
      return res.json({ code: 404, data: null, msg: '用户故事不存在' })
    }
    await query('DELETE FROM user_stories WHERE id = ?', [req.params.id])
    res.json({ code: 200, data: story, msg: '删除成功' })
  } catch (e) {
    res.json({ code: 500, data: null, msg: e.message })
  }
})

// ==================== POST /userStories/priority ====================
router.post('/priority', async (req, res) => {
  try {
    const { stories: priorityList } = req.body
    if (!Array.isArray(priorityList)) {
      return res.json({ code: 400, data: null, msg: '参数格式错误' })
    }
    const { transaction } = require('../db')
    await transaction(async (conn) => {
      for (const item of priorityList) {
        await conn.execute('UPDATE user_stories SET priority = ? WHERE id = ?', [item.priority, item.id])
      }
    })
    res.json({ code: 200, data: null, msg: '优先级更新成功' })
  } catch (e) {
    res.json({ code: 500, data: null, msg: e.message })
  }
})

module.exports = router
