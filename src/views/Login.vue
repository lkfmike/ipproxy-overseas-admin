<template>
  <div class="login-container">
    <div class="login-content">
      <div class="login-left">
        <div class="login-info">
          <div class="logo">
            <el-icon :size="40" color="#fff"><Connection /></el-icon>
            <span class="logo-text">IPProxy Overseas</span>
          </div>
          <div class="title">全球专业 IP 代理服务</div>
          <div class="subtitle">安全、高速、可靠的企业级解决方案</div>
          <div class="features">
            <div class="feature-item">
              <el-icon><Check /></el-icon> 99.9% 在线率保证
            </div>
            <div class="feature-item">
              <el-icon><Check /></el-icon> 2亿+ 全球住宅 IP
            </div>
            <div class="feature-item">
              <el-icon><Check /></el-icon> 企业级安全防护
            </div>
          </div>
        </div>
        <div class="bg-overlay"></div>
      </div>
      
      <div class="login-right">
        <div class="login-form-wrapper">
          <div class="form-header">
            <h2>欢迎回来</h2>
            <p>请输入您的账号信息以登录</p>
          </div>
          
          <el-form :model="form" :rules="rules" ref="formRef" class="login-form" size="large">
            <el-form-item prop="username">
              <el-input 
                v-model="form.username" 
                placeholder="请输入邮箱" 
                :prefix-icon="User"
              />
            </el-form-item>
            
            <el-form-item prop="password">
              <el-input 
                v-model="form.password" 
                type="password" 
                placeholder="密码" 
                show-password 
                :prefix-icon="Lock"
                @keyup.enter="handleLogin"
              />
            </el-form-item>

            <div class="form-options">
              <el-checkbox v-model="form.remember">记住我</el-checkbox>
              <el-link type="primary" :underline="false">忘记密码？</el-link>
            </div>

            <el-form-item>
              <el-button type="primary" class="submit-btn" @click="handleLogin" :loading="loading">
                登录
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { User, Lock, Connection, Check } from '@element-plus/icons-vue'
import request from '../utils/request'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
  remember: false
})

const rules = reactive<FormRules>({
  username: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
})

const handleLogin = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const res: any = await request.post('/auth/login', {
          email: form.username,
          password: form.password
        })
        
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('refreshToken', res.data.refreshToken)
        localStorage.setItem('userInfo', JSON.stringify({
          userId: res.data.userId,
          email: res.data.email
        }))
        
        ElMessage.success('登录成功')
        router.push('/')
      } catch (error) {
        console.error(error)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped lang="scss">
.login-container {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f2f3f5; /* Business grey */
  overflow: hidden;
}

.login-content {
  width: 100%;
  height: 100%;
  display: flex;
  background: #fff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); /* Professional shadow */
  overflow: hidden;
  
  @media (min-width: 1200px) {
    width: 1200px;
    height: 720px;
    border-radius: 4px; /* Consistent 4px */
  }
}

.login-left {
  flex: 1;
  background: linear-gradient(135deg, #001529 0%, #003a8c 100%); /* Business Deep Blue */
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 60px;
  color: #fff;
  overflow: hidden;

  .bg-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    opacity: 1;
  }

  .login-info {
    position: relative;
    z-index: 2;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 48px;

    .logo-text {
      font-size: 28px;
      font-weight: 600;
      letter-spacing: 0.5px;
      font-family: 'Helvetica Neue', sans-serif;
    }
  }

  .title {
    font-size: 32px;
    font-weight: 600;
    margin-bottom: 24px;
    line-height: 1.4;
  }

  .subtitle {
    font-size: 16px;
    opacity: 0.8;
    margin-bottom: 48px;
    font-weight: 400;
  }

  .features {
    .feature-item {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      font-size: 15px;
      opacity: 0.9;
    }
  }
}

.login-right {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff;
  padding: 60px;
}

.login-form-wrapper {
  width: 100%;
  max-width: 360px; /* Standard width */

  .form-header {
    margin-bottom: 48px;
    text-align: left;

    h2 {
      font-size: 24px;
      color: #1d2129;
      margin: 0 0 8px 0;
      font-weight: 600;
    }

    p {
      color: #86909c;
      margin: 0;
      font-size: 14px;
    }
  }
}

.login-form {
  .form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .submit-btn {
    width: 100%;
    height: 40px; /* Standard height */
    font-size: 14px;
    font-weight: 500;
    letter-spacing: normal;
    background-color: var(--el-color-primary); /* Use variable */
    border: none;
    border-radius: 4px;
    
    &:hover {
      background-color: var(--el-color-primary-light-3);
      opacity: 1;
      transform: none; /* Remove jitter */
      box-shadow: none;
    }
    
    &:active {
      transform: none;
    }
    
    transition: background-color 0.2s;
  }
}

.form-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 14px;
  color: #86909c;
  
  span {
    margin-right: 8px;
  }
}

@media (max-width: 768px) {
  .login-content {
    flex-direction: column;
    height: 100vh;
    border-radius: 0;
  }

  .login-left {
    display: none;
  }

  .login-right {
    padding: 24px;
  }
}
</style>
