const express = require('express')
const router = express.Router()
const { query, generateId, now } = require('../db')

// ==================== GET /projects - 获取所有项目 ====================
router.get('/', async (req, res) => {
  try {
    const projects = await query('SELECT * FROM projects ORDER BY create_time ASC')
    res.json({ code: 200, data: projects, msg: '查询成功' })
  } catch (e) {
    res.json({ code: 500, data: null, msg: e.message })
  }
})

// ==================== POST /projects - 创建项目 ====================
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body
    if (!name) {
      return res.json({ code: 400, data: null, msg: '项目名称不能为空' })
    }
    const newId = generateId()
    await query(
      'INSERT INTO projects (id, name, description, create_time) VALUES (?, ?, ?, ?)',
      [newId, name, description || '', now()]
    )
    const [project] = await query('SELECT * FROM projects WHERE id = ?', [newId])
    res.json({ code: 200, data: project, msg: '创建成功' })
  } catch (e) {
    res.json({ code: 500, data: null, msg: e.message })
  }
})

// ==================== DELETE /projects/:id - 删除项目 ====================
// 删除项目时清理关联数据
router.delete('/:id', async (req, res) => {
  try {
    const projectId = req.params.id
    const [project] = await query('SELECT * FROM projects WHERE id = ?', [projectId])
    if (!project) {
      return res.json({ code: 404, data: null, msg: '项目不存在' })
    }

    // 不允许删除最后一个项目
    const [cnt] = await query('SELECT COUNT(*) as total FROM projects')
    if (cnt.total <= 1) {
      return res.json({ code: 400, data: null, msg: '至少保留一个项目' })
    }

    const { transaction } = require('../db')
    await transaction(async (conn) => {
      // 删除项目下的用户故事
      await conn.execute('DELETE FROM user_stories WHERE project_id = ?', [projectId])
      // 删除项目下的迭代（及关联回顾），conn.execute 返回 [rows, fields]
      const [iterRows] = await conn.execute('SELECT id FROM iterations WHERE project_id = ?', [projectId])
      for (const iter of iterRows) {
        await conn.execute('DELETE FROM retrospects WHERE iteration_id = ?', [iter.id])
        await conn.execute('DELETE FROM story_history WHERE iteration_id = ?', [iter.id])
      }
      await conn.execute('DELETE FROM iterations WHERE project_id = ?', [projectId])
      // 删除项目自身
      await conn.execute('DELETE FROM projects WHERE id = ?', [projectId])
    })

    res.json({ code: 200, data: null, msg: '项目及关联数据已删除' })
  } catch (e) {
    res.json({ code: 500, data: null, msg: e.message })
  }
})

module.exports = router
