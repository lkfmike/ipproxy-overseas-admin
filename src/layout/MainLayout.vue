<template>
  <el-container class="layout-container">
    <!-- Mobile Overlay -->
    <div 
      v-if="isMobile && !isCollapse" 
      class="mobile-overlay"
      @click="toggleCollapse"
    ></div>

    <!-- Sidebar -->
    <el-aside 
      :width="asideWidth" 
      class="aside"
      :class="{ 'mobile-aside': isMobile, 'mobile-aside-open': isMobile && !isCollapse }"
    >
      <div class="logo" @click="goHome">
        <img src="../assets/proxynexus.svg" alt="logo" class="logo-img" />
        <transition name="fade">
          <span class="logo-text" v-if="!isCollapse">ProxyNexus</span>
        </transition>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical"
        :collapse="isCollapse && !isMobile"
        background-color="#0f172a"
        text-color="#94a3b8"
        active-text-color="#ffffff"
        unique-opened
        router
      >
        <template v-for="item in menuList" :key="item.path">
          <!-- Level 1 Submenu -->
          <el-sub-menu v-if="item.children" :index="item.path">
            <template #title>
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ item.title }}</span>
            </template>
            
            <template v-for="child in item.children" :key="child.path">
              <!-- Level 2 Submenu -->
              <el-sub-menu v-if="child.children" :index="child.path">
                <template #title>
                  <el-icon v-if="child.icon"><component :is="child.icon" /></el-icon>
                  <span>{{ child.title }}</span>
                </template>
                <!-- Level 3 Items -->
                <el-menu-item 
                  v-for="grandchild in child.children" 
                  :key="grandchild.path" 
                  :index="grandchild.path"
                >
                  <el-icon v-if="grandchild.icon"><component :is="grandchild.icon" /></el-icon>
                  <template #title>{{ grandchild.title }}</template>
                </el-menu-item>
              </el-sub-menu>

              <!-- Level 2 Item -->
              <el-menu-item v-else :index="child.path">
                <el-icon v-if="child.icon"><component :is="child.icon" /></el-icon>
                <template #title>{{ child.title }}</template>
              </el-menu-item>
            </template>
          </el-sub-menu>

          <!-- Level 1 Item -->
          <el-menu-item v-else :index="item.path">
            <el-icon><component :is="item.icon" /></el-icon>
            <template #title>{{ item.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <el-container class="main-content">
      <el-header class="header">
        <div class="header-left">
          <el-icon class="trigger" @click="toggleCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/" class="hidden-xs-only">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="index">
              {{ item.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <div class="user-profile">
              <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
              <span class="username hidden-xs-only">Admin</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
      
      <el-footer class="footer">
        © 2026 ProxyNexus. All rights reserved.
      </el-footer>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  Fold, 
  Expand, 
  ArrowDown, 
  Connection, 
  Odometer, 
  User, 
  Postcard, 
  Discount, 
  Platform, 
  Money, 
  MapLocation, 
  Tickets, 
  Timer, 
  Aim, 
  Refresh, 
  Box, 
  Lock
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const isCollapse = ref(false)
const isMobile = ref(false)

const activeMenu = computed(() => {
  return route.path
})

const breadcrumbs = computed(() => {
  return route.matched.filter(item => item.meta && item.meta.title && item.path !== '/')
})

const asideWidth = computed(() => {
  if (isMobile.value) {
    return isCollapse.value ? '0px' : '240px'
  }
  return isCollapse.value ? '64px' : '240px'
})

// Menu Data Structure
interface MenuItem {
  title: string
  path: string
  icon?: any
  children?: MenuItem[]
}
const menuList: MenuItem[] = [
  {
    title: '仪表盘',
    path: '/dashboard',
    icon: Odometer,
  },
  {
    title: '客户管理',
    icon: User,
    path: '/customer',
    children: [
      { title: '账号信息', path: '/customer/account', icon: Postcard },
      { title: '客户折扣', path: '/customer/discount', icon: Discount }
    ]
  },
  {
    title: '静态代理',
    icon: Platform,
    path: '/proxy',
    children: [
        { title: '网关列表', path: '/proxy/gateway', icon: Connection },
        { title: '地区单价', path: '/proxy/pricing', icon: Money },
        { title: '地区管理', path: '/setting/static-region', icon: MapLocation },
        { title: '订单列表', path: '/proxy/order', icon: Tickets },
        { title: '已释放网关', path: '/proxy/history', icon: Timer },
        { title: 'IP提取', path: '/proxy/tools', icon: Aim }
    ]
  },
  {
    title: '动态代理',
    icon: Refresh,
    path: '/dynamic',
    children: [
      { title: '套餐管理', path: '/dynamic/meal', icon: Box },
      { title: 'IP白名单', path: '/dynamic/whitelist', icon: Lock },
      { title: '订单管理', path: '/dynamic/order', icon: Tickets }
    ]
  },
  
]

const checkMobile = () => {
  const mobile = window.innerWidth <= 768
  if (mobile !== isMobile.value) {
    isMobile.value = mobile
    // Auto collapse on mobile
    if (mobile) {
      isCollapse.value = true
    } else {
      isCollapse.value = false
    }
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const goHome = () => {
  router.push('/')
}

const handleCommand = (command: string) => {
  if (command === 'logout') {
    ElMessage.success('已退出登录')
    router.push('/login')
  }
}
</script>

<style scoped lang="scss">
.layout-container {
  height: 100vh;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 998;
}

.aside {
  background-color: #0f172a; // Darker slate blue
  transition: width 0.3s cubic-bezier(0.2, 0, 0, 1);
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0,0,0,0.15);
  z-index: 1000;
  height: 100vh;
  flex-shrink: 0;

  &.mobile-aside {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    
    &.mobile-aside-open {
      width: 240px !important;
    }
  }

  .logo {
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 18px;
    font-weight: 600;
    background-color: #0f172a;
    gap: 12px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    flex-shrink: 0;
    cursor: pointer;
    transition: all 0.3s;
    letter-spacing: 0.5px;
    position: relative;
    z-index: 10;
    box-shadow: 0 1px 2px rgba(0,0,0,0.2);

    &:hover {
      background-color: #1e293b;
    }

    .logo-img {
      width: 28px;
      height: 28px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
    }
    
    .logo-text {
      white-space: nowrap;
      color: #f8fafc;
      font-family: 'Inter', sans-serif;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }
  }

  .el-menu-vertical {
    border-right: none;
    background-color: transparent;
    padding: 12px 0;
    flex: 1;
    overflow-y: auto;
    
    :deep(.el-menu-item) {
      margin: 4px 12px;
      width: calc(100% - 24px);
      border-radius: 8px;
      height: 48px;
      line-height: 48px;
      color: #94a3b8;
      transition: all 0.2s;

      &:hover {
        background-color: rgba(255,255,255,0.08);
        color: #fff;
        transform: translateX(2px);
      }
      &.is-active {
        background: linear-gradient(90deg, var(--el-color-primary) 0%, #3b82f6 100%);
        color: #fff;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(22, 93, 255, 0.25);
        transform: translateX(0);
      }
      
      .el-icon {
        font-size: 20px;
        width: 24px;
        text-align: center;
        margin-right: 8px;
        transition: transform 0.2s;
      }

      &:hover .el-icon {
        transform: scale(1.1);
      }
    }

    :deep(.el-sub-menu__title) {
      margin: 4px 12px;
      width: calc(100% - 24px);
      border-radius: 8px;
      height: 48px;
      line-height: 48px;
      color: #94a3b8;
      
      &:hover {
        background-color: rgba(255,255,255,0.08);
        color: #fff;
      }

      .el-icon {
        font-size: 20px;
        width: 24px;
        text-align: center;
        margin-right: 8px;
      }
    }
  }
}

.main-content {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background-color: #F8FAFC; // Lighter bg
  flex: 1;
}

.header {
  height: 64px;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  z-index: 9;
  border-bottom: 1px solid #e2e8f0;

  .header-left {
    display: flex;
    align-items: center;
    gap: 20px;

    .trigger {
      font-size: 20px;
      cursor: pointer;
      color: #64748b;
      transition: color 0.3s;
      padding: 8px;
      border-radius: 4px;

      &:hover {
        color: var(--el-color-primary);
        background-color: #f1f5f9;
      }
    }
  }

  .header-right {
    .user-profile {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      padding: 6px 12px;
      border-radius: 24px;
      transition: all 0.3s;
      border: 1px solid transparent;

      &:hover {
        background-color: #fff;
        border-color: #e2e8f0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      }

      .username {
        font-size: 14px;
        color: #334155;
        font-weight: 500;
      }
    }
  }
}

.main {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  overflow-x: hidden;
}

.footer {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #86909C;
  font-size: 12px;
  background-color: #fff;
  border-top: 1px solid #E5E6EB;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
