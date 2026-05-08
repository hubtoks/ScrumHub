const mysql = require('mysql2/promise')

// ========== 数据库配置 ==========
const DB_CONFIG = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'Qq123456',
  database: 'scrum_db',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4'
}

let pool = null

// ========== snake_case → camelCase 转换 ==========
function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function camelCaseRow(row) {
  if (!row || typeof row !== 'object') return row
  const converted = {}
  for (const key of Object.keys(row)) {
    converted[toCamelCase(key)] = row[key]
  }
  return converted
}

// ========== 获取连接池 ==========
function getPool() {
  if (!pool) {
    pool = mysql.createPool(DB_CONFIG)
  }
  return pool
}

// ========== 执行查询的便捷方法（自动转换列名为 camelCase） ==========
async function query(sql, params = []) {
  const p = getPool()
  const [rows] = await p.execute(sql, params)
  if (!Array.isArray(rows)) return rows
  return rows.map(camelCaseRow)
}

// ========== 开启事务 ==========
async function transaction(callback) {
  const p = getPool()
  const conn = await p.getConnection()
  try {
    await conn.beginTransaction()
    const result = await callback(conn)
    await conn.commit()
    return result
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}

// ========== 自动建库 + 建表（启动时执行） ==========
async function initDatabase() {
  const initConn = await mysql.createConnection({
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password
  })

  await initConn.execute(
    `CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  )
  console.log(`[DB] 数据库 ${DB_CONFIG.database} 已就绪`)
  await initConn.end()

  // 项目表
  await query(`
    CREATE TABLE IF NOT EXISTS projects (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      create_time VARCHAR(20) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  // 用户故事表
  await query(`
    CREATE TABLE IF NOT EXISTS user_stories (
      id VARCHAR(50) PRIMARY KEY,
      title VARCHAR(500) NOT NULL DEFAULT '',
      description TEXT,
      points DECIMAL(4,1) NOT NULL DEFAULT 0.5,
      priority INT NOT NULL DEFAULT 0,
      status VARCHAR(20) NOT NULL DEFAULT 'todo',
      iteration_id VARCHAR(50) DEFAULT NULL,
      project_id VARCHAR(50) DEFAULT NULL,
      assignee VARCHAR(100) DEFAULT '',
      create_time VARCHAR(20) NOT NULL,
      INDEX idx_status (status),
      INDEX idx_iteration (iteration_id),
      INDEX idx_priority (priority),
      INDEX idx_project (project_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  // 迭代表
  await query(`
    CREATE TABLE IF NOT EXISTS iterations (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      start_date VARCHAR(10) NOT NULL,
      end_date VARCHAR(10) NOT NULL,
      project_id VARCHAR(50) DEFAULT NULL,
      create_time VARCHAR(20) NOT NULL,
      INDEX idx_project (project_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  // 回顾表
  await query(`
    CREATE TABLE IF NOT EXISTS retrospects (
      id VARCHAR(50) PRIMARY KEY,
      iteration_id VARCHAR(50) NOT NULL,
      good JSON,
      improve JSON,
      create_time VARCHAR(20) NOT NULL,
      INDEX idx_iteration (iteration_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  // 兼容旧表：ALTER 添加可能缺失的新列
  await addColumnIfNotExists('user_stories', 'project_id', 'VARCHAR(50) DEFAULT NULL')
  await addColumnIfNotExists('user_stories', 'assignee', "VARCHAR(100) DEFAULT ''")
  await addColumnIfNotExists('iterations', 'project_id', 'VARCHAR(50) DEFAULT NULL')

  // 如果没有默认项目，创建一个
  const projects = await query('SELECT COUNT(*) as cnt FROM projects')
  if (projects[0].cnt === 0) {
    const id = generateId()
    await query(
      'INSERT INTO projects (id, name, description, create_time) VALUES (?, ?, ?, ?)',
      [id, '默认项目', '系统自动创建的默认项目', now()]
    )
    // 将无 project_id 的历史数据挂到默认项目下
    await query('UPDATE user_stories SET project_id = ? WHERE project_id IS NULL', [id])
    await query('UPDATE iterations SET project_id = ? WHERE project_id IS NULL', [id])
    console.log('[DB] 已创建默认项目并关联历史数据')
  }

  console.log('[DB] 数据表已就绪（projects, user_stories, iterations, retrospects）')
}

// ALTER 安全添加列（忽略已存在的列）
async function addColumnIfNotExists(table, column, definition) {
  try {
    await query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
    console.log(`[DB] ALTER ${table} 添加列 ${column}`)
  } catch (e) {
    if (e.code !== 'ER_DUP_FIELDNAME') throw e
  }
}

// 生成唯一ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

// 获取当前时间字符串
function now() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

module.exports = { query, transaction, initDatabase, generateId, now }
