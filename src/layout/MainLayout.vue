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
      <div class="logo">
        <el-icon :size="28" color="#409EFF"><Platform /></el-icon>
        <transition name="fade">
          <span class="logo-text" v-if="!isCollapse">IPProxy Admin</span>
        </transition>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical"
        :collapse="isCollapse && !isMobile"
        background-color="#1f2937"
        text-color="#9ca3af"
        active-text-color="#ffffff"
        router
      >
        <el-sub-menu index="/customer">
          <template #title>
            <el-icon><UserFilled /></el-icon>
            <span>客户管理</span>
          </template>
          <el-menu-item index="/customer/account">
            <el-icon><CreditCard /></el-icon>
            <template #title>账号信息</template>
          </el-menu-item>
          <el-menu-item index="/customer/pricing">
            <el-icon><Coin /></el-icon>
            <template #title>客户单价</template>
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="/proxy">
          <template #title>
            <el-icon><Connection /></el-icon>
            <span>静态代理IP</span>
          </template>
          <el-menu-item index="/proxy/gateway">
            <el-icon><Connection /></el-icon>
            <template #title>网关</template>
          </el-menu-item>
          <el-menu-item index="/proxy/tools">
            <el-icon><Tools /></el-icon>
            <template #title>工具</template>
          </el-menu-item>
          <el-menu-item index="/proxy/supplier-comparison">
            <el-icon><DataLine /></el-icon>
            <template #title>供应商对比</template>
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="/setting">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>设置</span>
          </template>
          <el-menu-item index="/setting/static-region">
            <el-icon><Location /></el-icon>
            <template #title>静态地区设置</template>
          </el-menu-item>
        </el-sub-menu>
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
        © 2024 IPProxy Overseas. All rights reserved.
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
  DataLine
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
