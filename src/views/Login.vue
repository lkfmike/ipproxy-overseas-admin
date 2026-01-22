<template>
  <div class="login-container">
    <div class="login-content">
      <div class="login-left">
        <div class="login-info">
          <div class="logo">
            <el-icon :size="40" color="#fff"><Connection /></el-icon>
            <span class="logo-text">ProxyNexus</span>
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
              <div class="link-group">
                <el-link type="primary" :underline="false" @click="forgotPasswordDialogVisible = true">忘记密码？</el-link>
                <el-divider direction="vertical" />
                <el-link type="primary" :underline="false" @click="registerDialogVisible = true">注册账号</el-link>
              </div>
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
    
    <!-- Register Dialog -->
    <el-dialog v-model="registerDialogVisible" title="注册账号" width="420px" append-to-body @close="resetRegisterForm">
      <el-form :model="registerForm" :rules="registerRules" ref="registerFormRef" label-width="80px">
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="registerForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="验证码" prop="code">
          <div class="verify-code-container">
            <el-input v-model="registerForm.code" placeholder="6位验证码" style="width: 160px" />
            <el-button type="primary" link :disabled="registerTimer > 0" @click="sendRegisterCode">
              {{ registerTimer > 0 ? `${registerTimer}s后重发` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="registerForm.password" type="password" show-password placeholder="6-20位密码" />
        </el-form-item>
        <el-form-item label="邀请码" prop="inviteCode">
          <el-input v-model="registerForm.inviteCode" placeholder="请输入邀请码" />
        </el-form-item>
        <el-form-item label="TG账号" prop="telegram">
          <el-input v-model="registerForm.telegram" placeholder="选填，方便联系" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="registerDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleRegister" :loading="registerLoading">注册</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Forgot Password Dialog -->
    <el-dialog v-model="forgotPasswordDialogVisible" title="重置密码" width="420px" append-to-body @close="resetForgotForm">
      <el-form :model="forgotForm" :rules="forgotRules" ref="forgotFormRef" label-width="80px">
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="forgotForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="验证码" prop="code">
          <div class="verify-code-container">
            <el-input v-model="forgotForm.code" placeholder="6位验证码" style="width: 160px" />
            <el-button type="primary" link :disabled="forgotTimer > 0" @click="sendForgotCode">
              {{ forgotTimer > 0 ? `${forgotTimer}s后重发` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="新密码" prop="password">
          <el-input v-model="forgotForm.password" type="password" show-password placeholder="请输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="forgotPasswordDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleResetPassword" :loading="forgotLoading">确认重置</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onBeforeUnmount } from 'vue'
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

// Register Logic
const registerDialogVisible = ref(false)
const registerFormRef = ref<FormInstance>()
const registerLoading = ref(false)
const registerTimer = ref(0)
let registerInterval: number | null = null

const registerForm = reactive({
  email: '',
  code: '',
  password: '',
  inviteCode: '',
  telegram: ''
})

const registerRules = reactive<FormRules>({
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
  ],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }],
  inviteCode: [{ required: true, message: '请输入邀请码', trigger: 'blur' }]
})

const sendRegisterCode = async () => {
  if (!registerForm.email) {
    ElMessage.warning('请先输入邮箱')
    return
  }
  try {
    await request.post('/auth/send-verify-code', { email: registerForm.email, type: 'register' })
    ElMessage.success('验证码已发送')
    startRegisterTimer()
  } catch (error) {
    console.error(error)
  }
}

const startRegisterTimer = () => {
  registerTimer.value = 60
  registerInterval = window.setInterval(() => {
    if (registerTimer.value > 0) {
      registerTimer.value--
    } else {
      if (registerInterval) clearInterval(registerInterval)
    }
  }, 1000)
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      registerLoading.value = true
      try {
        const res: any = await request.post('/auth/register', registerForm)
        ElMessage.success('注册成功，已自动登录')
        handleLoginSuccess(res)
        registerDialogVisible.value = false
      } catch (error) {
        console.error(error)
      } finally {
        registerLoading.value = false
      }
    }
  })
}

const resetRegisterForm = () => {
  if (registerFormRef.value) registerFormRef.value.resetFields()
  if (registerInterval) clearInterval(registerInterval)
  registerTimer.value = 0
}

// Forgot Password Logic
const forgotPasswordDialogVisible = ref(false)
const forgotFormRef = ref<FormInstance>()
const forgotLoading = ref(false)
const forgotTimer = ref(0)
let forgotInterval: number | null = null

const forgotForm = reactive({
  email: '',
  code: '',
  password: ''
})

const forgotRules = reactive<FormRules>({
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
  ],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
  password: [{ required: true, message: '请输入新密码', trigger: 'blur' }, { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }]
})

const sendForgotCode = async () => {
  if (!forgotForm.email) {
    ElMessage.warning('请先输入邮箱')
    return
  }
  try {
    await request.post('/auth/send-verify-code', { email: forgotForm.email, type: 'reset-password' })
    ElMessage.success('验证码已发送')
    startForgotTimer()
  } catch (error) {
    console.error(error)
  }
}

const startForgotTimer = () => {
  forgotTimer.value = 60
  forgotInterval = window.setInterval(() => {
    if (forgotTimer.value > 0) {
      forgotTimer.value--
    } else {
      if (forgotInterval) clearInterval(forgotInterval)
    }
  }, 1000)
}

const handleResetPassword = async () => {
  if (!forgotFormRef.value) return
  await forgotFormRef.value.validate(async (valid) => {
    if (valid) {
      forgotLoading.value = true
      try {
        await request.post('/auth/reset-password', forgotForm)
        ElMessage.success('密码重置成功，请重新登录')
        forgotPasswordDialogVisible.value = false
      } catch (error) {
        console.error(error)
      } finally {
        forgotLoading.value = false
      }
    }
  })
}

const resetForgotForm = () => {
  if (forgotFormRef.value) forgotFormRef.value.resetFields()
  if (forgotInterval) clearInterval(forgotInterval)
  forgotTimer.value = 0
}

const handleLoginSuccess = (res: any) => {
  localStorage.setItem('token', res.data.token)
  if (res.data.refreshToken) localStorage.setItem('refreshToken', res.data.refreshToken)
  localStorage.setItem('userInfo', JSON.stringify({
    userId: res.data.userId,
    email: res.data.email
  }))
  
  router.push('/')
}

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
        
        ElMessage.success('登录成功')
        handleLoginSuccess(res)
      } catch (error) {
        console.error(error)
      } finally {
        loading.value = false
      }
    }
  })
}

onBeforeUnmount(() => {
  if (registerInterval) clearInterval(registerInterval)
  if (forgotInterval) clearInterval(forgotInterval)
})
</script>

<style scoped lang="scss">
.link-group {
  display: flex;
  align-items: center;
}

.verify-code-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

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
