<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h2 class="page-title">项目管理</h2>
        <p class="page-desc">管理所有项目，创建、编辑和删除项目</p>
      </div>
      <button class="btn-primary" @click="openCreateDialog">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        创建项目
      </button>
    </div>

    <div class="card" v-if="projects.length === 0">
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="empty-icon">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <p>暂无项目，请创建一个</p>
      </div>
    </div>

    <div class="card" v-else>
      <el-table :data="projects" stripe row-key="id">
        <el-table-column prop="name" label="项目名称" min-width="180">
          <template #default="scope">
            <span class="project-name">{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="300" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column label="操作" width="100" align="center">
          <template #default="scope">
            <button class="btn-ghost danger" @click="handleDelete(scope.row)">删除</button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" title="创建项目" width="480px">
      <el-form :model="form" label-position="top">
        <el-form-item label="项目名称">
          <el-input v-model="form.name" placeholder="输入项目名称，如：电商平台" />
        </el-form-item>
        <el-form-item label="项目描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="项目描述信息（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { getProjects, createProject, deleteProject } from '../api'
import { store } from '../store'

export default {
  name: 'ProjectManagement',
  data() {
    return { projects: [], dialogVisible: false, form: { name: '', description: '' } }
  },
  async mounted() { await this.loadProjects() },
  methods: {
    async loadProjects() {
      const res = await getProjects()
      if (res.code === 200) {
        store.projects = res.data
        this.projects = res.data
        store.validateProjectId()
      }
    },
    openCreateDialog() { this.form = { name: '', description: '' }; this.dialogVisible = true },
    async handleCreate() {
      const { name, description } = this.form
      if (!name.trim()) { this.$message.warning('请输入项目名称'); return }
      const res = await createProject({ name, description })
      if (res.code === 200) {
        this.$message.success('项目已创建')
        this.dialogVisible = false
        store.currentProjectId = res.data.id
        await this.loadProjects()
      } else this.$message.error(res.msg)
    },
    async handleDelete(row) {
      try {
        await this.$confirm(`删除「${row.name}」将同时删除其下所有故事和迭代，确定？`, '确认删除', { type: 'warning' })
        const res = await deleteProject(row.id)
        if (res.code === 200) {
          this.$message.success('已删除')
          if (store.currentProjectId === row.id) store.currentProjectId = null
          await this.loadProjects()
        } else this.$message.error(res.msg)
      } catch (_) {}
    }
  }
}
</script>

<style scoped>
.page { animation: fadeIn .35s ease; }
@keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
.page-head { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px }
.page-title { font-size:22px; font-weight:700; color:var(--text-primary); letter-spacing:-0.3px }
.page-desc { font-size:13px; color:var(--text-muted); margin-top:4px }
.btn-primary {
  display:inline-flex; align-items:center; gap:7px; padding:10px 20px;
  background:var(--primary); color:#fff; border:none; border-radius:var(--radius-sm);
  font-size:14px; font-weight:600; cursor:pointer; transition:all var(--transition);
  box-shadow:0 2px 8px rgba(99,102,241,.25)
}
.btn-primary:hover { background:var(--primary-dark); transform:translateY(-1px); box-shadow:0 4px 14px rgba(99,102,241,.35) }
.btn-primary svg { width:16px; height:16px }
.btn-ghost {
  padding:5px 12px; border:1px solid var(--border); background:#fff;
  color:var(--text-secondary); border-radius:var(--radius-sm); font-size:13px; cursor:pointer; transition:all var(--transition)
}
.btn-ghost.danger:hover { border-color:var(--danger); color:var(--danger); background:#fef2f2 }
.card { background:#fff; border-radius:var(--radius); border:1px solid var(--border); box-shadow:var(--shadow) }
.project-name { font-weight:600; color:var(--text-primary) }
.empty-state { text-align:center; padding:60px 20px }
.empty-icon { width:48px; height:48px; color:var(--text-muted); margin:0 auto 12px; display:block }
.empty-state p { color:var(--text-muted); font-size:14px }
</style>
