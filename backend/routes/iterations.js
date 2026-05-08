const express = require('express')
const router = express.Router()
const { query, transaction, generateId, now } = require('../db')

// ==================== GET /iterations - 按项目筛选 ====================
router.get('/', async (req, res) => {
  try {
    const { projectId } = req.query
    let sql = 'SELECT * FROM iterations WHERE 1=1'
    const params = []
    if (projectId) {
      sql += ' AND project_id = ?'
      params.push(projectId)
    }
    sql += ' ORDER BY create_time DESC'
    const iterations = await query(sql, params)
    res.json({ code: 200, data: iterations, msg: '查询成功' })
  } catch (e) {
    res.json({ code: 500, data: null, msg: e.message })
  }
})

// ==================== POST /iterations - 创建迭代 ====================
router.post('/', async (req, res) => {
  try {
    const { name, startDate, endDate, projectId } = req.body

    if (!name || !startDate || !endDate) {
      return res.json({ code: 400, data: null, msg: '请填写完整信息' })
    }
    if (!projectId) {
      return res.json({ code: 400, data: null, msg: '请选择项目' })
    }

    const newId = generateId()
    const createTime = now()

    await query(
      'INSERT INTO iterations (id, name, start_date, end_date, project_id, create_time) VALUES (?, ?, ?, ?, ?, ?)',
      [newId, name, startDate, endDate, projectId, createTime]
    )

    const [newIteration] = await query('SELECT * FROM iterations WHERE id = ?', [newId])
    res.json({ code: 200, data: newIteration, msg: '创建成功' })
  } catch (e) {
    res.json({ code: 500, data: null, msg: e.message })
  }
})

// ==================== DELETE /iterations/:id ====================
router.delete('/:id', async (req, res) => {
  try {
    const iterationId = req.params.id

    const [existing] = await query('SELECT * FROM iterations WHERE id = ?', [iterationId])
    if (!existing) {
      return res.json({ code: 404, data: null, msg: '迭代不存在' })
    }

    await transaction(async (conn) => {
      await conn.execute(
        'UPDATE user_stories SET iteration_id = NULL, status = ? WHERE iteration_id = ?',
        ['todo', iterationId]
      )
      await conn.execute('DELETE FROM retrospects WHERE iteration_id = ?', [iterationId])
      await conn.execute('DELETE FROM iterations WHERE id = ?', [iterationId])
    })

    res.json({ code: 200, data: null, msg: '删除成功，已同步清理关联数据' })
  } catch (e) {
    res.json({ code: 500, data: null, msg: e.message })
  }
})

module.exports = router
