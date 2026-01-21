import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import MainLayout from '../layout/MainLayout.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: MainLayout,
    redirect: '/customer/account',
    children: [
      {
        path: '/customer',
        name: 'Customer',
        meta: { title: '客户管理' },
        redirect: '/customer/account',
        children: [
          {
            path: 'account',
            name: 'AccountInfo',
            component: () => import('../views/customer/AccountInfo.vue'),
            meta: { title: '账号信息' }
          },
          {
            path: 'pricing',
            name: 'CustomerPricing',
            component: () => import('../views/customer/Pricing.vue'),
            meta: { title: '客户单价' }
          }
        ]
      },
      {
        path: '/proxy',
        name: 'Proxy',
        meta: { title: '代理管理' },
        redirect: '/proxy/static',
        children: [
          {
            path: 'static',
            name: 'StaticProxy',
            component: () => import('../views/proxy/StaticProxy.vue'),
            meta: { title: '静态代理IP' }
          }
        ]
      },
      {
        path: '/setting',
        name: 'Setting',
        meta: { title: '设置' },
        redirect: '/setting/static-region',
        children: [
          {
            path: 'static-region',
            name: 'StaticRegion',
            component: () => import('../views/setting/StaticRegion.vue'),
            meta: { title: '静态地区设置' }
          }
        ]
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
