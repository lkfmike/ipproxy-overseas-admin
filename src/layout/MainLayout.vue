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
        background-color="#1f2937"
        text-color="#9ca3af"
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
  Platform, 
  UserFilled, 
  CreditCard, 
  Coin, 
  Fold, 
  Expand, 
  ArrowDown,
  Setting,
  Location,
  Connection,
  Tools,
  DataLine,
  Monitor,
  Ticket,
  List,
  Clock
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
const menuList = [
  {
    title: '客户管理',
    icon: 'UserFilled',
    path: '/customer',
    children: [
      { title: '账号信息', path: '/customer/account', icon: 'CreditCard' },
      { title: '客户折扣', path: '/customer/discount', icon: 'Ticket' }
    ]
  },
  {
    title: '静态代理',
    icon: 'Monitor',
    path: '/proxy',
    children: [
        { title: '网关列表', path: '/proxy/gateway', icon: 'Connection' },
        { title: '地区单价', path: '/proxy/pricing', icon: 'Coin' },
        { title: '地区管理', path: '/setting/static-region', icon: 'Location' },
        { title: '订单列表', path: '/proxy/order', icon: 'List' },
            { title: '已释放网关', path: '/proxy/history', icon: 'Clock' },
            { title: 'IP提取', path: '/proxy/tools', icon: 'Tools' }
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
  background-color: #001529;
  transition: width 0.3s cubic-bezier(0.2, 0, 0, 1);
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 6px rgba(0,21,41,0.35);
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
    font-size: 20px;
    font-weight: 600;
    background-color: #002140;
    gap: 12px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    flex-shrink: 0;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background-color: #00284d;
    }

    .logo-img {
      width: 32px;
      height: 32px;
    }
    
    .logo-text {
      white-space: nowrap;
      color: #fff;
      font-family: 'Helvetica Neue', sans-serif;
    }
  }

  .el-menu-vertical {
    border-right: none;
    background-color: transparent;
    padding: 4px 0;
    flex: 1;
    overflow-y: auto;
    
    :deep(.el-menu-item) {
      margin: 4px 8px;
      width: calc(100% - 16px);
      border-radius: 4px;
      height: 50px;
      line-height: 50px;

      &:hover {
        background-color: rgba(255,255,255,0.08);
      }
      &.is-active {
        background-color: var(--el-color-primary);
        color: #fff;
        font-weight: 500;
      }
      
      .el-icon {
        font-size: 18px;
        width: 24px;
        text-align: center;
      }
    }

    :deep(.el-sub-menu__title) {
      margin: 4px 8px;
      width: calc(100% - 16px);
      border-radius: 4px;
      height: 50px;
      line-height: 50px;
      
      &:hover {
        background-color: rgba(255,255,255,0.08);
      }
    }
  }
}

.main-content {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background-color: #F2F3F5;
  flex: 1;
}

.header {
  height: 64px;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0,21,41,0.08);
  z-index: 9;

  .header-left {
    display: flex;
    align-items: center;
    gap: 20px;

    .trigger {
      font-size: 20px;
      cursor: pointer;
      color: #4E5969;
      transition: color 0.3s;

      &:hover {
        color: var(--el-color-primary);
      }
    }
  }

  .header-right {
    .user-profile {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background-color 0.3s;

      &:hover {
        background-color: #F2F3F5;
      }

      .username {
        font-size: 14px;
        color: #1D2129;
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
