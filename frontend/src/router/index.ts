import { createRouter, createWebHistory} from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { auth } from '@/api/auth.ts'; 
import UserList from '@/components/UserList.vue';
import UserCreateForm from '@/components/UserCreateForm.vue';
import UserEditForm from '@/components/UserEditForm.vue';
import TeamList from '@/components/TeamList.vue';
import TeamCreateForm from '@/components/TeamCreateForm.vue';
import TeamDetail from '@/components/TeamDetail.vue';
import TaskList from '@/components/TaskList.vue';
import TaskCreateForm from '@/components/TaskCreateForm.vue';
import Login from '@/components/LoginPage.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/users',
    name: 'UserList',
    component: UserList,
    meta: { requiresAuth: true },//これがついているページはログインが必要
  },
  {
    path: '/users/new',
    name: 'UserCreate',
    component: UserCreateForm,
  },
  {
    path: '/users/:id/edit',
    name: 'UserEdit',
    component: UserEditForm,
    props: true,
  },
  {
    path: '/teams',
    name: 'TeamList',
    component: TeamList,
    meta: { requiresAuth: true },
  },
   {
    path: '/teams/new',
    name: 'TeamCreate',
    component: TeamCreateForm,
    meta: { requiresAuth: true },
  },
  { 
    path: '/teams/:id', 
    name: 'TeamDetail',
    component: TeamDetail,
    props: true, 
    meta: { requiresAuth: true },
  },
  {
    path: '/tasks',
    name: 'TaskList',
    component: TaskList,
    meta: { requiresAuth: true },
  },
  {
    path: '/tasks/new',
    name: 'TaskCreate',
    component: TaskCreateForm,
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    console.log('認証が必要です。ログインページへリダイレクトします。');
    next('/login');
  } else if (to.path === '/login' && auth.isLoggedIn) {
    console.log('既にログイン済みです。チーム一覧へリダイレクトします。');
    next('/teams');
  } else {
    next();
  }
});

export default router;


