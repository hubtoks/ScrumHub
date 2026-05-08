const express = require('express')
const router = express.Router()
const { query, generateId, now } = require('../db')

// 合法的故事点离散值
const VALID_POINTS = [0.5, 1, 2, 3, 5, 8, 20, 40]

// ==================== GET /userStories - 获取用户故事列表 ====================
// 支持 status 和 iterationId 筛选参数
router.get('/', async (req, res) => {
  try {
    const { status, iterationId } = req.query

    let sql = 'SELECT * FROM user_stories WHERE 1=1'
    const params = []

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

// ==================== POST /userStories - 新增/编辑用户故事 ====================
router.post('/', async (req, res) => {
  try {
    const { id, title, description, points, priority, status, iterationId } = req.body

    // 校验故事点必须是合法的离散值
    if (points !== undefined && !VALID_POINTS.includes(Number(points))) {
      return res.json({ code: 400, data: null, msg: `故事点只能为：${VALID_POINTS.join('、')}` })
    }

    if (id) {
      // 编辑模式：根据ID查找并更新已有故事
      const existing = await query('SELECT * FROM user_stories WHERE id = ?', [id])
      if (existing.length === 0) {
        return res.json({ code: 404, data: null, msg: '用户故事不存在' })
      }

      // 只更新传入的字段
      const fields = []
      const values = []
      if (title !== undefined) { fields.push('title = ?'); values.push(title) }
      if (description !== undefined) { fields.push('description = ?'); values.push(description) }
      if (points !== undefined) { fields.push('points = ?'); values.push(points) }
      if (priority !== undefined) { fields.push('priority = ?'); values.push(priority) }
      if (status !== undefined) { fields.push('status = ?'); values.push(status) }
      if (iterationId !== undefined) { fields.push('iteration_id = ?'); values.push(iterationId) }

      if (fields.length > 0) {
        const sql = `UPDATE user_stories SET ${fields.join(', ')} WHERE id = ?`
        await query(sql, [...values, id])
      }

      const [updated] = await query('SELECT * FROM user_stories WHERE id = ?', [id])
      res.json({ code: 200, data: updated, msg: '更新成功' })
    } else {
      // 新增模式：创建新的用户故事
      const newId = generateId()
      const allStories = await query('SELECT MAX(priority) as maxP FROM user_stories')
      const maxPriority = allStories[0].maxP || 0

      await query(
        `INSERT INTO user_stories (id, title, description, points, priority, status, iteration_id, create_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId,
          title || '',
          description || '',
          points || 0.5,
          priority || (maxPriority + 1),
          status || 'todo',
          iterationId || null,
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

// ==================== DELETE /userStories/:id - 删除用户故事 ====================
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

// ==================== POST /userStories/priority - 拖拽更新优先级 ====================
// 请求体：{ stories: [{ id, priority }, ...] }
// 批量更新所有故事的优先级字段，使用事务保证原子性
router.post('/priority', async (req, res) => {
  try {
    const { stories: priorityList } = req.body

    if (!Array.isArray(priorityList)) {
      return res.json({ code: 400, data: null, msg: '参数格式错误' })
    }

    // 批量更新：在事务中逐条更新
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
