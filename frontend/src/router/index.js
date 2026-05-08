import { createRouter, createWebHistory } from 'vue-router'

import StoryManagement from '../views/StoryManagement.vue'
import BacklogManagement from '../views/BacklogManagement.vue'
import IterationPlan from '../views/IterationPlan.vue'
import BoardManagement from '../views/BoardManagement.vue'
import RetrospectManagement from '../views/RetrospectManagement.vue'

const routes = [
  { path: '/', redirect: '/stories' },
  { path: '/stories', component: StoryManagement, name: 'Stories' },
  { path: '/backlog', component: BacklogManagement, name: 'Backlog' },
  { path: '/planning', component: IterationPlan, name: 'Planning' },
  { path: '/board', component: BoardManagement, name: 'Board' },
  { path: '/retrospect', component: RetrospectManagement, name: 'Retrospect' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
