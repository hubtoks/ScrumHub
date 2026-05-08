const express = require('express')
const cors = require('cors')
const { initDatabase } = require('./db')

const app = express()
const PORT = 4000

// ==================== 中间件 ====================
app.use(cors())
app.use(express.json())

// ==================== 导入路由 ====================
const userStoriesRouter = require('./routes/userStories')
const iterationsRouter = require('./routes/iterations')
const retrospectsRouter = require('./routes/retrospects')
const dashboardRouter = require('./routes/dashboard')
const projectsRouter = require('./routes/projects')

app.use('/userStories', userStoriesRouter)
app.use('/iterations', iterationsRouter)
app.use('/retrospects', retrospectsRouter)
app.use('/dashboard', dashboardRouter)
app.use('/projects', projectsRouter)

// ==================== 启动：先建库建表，再启动服务 ====================
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Scrum后端服务已启动 → http://localhost:${PORT}`)
    })
  })
  .catch(err => {
    console.error('数据库初始化失败，请检查MySQL是否已启动：', err.message)
    process.exit(1)
  })
