const express = require('express')
const router = express.Router()
const { query } = require('../db')

// ==================== GET /dashboard/iteration/:iterationId - 迭代统计和燃尽图数据 ====================
router.get('/iteration/:iterationId', async (req, res) => {
  try {
    const iterationId = req.params.iterationId

    // 查询迭代信息
    const [iteration] = await query('SELECT * FROM iterations WHERE id = ?', [iterationId])
    if (!iteration) {
      return res.json({ code: 404, data: null, msg: '迭代不存在' })
    }

    // 查询属于当前迭代的所有故事
    const iterationStories = await query(
      'SELECT * FROM user_stories WHERE iteration_id = ?',
      [iterationId]
    )

    // ========== 迭代统计 ==========
    const totalPoints = iterationStories.reduce((sum, s) => sum + Number(s.points), 0)

    const statusStats = {
      todo: 0,
      doing: 0,
      done: 0
    }

    iterationStories.forEach(s => {
      if (s.status === 'todo') statusStats.todo += Number(s.points)
      else if (s.status === 'doing') statusStats.doing += Number(s.points)
      else if (s.status === 'done') statusStats.done += Number(s.points)
    })

    const statistics = {
      totalStories: iterationStories.length,
      totalPoints,
      completedPoints: statusStats.done,
      remainingPoints: totalPoints - statusStats.done,
      todoPoints: statusStats.todo,
      doingPoints: statusStats.doing,
      donePoints: statusStats.done,
      completionRate: totalPoints > 0 ? Math.round((statusStats.done / totalPoints) * 100) : 0
    }

    // ========== 燃尽图数据 ==========
    const burndownData = calculateBurndown(iteration, iterationStories)

    res.json({
      code: 200,
      data: { iteration, statistics, burndownData },
      msg: '查询成功'
    })
  } catch (e) {
    res.json({ code: 500, data: null, msg: e.message })
  }
})

// ==================== 燃尽图计算逻辑 ====================
/*
 * 燃尽图由两条线组成：
 *
 * 1. 控制线（计划线）：理想情况下，总工作量在迭代期间线性递减。
 *    计算公式：每日剩余点数 = 总点数 - (总点数 / 总天数) × 已过天数
 *    起点：迭代开始日，剩余点数 = 总点数
 *    终点：迭代结束日，剩余点数 = 0
 *
 * 2. 趋势线（实际线）：反映实际完成情况。
 *    计算公式：每日剩余点数 = 总点数 - 当日已完成点数
 *    每天看板状态变更后，趋势线会自动反映最新剩余工作量
 */
function calculateBurndown(iteration, stories) {
  const startDate = new Date(iteration.startDate)
  const endDate = new Date(iteration.endDate)
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1

  const totalPoints = stories.reduce((sum, s) => sum + Number(s.points), 0)

  if (totalPoints === 0 || totalDays <= 1) {
    return { planned: [], actual: [], dates: [] }
  }

  const dates = []
  const planned = []
  const actual = []

  for (let i = 0; i < totalDays; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(currentDate.getDate() + i)

    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`
    dates.push(dateStr)

    // 控制线（计划）：总点数在总天数内线性递减到0
    const effectiveDays = totalDays - 1
    if (effectiveDays > 0) {
      const plannedRemaining = Math.max(0, totalPoints - (totalPoints / effectiveDays) * i)
      planned.push(Math.round(plannedRemaining * 100) / 100)
    } else {
      planned.push(totalPoints)
    }

    // 趋势线（实际）：总点数 - 已完成点数
    const completedPoints = stories.filter(s => s.status === 'done').reduce((sum, s) => sum + Number(s.points), 0)
    const actualRemaining = totalPoints - completedPoints
    actual.push(Math.max(0, Math.round(actualRemaining * 100) / 100))
  }

  return { planned, actual, dates }
}

module.exports = router
