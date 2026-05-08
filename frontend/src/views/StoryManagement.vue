<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h2 class="page-title">用户故事管理</h2>
        <p class="page-desc">管理所有用户故事，创建、编辑和维护产品需求</p>
      </div>
      <button class="btn-primary" @click="openDialog()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        新增故事
      </button>
    </div>

    <!-- 统计小条 -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num">{{ stories.length }}</span>
        <span class="stat-label">全部故事</span>
      </div>
      <div class="stat-item accent">
        <span class="stat-num">{{ stories.filter(s=>s.status==='todo').length }}</span>
        <span class="stat-label">未开始</span>
      </div>
      <div class="stat-item warn">
        <span class="stat-num">{{ stories.filter(s=>s.status==='doing').length }}</span>
        <span class="stat-label">进行中</span>
      </div>
      <div class="stat-item success">
        <span class="stat-num">{{ stories.filter(s=>s.status==='done').length }}</span>
        <span class="stat-label">已完成</span>
      </div>
    </div>

    <!-- 故事表格 -->
    <div class="card">
      <el-table :data="stories" stripe row-key="id">
        <el-table-column prop="title" label="故事标题" min-width="160">
          <template #default="scope">
            <span class="story-title-link">{{ scope.row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="220" show-overflow-tooltip />
        <el-table-column prop="points" label="故事点" width="90" align="center">
          <template #default="scope">
            <span class="points-badge">{{ scope.row.points }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80" align="center">
          <template #default="scope">
            <span class="priority-num">{{ scope.row.priority }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="scope">
            <span class="status-dot" :class="scope.row.status" :title="statusLabel(scope.row.status)">
              {{ statusLabel(scope.row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="assignee" label="负责人" width="110" align="center">
          <template #default="scope">
            <span class="assignee-name" v-if="scope.row.assignee">{{ scope.row.assignee }}</span>
            <span class="assignee-empty" v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="165" />
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="scope">
            <button class="btn-ghost" @click="openDialog(scope.row)">编辑</button>
            <button class="btn-ghost danger" @click="handleDelete(scope.row)">删除</button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑故事' : '新增故事'" width="520px">
      <el-form :model="form" label-position="top">
        <el-form-item label="故事标题">
          <el-input v-model="form.title" placeholder="输入故事标题" />
        </el-form-item>
        <el-form-item label="故事描述">
          <el-input v-model="form.description" type="textarea" :rows="3"
            placeholder="作为… 我想要… 以便…" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="估算点数">
              <el-select v-model="form.points" placeholder="选择故事点">
                <el-option v-for="p in POINTS" :key="p" :label="p" :value="p" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人">
              <el-input v-model="form.assignee" placeholder="输入用户名" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { getStories, saveStory, deleteStory } from '../api'
import { store } from '../store'
const POINTS = [0.5, 1, 2, 3, 5, 8, 20, 40]

export default {
  name: 'StoryManagement',
  data() {
    return {
      POINTS, stories: [],
      dialogVisible: false, isEdit: false,
      form: { id: null, title: '', description: '', points: 1, status: 'todo', assignee: '' }
    }
  },
  computed: {
    projectId() { return store.currentProjectId }
  },
  watch: {
    projectId: { handler() { this.loadStories() }, immediate: true }
  },
  methods: {
    async loadStories() {
      const projectId = store.currentProjectId
      if (!projectId) { this.stories = []; return }
      const res = await getStories({ projectId })
      if (res.code === 200) this.stories = res.data
    },
    statusLabel(s) {
      return { todo:'未开始', doing:'进行中', done:'已完成' }[s] || s
    },
    openDialog(row = null) {
      this.isEdit = !!row
      this.form = row ? { ...row } : { id: null, title: '', description: '', points: 1, status: 'todo', assignee: '', projectId: store.currentProjectId }
      this.dialogVisible = true
    },
    async handleSave() {
      // 确保 projectId 始终使用当前选中项目
      const payload = { ...this.form, projectId: store.currentProjectId }
      const res = await saveStory(payload)
      if (res.code === 200) { this.$message.success(this.isEdit ? '已更新' : '已创建'); this.dialogVisible = false; this.loadStories() }
      else this.$message.error(res.msg)
    },
    async handleDelete(row) {
      try {
        // 已分配至迭代的故事，删除时需要特殊确认
        const confirmMsg = row.iterationId
          ? '该故事已分配至迭代，删除后将从迭代中移除，确认删除？'
          : '确定删除「' + row.title + '」？'
        await this.$confirm(confirmMsg, '确认删除', { type: 'warning' })
        const res = await deleteStory(row.id)
        if (res.code === 200) { this.$message.success('已删除'); this.loadStories() }
        else this.$message.error(res.msg)
      } catch (_) {}
    }
  }
}
</script>

<style scoped>
.page { animation: fadeIn .35s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

.page-head {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 24px;
}
.page-title { font-size: 22px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.3px; }
.page-desc { font-size: 13px; color: var(--text-muted); margin-top: 4px; }

.btn-primary {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 10px 20px;
  background: var(--primary); color: #fff;
  border: none; border-radius: var(--radius-sm);
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: all var(--transition);
  box-shadow: 0 2px 8px rgba(99,102,241,.25);
}
.btn-primary:hover { background: var(--primary-dark); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(99,102,241,.35); }
.btn-primary svg { width: 16px; height: 16px; }

.btn-ghost {
  padding: 5px 12px; border: 1px solid var(--border);
  background: #fff; color: var(--text-secondary);
  border-radius: var(--radius-sm); font-size: 13px; cursor: pointer;
  transition: all var(--transition);
  margin: 0 2px;
}
.btn-ghost:hover { border-color: var(--primary); color: var(--primary); background: #f5f3ff; }
.btn-ghost.danger:hover { border-color: var(--danger); color: var(--danger); background: #fef2f2; }

/* 统计条 */
.stats-row { display: flex; gap: 16px; margin-bottom: 20px; }
.stat-item {
  flex: 1; padding: 16px 20px; background: #fff;
  border-radius: var(--radius); border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
}
.stat-num { font-size: 26px; font-weight: 800; color: var(--text-primary); }
.stat-label { display: block; font-size: 12px; color: var(--text-muted); margin-top: 2px; letter-spacing: .3px; }
.stat-item.accent .stat-num { color: var(--primary); }
.stat-item.warn .stat-num { color: var(--warning); }
.stat-item.success .stat-num { color: var(--success); }

/* 卡片 */
.card {
  background: #fff; border-radius: var(--radius);
  border: 1px solid var(--border); box-shadow: var(--shadow);
}

/* 表格内自定义 */
.story-title-link { font-weight: 600; color: var(--text-primary); }
.points-badge {
  display: inline-flex; align-items: center; justify-content: center;
  width: 36px; height: 28px;
  background: #fef3c7; color: #92400e;
  border-radius: 6px; font-size: 13px; font-weight: 700;
}
.priority-num {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px;
  background: #f1f5f9; color: var(--text-secondary);
  border-radius: 50%; font-size: 13px; font-weight: 700;
}
.status-dot {
  display: inline-block; padding: 3px 10px; border-radius: 20px;
  font-size: 12px; font-weight: 600;
}
.status-dot.todo { background: #dbeafe; color: #1d4ed8; }
.status-dot.doing { background: #fef3c7; color: #92400e; }
.status-dot.done { background: #d1fae5; color: #065f46; }
.assignee-name { font-size: 13px; font-weight: 500; color: var(--text-primary); }
.assignee-empty { color: var(--text-muted); }
</style>
