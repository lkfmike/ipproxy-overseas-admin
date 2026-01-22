import { createRouter, createWebHistory, RouterView } from 'vue-router'
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
        component: RouterView,
        children: [
          {
            path: 'account',
            name: 'AccountInfo',
            component: () => import('../views/customer/AccountInfo.vue'),
            meta: { title: '账号信息' }
          },
          {
            path: 'discount',
            name: 'AccountDiscount',
            component: () => import('../views/customer/AccountDiscount.vue'),
            meta: { title: '客户折扣' }
          }
        ]
      },
      {
        path: '/proxy',
        name: 'Proxy',
        meta: { title: '静态代理IP' },
        redirect: '/proxy/gateway',
        component: RouterView,
        children: [
          {
            path: 'pricing',
            name: 'ProxyPricing',
            component: () => import('../views/customer/Pricing.vue'),
            meta: { title: '地区单价' }
          },
          {
            path: 'gateway',
            name: 'StaticProxyGateway',
            component: () => import('../views/proxy/StaticProxy.vue'),
            meta: { title: '网关' }
          },
          {
            path: 'order',
            name: 'StaticProxyOrder',
            component: () => import('../views/proxy/StaticOrderList.vue'),
            meta: { title: '订单列表' }
          },
          {
            path: 'history',
            name: 'StaticProxyHistory',
            component: () => import('../views/proxy/StaticProxyHistory.vue'),
            meta: { title: '历史记录' }
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
        component: RouterView,
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

router.beforeEach((to, from, next) => {
  const title = to.meta.title ? `${to.meta.title} - ProxyNexus` : 'ProxyNexus - 海外IP资源管理平台'
  document.title = title
  next()
})

export default router
