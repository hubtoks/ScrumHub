const express = require('express')
const router = express.Router()
const { query, generateId, now } = require('../db')

// ==================== GET /retrospects/:iterationId - 获取指定迭代的回顾 ====================
router.get('/:iterationId', async (req, res) => {
  try {
    const [retrospect] = await query(
      'SELECT * FROM retrospects WHERE iteration_id = ?',
      [req.params.iterationId]
    )
    res.json({ code: 200, data: retrospect || null, msg: '查询成功' })
  } catch (e) {
    res.json({ code: 500, data: null, msg: e.message })
  }
})

// ==================== POST /retrospects - 创建/编辑回顾 ====================
// 每个迭代只能有一条回顾记录，已存在则更新
router.post('/', async (req, res) => {
  try {
    const { iterationId, good, improve } = req.body

    if (!iterationId) {
      return res.json({ code: 400, data: null, msg: '缺少迭代ID' })
    }

    // good和improve各限制3条
    const trimmedGood = (good || []).slice(0, 3)
    const trimmedImprove = (improve || []).slice(0, 3)

    // 查找是否已存在该迭代的回顾
    const [existing] = await query(
      'SELECT * FROM retrospects WHERE iteration_id = ?',
      [iterationId]
    )

    if (existing) {
      // 编辑模式：更新已有回顾
      await query(
        'UPDATE retrospects SET good = ?, improve = ? WHERE iteration_id = ?',
        [JSON.stringify(trimmedGood), JSON.stringify(trimmedImprove), iterationId]
      )
      const [updated] = await query(
        'SELECT * FROM retrospects WHERE iteration_id = ?',
        [iterationId]
      )
      res.json({ code: 200, data: updated, msg: '更新成功' })
    } else {
      // 新增模式：创建新回顾
      const newId = generateId()
      await query(
        `INSERT INTO retrospects (id, iteration_id, good, improve, create_time)
         VALUES (?, ?, ?, ?, ?)`,
        [newId, iterationId, JSON.stringify(trimmedGood), JSON.stringify(trimmedImprove), now()]
      )
      const [newRetro] = await query('SELECT * FROM retrospects WHERE id = ?', [newId])
      res.json({ code: 200, data: newRetro, msg: '创建成功' })
    }
  } catch (e) {
    res.json({ code: 500, data: null, msg: e.message })
  }
})

module.exports = router
