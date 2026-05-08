const mysql = require('mysql2/promise')

const DB_CONFIG = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'Qq123456',
  database: 'scrum_db'
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

function now() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const testStories = [
  {
    title: '用户注册与登录',
    description: '作为新用户，我想要注册账号并登录系统，以便使用产品的全部功能。支持邮箱注册和第三方OAuth登录。',
    points: 5,
    status: 'done'
  },
  {
    title: '密码重置功能',
    description: '作为忘记密码的用户，我想要通过邮箱重置密码，以便重新登录系统。',
    points: 3,
    status: 'done'
  },
  {
    title: '个人资料编辑',
    description: '作为已登录用户，我想要编辑个人资料（头像、昵称、简介），以便完善个人信息。',
    points: 2,
    status: 'doing'
  },
  {
    title: '权限管理系统',
    description: '作为系统管理员，我想要设置不同角色的权限，以便控制用户对功能的访问。包括角色创建、权限分配、权限校验。',
    points: 8,
    status: 'doing'
  },
  {
    title: '操作日志记录',
    description: '作为系统管理员，我想要查看用户的操作日志，以便追踪关键操作和排查问题。',
    points: 3,
    status: 'todo'
  },
  {
    title: '消息通知中心',
    description: '作为用户，我想要在系统内收到消息通知（站内信），以便及时了解系统动态和任务变更。',
    points: 5,
    status: 'todo'
  },
  {
    title: '邮件通知服务',
    description: '作为用户，我想要在关键事件发生时收到邮件通知，以便不会错过重要信息。支持模板配置和发送队列。',
    points: 5,
    status: 'todo'
  },
  {
    title: '数据导出功能（Excel/PDF）',
    description: '作为用户，我想要将列表数据导出为Excel或PDF文件，以便进行离线分析和报告。',
    points: 3,
    status: 'todo'
  },
  {
    title: '全文搜索功能',
    description: '作为用户，我想要通过关键词搜索所有内容，以便快速找到所需信息。支持高亮显示和搜索历史。',
    points: 8,
    status: 'todo'
  },
  {
    title: '移动端适配',
    description: '作为移动端用户，我想要在手机上正常使用系统，以便随时随地进行操作。采用响应式设计适配主流手机屏幕。',
    points: 8,
    status: 'todo'
  },
  {
    title: '暗黑模式切换',
    description: '作为用户，我想要切换暗黑/明亮主题，以便在不同光线环境下舒适使用产品。',
    points: 2,
    status: 'todo'
  },
  {
    title: '多语言国际化（中英文）',
    description: '作为跨国团队用户，我想要切换系统语言，以便使用自己熟悉的语言操作。首期支持中文和英文。',
    points: 5,
    status: 'todo'
  },
  {
    title: '仪表盘数据可视化',
    description: '作为管理员，我想要在仪表盘看到可视化的图表（饼图、柱状图、趋势线），以便直观了解项目状态。',
    points: 5,
    status: 'todo'
  },
  {
    title: '文件上传与管理',
    description: '作为用户，我想要上传附件到故事卡片中，以便补充设计稿、文档等相关资料。支持图片、PDF、Office文件。',
    points: 3,
    status: 'todo'
  },
  {
    title: '自动备份与恢复',
    description: '作为系统管理员，我想要配置数据的自动备份策略，以便在故障时能够快速恢复数据。',
    points: 2,
    status: 'todo'
  }
]

async function seed() {
  const pool = mysql.createPool(DB_CONFIG)

  try {
    const [rows] = await pool.execute('SELECT COUNT(*) as cnt FROM user_stories')
    const existingCount = rows[0].cnt
    console.log(`当前数据库中有 ${existingCount} 条用户故事\n`)

    let insertedCount = 0
    for (let i = 0; i < testStories.length; i++) {
      const story = testStories[i]
      const id = generateId()
      const priority = i + 1
      const createTime = now()

      await pool.execute(
        `INSERT INTO user_stories (id, title, description, points, priority, status, iteration_id, create_time)
         VALUES (?, ?, ?, ?, ?, ?, NULL, ?)`,
        [id, story.title, story.description, story.points, priority, story.status, createTime]
      )
      insertedCount++
      console.log(`✓ 已插入: [${story.status}] ${story.title} (${story.points}点)`)
    }

    console.log(`\n✅ 完成！共插入 ${insertedCount} 条测试用户故事`)
  } catch (err) {
    console.error('❌ 插入失败:', err.message)
  } finally {
    await pool.end()
    process.exit(0)
  }
}

seed()
