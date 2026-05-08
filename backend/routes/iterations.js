const express = require('express')
const router = express.Router()
const { query, transaction, generateId, now } = require('../db')

// ==================== GET /iterations - 获取所有迭代 ====================
router.get('/', async (req, res) => {
  try {
    const iterations = await query('SELECT * FROM iterations ORDER BY create_time DESC')
    res.json({ code: 200, data: iterations, msg: '查询成功' })
  } catch (e) {
    res.json({ code: 500, data: null, msg: e.message })
  }
})

// ==================== POST /iterations - 创建迭代 ====================
router.post('/', async (req, res) => {
  try {
    const { name, startDate, endDate } = req.body

    if (!name || !startDate || !endDate) {
      return res.json({ code: 400, data: null, msg: '请填写完整信息' })
    }

    const newId = generateId()
    const createTime = now()

    await query(
      'INSERT INTO iterations (id, name, start_date, end_date, create_time) VALUES (?, ?, ?, ?, ?)',
      [newId, name, startDate, endDate, createTime]
    )

    const [newIteration] = await query('SELECT * FROM iterations WHERE id = ?', [newId])
    res.json({ code: 200, data: newIteration, msg: '创建成功' })
  } catch (e) {
    res.json({ code: 500, data: null, msg: e.message })
  }
})

// ==================== DELETE /iterations/:id - 删除迭代 ====================
// 删除迭代时，在事务中同步处理关联数据：
// 1. 将关联的用户故事的 iteration_id 重置为 NULL，状态重置为 todo
// 2. 删除该迭代的回顾记录
// 3. 删除迭代本身
router.delete('/:id', async (req, res) => {
  try {
    const iterationId = req.params.id

    // 先检查迭代是否存在
    const [existing] = await query('SELECT * FROM iterations WHERE id = ?', [iterationId])
    if (!existing) {
      return res.json({ code: 404, data: null, msg: '迭代不存在' })
    }

    // 使用事务保证数据一致性
    await transaction(async (conn) => {
      // 同步处理：将关联用户故事的迭代归属清空，状态回到todo
      await conn.execute(
        'UPDATE user_stories SET iteration_id = NULL, status = ? WHERE iteration_id = ?',
        ['todo', iterationId]
      )

      // 同步处理：删除该迭代的回顾
      await conn.execute('DELETE FROM retrospects WHERE iteration_id = ?', [iterationId])

      // 删除迭代本身
      await conn.execute('DELETE FROM iterations WHERE id = ?', [iterationId])
    })

    res.json({ code: 200, data: null, msg: '删除成功，已同步清理关联数据' })
  } catch (e) {
    res.json({ code: 500, data: null, msg: e.message })
  }
})

module.exports = router
