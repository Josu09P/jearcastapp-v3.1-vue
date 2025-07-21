import { useUserStore } from '@/stores/user'
import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/presentation/pages/home/HomePage.vue'),
  },
  {
    path: '/auth',
    children: [
      {
        path: 'register',
        name: 'Register',
        component: () => import('@/presentation/pages/auth/RegisterPage.vue'),
      },
      {
        path: 'login',
        name: 'Login',
        component: () => import('@/presentation/pages/auth/LoginPage.vue'),
      },
      {
        path: 'forgot-password',
        name: 'ForgotPassword',
        component: () => import('@/presentation/pages/auth/ForgotPassword.vue'),
      },
    ],
  },
  {
    path: '/dashboard',
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/presentation/pages/dashboard/HomePage.vue'),
      },
      {
        path: 'favorites',
        name: 'Favoritos',
        component: () => import('@/presentation/pages/dashboard/FavoritesPage.vue'),
      },
      {
        path: 'play-list',
        name: 'PlayList',
        component: () => import('@/presentation/pages/dashboard/PlayListPage.vue'),
      },
      {
        path: 'themes',
        name: 'Temas y colores',
        component: () => import('@/presentation/pages/dashboard/ColorsAppPage.vue'),
      },
      {
        path: 'recommended',
        name: 'Recomendados',
        component: () => import('@/presentation/pages/dashboard/RecommendedPage.vue'),
      },
    ],
  },
]

export const router = createRouter({
  history: createWebHashHistory(), // hash-based routing para Electron
  routes,
})

// Protection of routes privates
router.beforeEach((to, _from, next) => {
  const store = useUserStore()
  const isLoggedIn = !!store.id

  if (to.path.startsWith('/dashboard') && !isLoggedIn) {
    return next('/auth/login')
  }

  if (to.path.startsWith('/auth') && isLoggedIn) {
    return next('/dashboard')
  }

  next()
})
