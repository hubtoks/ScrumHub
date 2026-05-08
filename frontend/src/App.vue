<template>
  <div class="app-shell">
    <!-- 左侧导航栏 -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
        </div>
        <div class="brand-text">
          <span class="brand-title">Scrum</span>
          <span class="brand-sub">过程管理平台</span>
        </div>
      </div>

      <nav class="nav-list">
        <router-link to="/stories" class="nav-item" exact-active-class="active">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </span>
          <span class="nav-label">用户故事管理</span>
        </router-link>

        <router-link to="/backlog" class="nav-item" active-class="active">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </span>
          <span class="nav-label">产品待办列表</span>
        </router-link>

        <router-link to="/planning" class="nav-item" active-class="active">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </span>
          <span class="nav-label">迭代计划</span>
        </router-link>

        <router-link to="/board" class="nav-item" active-class="active">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
          </span>
          <span class="nav-label">迭代开发看板</span>
        </router-link>

        <router-link to="/retrospect" class="nav-item" active-class="active">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
          </span>
          <span class="nav-label">迭代回顾</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="footer-info">
          <span class="footer-dot"></span>
          <span>API :4000</span>
        </div>
      </div>
    </aside>

    <!-- 右侧内容区 -->
    <main class="main-area">
      <div class="content-wrapper">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script>
export default { name: 'App' }
</script>

<style>
/* ================================================================
   全局重置 + 设计变量
   ================================================================ */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --sidebar-w: 240px;
  --primary: #6366f1;
  --primary-light: #818cf8;
  --primary-dark: #4f46e5;
  --accent: #f59e0b;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --bg-page: #f1f5f9;
  --bg-card: #ffffff;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --border: #e2e8f0;
  --shadow-sm: 0 1px 2px rgba(0,0,0,.04);
  --shadow: 0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04);
  --shadow-md: 0 4px 6px rgba(0,0,0,.04), 0 2px 4px rgba(0,0,0,.04);
  --shadow-lg: 0 10px 25px rgba(0,0,0,.06), 0 4px 10px rgba(0,0,0,.04);
  --radius: 10px;
  --radius-sm: 6px;
  --radius-lg: 14px;
  --transition: 0.2s cubic-bezier(.4,0,.2,1);
}
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  background: var(--bg-page);
  color: var(--text-primary);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
/* 全局美化滚动条 */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

/* ================================================================
   壳体布局
   ================================================================ */
.app-shell { display: flex; min-height: 100vh; }

/* ================================================================
   左侧边栏
   ================================================================ */
.sidebar {
  width: var(--sidebar-w);
  background: linear-gradient(180deg, #1e1b4b 0%, #312e81 40%, #1e1b4b 100%);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0; left: 0; bottom: 0;
  z-index: 100;
  overflow-y: auto;
  box-shadow: 4px 0 24px rgba(30,27,75,.25);
}
.sidebar-brand {
  padding: 28px 24px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255,255,255,.08);
}
.brand-icon {
  width: 40px; height: 40px;
  background: linear-gradient(135deg, var(--primary-light), var(--accent));
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.brand-icon svg { width: 22px; height: 22px; }
.brand-text { display: flex; flex-direction: column; }
.brand-title {
  font-size: 18px; font-weight: 700;
  color: #fff; letter-spacing: 0.5px;
}
.brand-sub {
  font-size: 10px; color: rgba(255,255,255,.5);
  letter-spacing: 1.5px; text-transform: uppercase;
}

/* 导航列表 */
.nav-list {
  flex: 1; padding: 16px 12px;
  display: flex; flex-direction: column; gap: 2px;
}
.nav-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  color: rgba(255,255,255,.55);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all var(--transition);
  position: relative;
}
.nav-item:hover {
  background: rgba(255,255,255,.08);
  color: rgba(255,255,255,.85);
}
.nav-item.active {
  background: rgba(99,102,241,.25);
  color: #fff;
  box-shadow: 0 2px 8px rgba(99,102,241,.15);
}
.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0; top: 50%; transform: translateY(-50%);
  width: 3px; height: 20px;
  background: var(--primary-light);
  border-radius: 0 3px 3px 0;
}
.nav-icon { width: 20px; height: 20px; flex-shrink: 0; }
.nav-icon svg { width: 100%; height: 100%; }

/* 侧边栏底部 */
.sidebar-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(255,255,255,.08);
}
.footer-info {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; color: rgba(255,255,255,.35);
}
.footer-dot {
  width: 7px; height: 7px;
  background: var(--success);
  border-radius: 50%;
  box-shadow: 0 0 6px var(--success);
}

/* ================================================================
   右侧主区域
   ================================================================ */
.main-area {
  margin-left: var(--sidebar-w);
  flex: 1;
  min-height: 100vh;
  background: var(--bg-page);
}
.content-wrapper {
  padding: 28px 32px;
  max-width: 1400px;
}

/* ================================================================
   全局覆盖 ElementUI 样式
   ================================================================ */
.el-card {
  border-radius: var(--radius) !important;
  border: 1px solid var(--border) !important;
  box-shadow: var(--shadow) !important;
  transition: box-shadow var(--transition);
}
.el-card:hover { box-shadow: var(--shadow-md) !important; }
.el-card__header {
  padding: 18px 24px !important;
  border-bottom: 1px solid var(--border) !important;
  font-weight: 600;
  font-size: 15px;
  color: var(--text-primary);
}
.el-card__body { padding: 24px !important; }

.el-button--primary {
  background: var(--primary) !important;
  border-color: var(--primary) !important;
  border-radius: var(--radius-sm) !important;
  font-weight: 500 !important;
  transition: all var(--transition) !important;
}
.el-button--primary:hover {
  background: var(--primary-dark) !important;
  box-shadow: 0 4px 12px rgba(99,102,241,.3) !important;
}
.el-button {
  border-radius: var(--radius-sm) !important;
  font-weight: 500 !important;
  transition: all var(--transition) !important;
}

.el-table {
  border-radius: var(--radius) !important;
  overflow: hidden;
  border: 1px solid var(--border) !important;
}
.el-table th.el-table__cell {
  background: #f8fafc !important;
  color: var(--text-secondary) !important;
  font-weight: 600 !important;
  font-size: 12px !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid var(--border) !important;
}

.el-tag {
  border-radius: 20px !important;
  font-weight: 500 !important;
  padding: 0 10px !important;
}

.el-select .el-input__wrapper {
  border-radius: var(--radius-sm) !important;
}

.el-dialog {
  border-radius: var(--radius-lg) !important;
  box-shadow: var(--shadow-lg) !important;
}
.el-dialog__header {
  padding: 24px 28px 16px !important;
  border-bottom: 1px solid var(--border);
  margin-right: 0 !important;
}
.el-dialog__title { font-weight: 700 !important; font-size: 16px !important; }

.el-message {
  border-radius: var(--radius-sm) !important;
  box-shadow: var(--shadow-md) !important;
}

.el-radio-button__inner {
  border-radius: var(--radius-sm) !important;
}
</style>
