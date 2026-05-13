const express = require('express')
const router = express.Router()
const { query } = require('../db')

// ==================== GET /dashboard/iteration/:iterationId ====================
router.get('/iteration/:iterationId', async (req, res) => {
  try {
    const iterationId = req.params.iterationId

    const [iteration] = await query('SELECT * FROM iterations WHERE id = ?', [iterationId])
    if (!iteration) {
      return res.json({ code: 404, data: null, msg: '迭代不存在' })
    }

    const iterationStories = await query(
      'SELECT * FROM user_stories WHERE iteration_id = ?',
      [iterationId]
    )

    // ========== 迭代统计 ==========
    const totalPoints = iterationStories.reduce((sum, s) => sum + Number(s.points), 0)
    const statusStats = { todo: 0, doing: 0, done: 0 }

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

    // 查询本迭代所有状态变更历史（用于燃尽图）
    const history = await query(
      'SELECT * FROM story_history WHERE iteration_id = ? ORDER BY changed_at ASC',
      [iterationId]
    )

    // ========== 燃尽图数据 ==========
    const burndownData = calculateBurndown(iteration, iterationStories, history)

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
 * 1. 控制线（计划线）：理想情况下，总点数在迭代期间线性递减到 0。
 *    daily = totalPoints - (totalPoints / effectiveDays) * dayIndex
 *
 * 2. 趋势线（实际线）：基于 story_history 表还原每日实际剩余点数。
 *    对于每个日期 D：找出在 D 当天结束时处于"已完成"状态的故事，
 *    completed_at <= D 23:59:59 的故事视为已完成，
 *    总点数 - 累计已完成 = 当日剩余。
 *
 *    同时维护 doing 状态：取 history 中截至 D 的每条 story 最后一条记录，
 *    若 to_status = 'doing' 则故事处于进行中（但未完成），
 *    计入 doingPoints，但不影响 actual 剩余计算。
 */
function calculateBurndown(iteration, stories, history) {
  const startDate = new Date(iteration.startDate)
  const endDate = new Date(iteration.endDate)
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
  const totalPoints = stories.reduce((sum, s) => sum + Number(s.points), 0)

  if (totalPoints === 0 || totalDays <= 1) {
    return { planned: [], actual: [], dates: [] }
  }

  // 将 history 按故事ID分组，记录每次变更 (changed_at, to_status)
  const storyEvents = {}  // { storyId: [{ changedAt, toStatus, points }] }
  history.forEach(h => {
    if (!storyEvents[h.storyId]) storyEvents[h.storyId] = []
    storyEvents[h.storyId].push({
      changedAt: h.changedAt,
      toStatus: h.toStatus,
      points: Number(h.points)
    })
  })

  const dates = []
  const planned = []
  const actual = []

  const effectiveDays = totalDays - 1

  for (let i = 0; i < totalDays; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(currentDate.getDate() + i)
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`
    dates.push(dateStr)

    // 控制线（计划）
    if (effectiveDays > 0) {
      const pr = Math.max(0, totalPoints - (totalPoints / effectiveDays) * i)
      planned.push(Math.round(pr * 100) / 100)
    } else {
      planned.push(totalPoints)
    }

    // 趋势线（实际）：截至当日结束时已完成的故事点数
    const dayEnd = dateStr + ' 23:59:59'
    let completedOnOrBefore = 0

    stories.forEach(story => {
      const events = storyEvents[story.id] || []
      // 找 changedAt <= dayEnd 的最后一条记录
      let lastStatus = null
      for (const evt of events) {
        if (evt.changedAt <= dayEnd) {
          lastStatus = evt.toStatus
        }
      }
      // 如果故事在 dayEnd 时处于 done 状态，计入完成点数
      if (lastStatus === 'done') {
        completedOnOrBefore += Number(story.points)
      }
    })

    const actualRemaining = Math.max(0, totalPoints - completedOnOrBefore)
    actual.push(Math.round(actualRemaining * 100) / 100)
  }

  return { planned, actual, dates }
}

module.exports = router
