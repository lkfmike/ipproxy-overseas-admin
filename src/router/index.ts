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
        meta: { title: '静态代理IP' },
        redirect: '/proxy/gateway',
        children: [
          {
            path: 'gateway',
            name: 'StaticProxyGateway',
            component: () => import('../views/proxy/StaticProxy.vue'),
            meta: { title: '网关' }
          },
          {
            path: 'tools',
            name: 'StaticProxyTools',
            component: () => import('../views/proxy/Tools.vue'),
            meta: { title: '工具' }
          },
          {
            path: 'supplier-comparison',
            name: 'StaticProxySupplierComparison',
            component: () => import('../views/proxy/SupplierComparison.vue'),
            meta: { title: '供应商对比' }
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
