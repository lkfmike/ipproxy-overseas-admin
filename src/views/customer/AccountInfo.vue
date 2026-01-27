<template>
  <div class="page-container">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">账号信息管理</span>
            <el-tag type="info" size="small" effect="plain" class="count-tag">共 {{ total }} 条数据</el-tag>
          </div>
          <el-button type="primary" :icon="Plus" @click="handleCreate">新增客户</el-button>
        </div>
      </template>
      
      <div class="filter-container">
        <el-form :inline="true" :model="filterForm" class="demo-form-inline">
          <el-form-item label="邮箱">
            <el-input v-model="filterForm.email" placeholder="请输入邮箱" clearable @keyup.enter="handleSearch" />
          </el-form-item>
          <el-form-item label="昵称">
            <el-input v-model="filterForm.nickname" placeholder="请输入昵称" clearable @keyup.enter="handleSearch" />
          </el-form-item>
          <el-form-item label="父账号">
            <el-select
              v-model="filterForm.parentUid"
              placeholder="选择父账号"
              clearable
              filterable
              remote
              :remote-method="searchParentAccounts"
              style="width: 220px"
            >
              <el-option
                v-for="item in parentOptions"
                :key="item.uid"
                :label="item.email"
                :value="item.uid"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div v-loading="loading">
        <!-- Desktop Table View -->
        <el-table v-if="!isMobile" :data="tableData" style="width: 100%" stripe border>
          <el-table-column prop="uid" label="UID" width="80" align="center" />
          <el-table-column prop="email" label="邮箱" min-width="180">
             <template #default="scope">
                <div class="user-info">
                  <span>{{ scope.row.email }}</span>
                </div>
             </template>
          </el-table-column>
          <el-table-column prop="nickname" label="昵称" min-width="120" />
          <el-table-column prop="parentUid" label="父账号" min-width="180">
            <template #default="scope">
              <span v-if="scope.row.parentUid && scope.row.parentUid > 0">{{ scope.row.parentEmail || '-' }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="telegram" label="Telegram" min-width="120" />
          <el-table-column prop="inviteCode" label="邀请码" width="100" align="center" />
          <el-table-column prop="balance" label="余额" min-width="120" align="right">
            <template #default="scope">
              <span class="price text-bold">${{ Number(scope.row.balance || 0).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" effect="dark" size="small">
                {{ scope.row.status === 1 ? '正常' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
          <el-table-column prop="proxyType" label="代理类型" min-width="120">
            <template #default="scope">
              <span>{{ formatProxyType(scope.row.proxyType) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right" align="center">
            <template #default="scope">
              <el-dropdown @command="(cmd: string) => handleCommand(scope.row, cmd)">
                <el-button text bg size="small">操作</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="detail">详情</el-dropdown-item>
                    <el-dropdown-item command="balance">修改余额</el-dropdown-item>
                    <el-dropdown-item command="profile">编辑资料</el-dropdown-item>
                    <el-dropdown-item command="proxy">修改代理信息</el-dropdown-item>
                    <el-dropdown-item command="parent">修改父账号</el-dropdown-item>
                    <el-dropdown-item :command="'toggle'">{{ scope.row.status === 1 ? '禁用' : '启用' }}</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>

        <!-- Mobile/Card Grid View -->
        <el-row :gutter="16" v-else>
          <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in tableData" :key="item.uid" class="mb-4">
            <el-card shadow="hover" class="user-card">
              <div class="user-card-header">
                <div class="user-main">
                  <el-avatar :size="40" class="user-avatar">{{ item.email.charAt(0).toUpperCase() }}</el-avatar>
                  <div class="user-meta">
                    <div class="user-email" :title="item.email">{{ item.email }}</div>
                    <div class="user-uid">UID: {{ item.uid }}</div>
                  </div>
                </div>
                <el-tag :type="item.status === 1 ? 'success' : 'danger'" size="small" effect="dark">
                  {{ item.status === 1 ? '正常' : '禁用' }}
                </el-tag>
              </div>
              
              <div class="user-card-body">
                <div class="info-row">
                  <span class="label">Telegram</span>
                  <span class="value">{{ item.telegram || '-' }}</span>
                </div>
                <div class="info-row">
                  <span class="label">邀请码</span>
                  <span class="value">{{ item.inviteCode || '-' }}</span>
                </div>
                <div class="info-row">
                  <span class="label">余额</span>
                  <span class="value price">${{ Number(item.balance || 0).toFixed(2) }}</span>
                </div>
                <div class="info-row">
                  <span class="label">代理类型</span>
                  <span class="value">{{ formatProxyType(item.proxyType) }}</span>
                </div>
                <div class="info-row">
                  <span class="label">父账号</span>
                  <span class="value">{{ item.parentUid && item.parentUid > 0 ? (item.parentEmail || '-') : '-' }}</span>
                </div>
              </div>

              <div class="user-card-footer">
                <el-dropdown @command="(cmd: string) => handleCommand(item, cmd)">
                  <el-button text bg size="small">操作</el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="detail">详情</el-dropdown-item>
                      <el-dropdown-item command="balance">修改余额</el-dropdown-item>
                      <el-dropdown-item command="profile">编辑资料</el-dropdown-item>
                      <el-dropdown-item command="proxy">修改代理信息</el-dropdown-item>
                      <el-dropdown-item command="parent">修改父账号</el-dropdown-item>
                      <el-dropdown-item :command="'toggle'">{{ item.status === 1 ? '禁用' : '启用' }}</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          background
        />
      </div>
    </el-card>

    <!-- Create Dialog -->
    <el-dialog v-model="createDialogVisible" title="新增客户" width="500px" destroy-on-close>
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="100px" label-position="left">
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="createForm.email" placeholder="请输入邮箱" />
          <div class="form-tip">用于登录和接收通知，请填写常用邮箱</div>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="createForm.password" placeholder="请输入密码（至少6位）" show-password />
          <div class="form-tip">建议包含大小写字母与数字，避免使用常见弱密码</div>
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="createForm.nickname" placeholder="请输入昵称（可选）" maxlength="32" show-word-limit />
        </el-form-item>
        <el-form-item label="代理类型" prop="proxyType">
          <el-select v-model="createForm.proxyType" placeholder="请选择代理类型" style="width: 100%" :disabled="!!createForm.parentUid">
            <el-option label="动态住宅" value="residential" />
            <el-option label="移动代理" value="mobile" />
          </el-select>
          <div class="form-tip" v-if="createForm.parentUid">已选择父账号，代理类型已与父账号一致</div>
        </el-form-item>
        <el-form-item label="Telegram" prop="telegram">
          <el-input v-model="createForm.telegram" placeholder="请输入Telegram账号" />
          <div class="form-tip">可选，用于接收系统通知与支持沟通</div>
        </el-form-item>
        <el-form-item label="父账号" prop="parentUid">
          <el-select
            v-model="createForm.parentUid"
            placeholder="选择父账号（可选）"
            clearable
            filterable
            remote
            :remote-method="searchParentAccounts"
            style="width: 100%"
          >
            <el-option
              v-for="item in parentOptions"
              :key="item.uid"
              :label="item.email"
              :value="item.uid"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="createForm.remark" type="textarea" placeholder="请输入备注（最多100字）" :rows="3" maxlength="100" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCreate" :loading="createLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Profile Edit Dialog -->
    <el-dialog v-model="profileDialogVisible" title="编辑资料" width="500px" destroy-on-close>
      <el-form :model="profileForm" :rules="profileRules" ref="profileFormRef" label-width="100px" label-position="left">
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="profileForm.nickname" placeholder="请输入昵称（可选）" maxlength="32" show-word-limit />
        </el-form-item>
        <el-form-item label="Telegram" prop="telegram">
          <el-input v-model="profileForm.telegram" placeholder="请输入Telegram账号（可选）" maxlength="64" show-word-limit />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="profileForm.remark" type="textarea" placeholder="请输入备注（最多100字）" :rows="3" maxlength="100" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="profileDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitProfile" :loading="profileLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Balance Dialog -->
    <el-dialog v-model="balanceDialogVisible" title="修改余额" width="400px" destroy-on-close>
      <el-form :model="balanceForm" :rules="balanceRules" ref="balanceFormRef" label-width="100px" label-position="left">
        <el-form-item label="当前余额">
          <span class="price-text">{{ Number(currentBalance || 0).toFixed(2) }}</span>
        </el-form-item>
        <el-form-item label="新余额" prop="amount">
          <el-input-number v-model="balanceForm.amount" :precision="2" :step="1.0" style="width: 100%" controls-position="right" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="balanceDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitBalance" :loading="balanceLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Proxy Edit Dialog -->
    <el-dialog v-model="proxyDialogVisible" title="修改代理信息" width="500px" destroy-on-close>
      <el-form :model="proxyForm" :rules="proxyRules" ref="proxyFormRef" label-width="100px" label-position="left">
        <el-form-item label="代理类型" prop="proxyType">
          <el-select v-model="proxyForm.proxyType" placeholder="请选择代理类型" style="width: 100%">
            <el-option label="动态住宅" value="residential" />
            <el-option label="移动代理" value="mobile" />
          </el-select>
        </el-form-item>
        <el-form-item label="代理用户名" prop="proxyUsername">
          <el-input v-model="proxyForm.proxyUsername" placeholder="14位，字母开头，含大小写和数字" maxlength="14" show-word-limit />
        </el-form-item>
        <el-form-item label="代理密码" prop="proxyPassword">
          <el-input v-model="proxyForm.proxyPassword" placeholder="14位，字母开头，含大小写和数字" maxlength="14" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="proxyDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitProxy" :loading="proxyLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Parent Edit Dialog -->
    <el-dialog v-model="parentDialogVisible" title="修改父账号" width="500px" destroy-on-close>
      <el-form :model="parentForm" ref="parentFormRef" label-width="100px" label-position="left">
        <el-form-item label="当前账号">
          <span>{{ parentForm.uid }}</span>
        </el-form-item>
        <el-form-item label="父账号">
          <el-select
            v-model="parentForm.parentUid"
            placeholder="选择父账号（可选）"
            clearable
            filterable
            remote
            :remote-method="searchParentAccounts"
            style="width: 100%"
          >
            <el-option
              v-for="item in parentOptions"
              :key="item.uid"
              :label="item.email"
              :value="item.uid"
            />
          </el-select>
          <div class="form-tip">选择父账号后，该账号的代理类型将与父账号一致</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="parentDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitParent" :loading="parentLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>
    <!-- Details Dialog -->
    <el-dialog v-model="detailsDialogVisible" title="用户详情" width="600px" destroy-on-close>
      <el-descriptions :column="1" border v-if="currentAccount">
        <el-descriptions-item label="UID">{{ currentAccount.uid }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ currentAccount.email }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ currentAccount.nickname || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Telegram">{{ currentAccount.telegram || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邀请码">{{ currentAccount.inviteCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="API Token">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="word-break: break-all;">{{ currentAccount.apiToken || '-' }}</span>
            <el-button 
              v-if="currentAccount.apiToken"
              type="primary" 
              link 
              :icon="DocumentCopy" 
              @click="copyToken(currentAccount.apiToken)"
            />
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="余额">
          <span class="price">${{ Number(currentAccount.balance || 0).toFixed(2) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="代理类型">{{ formatProxyType(currentAccount.proxyType) }}</el-descriptions-item>
        <el-descriptions-item label="代理用户名">{{ currentAccount.proxyUsername || '-' }}</el-descriptions-item>
        <el-descriptions-item label="代理密码">{{ currentAccount.proxyPassword || '-' }}</el-descriptions-item>
        <el-descriptions-item label="父账号">{{ currentAccount.parentUid && currentAccount.parentUid > 0 ? (currentAccount.parentEmail || '-') : '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentAccount.status === 1 ? 'success' : 'danger'" size="small">
            {{ currentAccount.status === 1 ? '正常' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注">{{ currentAccount.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ formatDate(currentAccount.createdAt) }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailsDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Plus,
  Search,
  Refresh,
  DocumentCopy
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import request from '../../utils/request'

interface Account {
  uid: number
  email: string
  nickname: string
  telegram: string
  balance: number
  status: number
  remark: string
  createdAt: string
  inviteCode: string
  apiToken: string
  proxyType: string
  proxyUsername: string
  proxyPassword: string
  parentUid: number
  parentEmail?: string
}

// Mobile Check
const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const tableData = ref<Account[]>([])
const route = useRoute()
const router = useRouter()

const filterForm = reactive({
  email: '',
  nickname: '',
  parentUid: undefined as number | undefined
})

const parentOptions = ref<Account[]>([])

// Create Dialog
const createDialogVisible = ref(false)
const createLoading = ref(false)
const createFormRef = ref<FormInstance>()
const createForm = reactive({
  email: '',
  password: '',
  proxyType: 'residential',
  telegram: '',
  remark: '',
  nickname: '',
  parentUid: undefined as number | undefined
})
const createRules = reactive<FormRules>({
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' },
    { pattern: /^\S+$/, message: '密码不能包含空格', trigger: 'blur' }
  ],
  nickname: [
    { validator: (_r, v, cb) => {
        if (!v) return cb()
        const s = String(v).trim()
        if (!s) return cb()
        if (s.length > 32) return cb(new Error('昵称长度不超过32'))
        cb()
      }, trigger: ['blur', 'change']
    }
  ]
})

// Balance Dialog
const balanceDialogVisible = ref(false)
const balanceLoading = ref(false)
const balanceFormRef = ref<FormInstance>()
const currentBalance = ref(0)
const balanceForm = reactive({
  uid: 0,
  amount: 0
})
const balanceRules = reactive<FormRules>({
  amount: [
    { required: true, message: '请输入金额', trigger: 'blur' },
    { validator: (_rule, value, callback) => {
        if (value === null || value === undefined || value === '') return callback(new Error('请输入金额'))
        if (Number(value) < 0) return callback(new Error('金额不可为负数'))
        callback()
      }, trigger: 'blur'
    }
  ]
})

// Details Dialog
const detailsDialogVisible = ref(false)
const currentAccount = ref<Account | null>(null)

const handleDetail = (row: Account) => {
  currentAccount.value = row
  detailsDialogVisible.value = true
}

const handleCommand = (row: Account, cmd: string) => {
  switch (cmd) {
    case 'detail':
      handleDetail(row)
      break
    case 'balance':
      handleBalance(row)
      break
    case 'proxy':
      handleProxyEdit(row)
      break
    case 'parent':
      handleParentEdit(row)
      break
  case 'profile':
    handleProfileEdit(row)
    break
    case 'toggle':
      handleStatusChange(row)
      break
  }
}
// Proxy Edit Dialog
const proxyDialogVisible = ref(false)
const proxyLoading = ref(false)
const proxyFormRef = ref<FormInstance>()
const proxyForm = reactive({
  uid: 0,
  proxyType: '',
  proxyUsername: '',
  proxyPassword: ''
})
const proxyRules = reactive<FormRules>({
  proxyType: [{ required: true, message: '请选择代理类型', trigger: 'blur' }],
  proxyUsername: [
    { validator: (_r, v, cb) => validateProxyString(v, cb), trigger: ['blur', 'change'] }
  ],
  proxyPassword: [
    { validator: (_r, v, cb) => validateProxyString(v, cb), trigger: ['blur', 'change'] }
  ]
})

const handleProxyEdit = (row: Account) => {
  proxyForm.uid = row.uid
  proxyForm.proxyType = row.proxyType || ''
  proxyForm.proxyUsername = row.proxyUsername || ''
  proxyForm.proxyPassword = row.proxyPassword || ''
  proxyDialogVisible.value = true
}

const submitProxy = async () => {
  if (!proxyFormRef.value) return
  await proxyFormRef.value.validate(async (valid) => {
    if (!valid) return
    proxyLoading.value = true
    try {
      await request.post('/web/account/proxy', {
        uid: proxyForm.uid,
        proxyType: proxyForm.proxyType,
        proxyUsername: (proxyForm.proxyUsername || '').trim(),
        proxyPassword: (proxyForm.proxyPassword || '').trim()
      })
      ElMessage.success('修改成功')
      proxyDialogVisible.value = false
      fetchData()
    } catch (e) {
    } finally {
      proxyLoading.value = false
    }
  })
}

const copyToken = (token: string) => {
  if (!token) return
  navigator.clipboard.writeText(token).then(() => {
    ElMessage.success('复制成功')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

const searchParentAccounts = async (query: string) => {
  try {
    const res: any = await request.get('/web/account/list', {
      params: {
        page: 1,
        size: 10,
        email: query
      }
    })
    parentOptions.value = res.data.list || []
  } catch (e) {
    parentOptions.value = []
  }
}

// Parent Edit
const parentDialogVisible = ref(false)
const parentLoading = ref(false)
const parentFormRef = ref<FormInstance>()
const parentForm = reactive({
  uid: 0,
  parentUid: undefined as number | undefined
})

const handleParentEdit = (row: Account) => {
  parentForm.uid = row.uid
  parentForm.parentUid = row.parentUid && row.parentUid > 0 ? row.parentUid : undefined
  parentDialogVisible.value = true
}

const submitParent = async () => {
  parentLoading.value = true
  try {
    await request.post('/web/account/parent', {
      uid: parentForm.uid,
      parentUid: parentForm.parentUid ?? 0
    })
    ElMessage.success('父账号已更新')
    parentDialogVisible.value = false
    fetchData()
  } catch (e) {
  } finally {
    parentLoading.value = false
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString()
}

const formatProxyType = (t?: string) => {
  if (!t) return '-'
  return t === 'residential' ? '动态住宅' : '移动代理'
}

const validateProxyString = (s: string, cb: (e?: Error) => void) => {
  if (!s || !String(s).trim()) return cb()
  const str = String(s).trim()
  if (str.length !== 14) return cb(new Error('长度需为14位'))
  if (!/^[A-Za-z][A-Za-z0-9]{13}$/.test(str)) {
    if (!/^[A-Za-z]/.test(str)) return cb(new Error('需以字母开头'))
    return cb(new Error('仅允许字母和数字'))
  }
  if (!/[A-Z]/.test(str) || !/[a-z]/.test(str) || !/[0-9]/.test(str)) return cb(new Error('需同时包含大写、小写、数字'))
  cb()
}

const fetchData = async () => {
  loading.value = true
  try {
    const res: any = await request.get('/web/account/list', {
      params: {
        page: currentPage.value,
        size: pageSize.value,
        email: filterForm.email,
        nickname: filterForm.nickname,
        parentUid: filterForm.parentUid
      }
    })
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const syncQuery = () => {
  router.replace({
    query: {
      page: String(currentPage.value),
      size: String(pageSize.value),
      email: filterForm.email || undefined,
      nickname: filterForm.nickname || undefined,
      parentUid: filterForm.parentUid !== undefined ? String(filterForm.parentUid) : undefined
    }
  })
}

const initFromQuery = () => {
  const q = route.query as Record<string, any>
  if (q.page) currentPage.value = Number(q.page) || 1
  if (q.size) pageSize.value = Number(q.size) || 10
  if (q.email) filterForm.email = String(q.email)
  if (q.nickname) filterForm.nickname = String(q.nickname)
  if (q.parentUid) {
    const n = Number(q.parentUid)
    filterForm.parentUid = Number.isFinite(n) ? n : undefined
  }
}

const handleSearch = () => {
  currentPage.value = 1
  syncQuery()
  fetchData()
}

const handleReset = () => {
  filterForm.email = ''
  filterForm.nickname = ''
  filterForm.parentUid = undefined
  currentPage.value = 1
  syncQuery()
  handleSearch()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  syncQuery()
  fetchData()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  syncQuery()
  fetchData()
}

// Create Logic
const handleCreate = () => {
  createForm.email = ''
  createForm.password = ''
  createForm.proxyType = 'residential'
  createForm.telegram = ''
  createForm.remark = ''
  createForm.nickname = ''
  createForm.parentUid = undefined
  createDialogVisible.value = true
}

const submitCreate = async () => {
  if (!createFormRef.value) return
  await createFormRef.value.validate(async (valid) => {
    if (valid) {
      createLoading.value = true
      try {
        await request.post('/web/account/create', createForm)
        ElMessage.success('创建成功')
        createDialogVisible.value = false
        fetchData()
      } catch (error) {
        // Error handled by interceptor
      } finally {
        createLoading.value = false
      }
    }
  })
}

// When selecting parent in create dialog, sync proxy type to parent's
watch(() => createForm.parentUid, (val) => {
  if (!val) return
  const found = parentOptions.value.find(x => x.uid === val)
  if (found && found.proxyType) {
    createForm.proxyType = found.proxyType
  }
})

// Profile Edit Dialog
const profileDialogVisible = ref(false)
const profileLoading = ref(false)
const profileFormRef = ref<FormInstance>()
const profileForm = reactive({
  uid: 0,
  nickname: '',
  telegram: '',
  remark: ''
})
const profileRules = reactive<FormRules>({
  nickname: [
    { validator: (_r, v, cb) => {
        if (!v) return cb()
        const s = String(v).trim()
        if (!s) return cb()
        if (s.length > 32) return cb(new Error('昵称长度不超过32'))
        cb()
      }, trigger: ['blur', 'change']
    }
  ],
  telegram: [
    { validator: (_r, v, cb) => {
        if (!v) return cb()
        const s = String(v).trim()
        if (!s) return cb()
        if (s.length > 64) return cb(new Error('Telegram长度不超过64'))
        cb()
      }, trigger: ['blur', 'change']
    }
  ],
  remark: [
    { validator: (_r, v, cb) => {
        if (!v) return cb()
        const s = String(v)
        if (s.length > 100) return cb(new Error('备注长度不超过100'))
        cb()
      }, trigger: ['blur', 'change']
    }
  ]
})

const handleProfileEdit = (row: Account) => {
  profileForm.uid = row.uid
  profileForm.nickname = row.nickname || ''
  profileForm.telegram = row.telegram || ''
  profileForm.remark = row.remark || ''
  profileDialogVisible.value = true
}

const submitProfile = async () => {
  if (!profileFormRef.value) return
  await profileFormRef.value.validate(async (valid) => {
    if (!valid) return
    profileLoading.value = true
    try {
      await request.post('/web/account/profile', {
        uid: profileForm.uid,
        nickname: (profileForm.nickname || '').trim(),
        telegram: (profileForm.telegram || '').trim(),
        remark: (profileForm.remark || '').trim()
      })
      ElMessage.success('资料修改成功')
      profileDialogVisible.value = false
      fetchData()
    } catch (e) {
    } finally {
      profileLoading.value = false
    }
  })
}

// Status Logic
const handleStatusChange = (row: Account) => {
  const action = row.status === 1 ? '禁用' : '启用'
  const api = row.status === 1 ? '/web/account/disable' : '/web/account/enable'
  
  ElMessageBox.confirm(
    `确定要${action}该账户吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await request.post(api, { uid: row.uid })
      ElMessage.success(`${action}成功`)
      fetchData()
    } catch (error) {
      ElMessage.error(`${action}失败`)
    }
  })
}

// Balance Logic
const handleBalance = (row: Account) => {
  balanceForm.uid = row.uid
  balanceForm.amount = row.balance
  currentBalance.value = row.balance
  balanceDialogVisible.value = true
}

const submitBalance = async () => {
  if (!balanceFormRef.value) return
  await balanceFormRef.value.validate(async (valid) => {
    if (valid) {
      balanceLoading.value = true
      try {
      await request.post('/web/account/balance', balanceForm)
        ElMessage.success('修改余额成功')
        balanceDialogVisible.value = false
        fetchData()
      } catch (error) {
        // Error handled
      } finally {
        balanceLoading.value = false
      }
    }
  })
}

onMounted(() => {
  initFromQuery()
  checkMobile()
  window.addEventListener('resize', checkMobile)
  fetchData()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped lang="scss">
.page-container {
  /* Padding handled by MainLayout */
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .title {
      font-size: 18px;
      font-weight: 600;
      color: #1d2129;
    }

    .count-tag {
      font-weight: normal;
    }
  }
}

.filter-container {
  margin-bottom: 24px;
  background-color: #f7f8fa;
  padding: 16px;
  border-radius: 4px;

  :deep(.el-form-item) {
    margin-bottom: 0;
    margin-right: 24px;
  }
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.price {
  color: #ff7d00;
  font-family: 'Roboto', sans-serif;
}

.form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #86909c;
}

.text-bold {
  font-weight: 600;
}

.user-info {
  display: flex;
  align-items: center;
  
  span {
    font-weight: 500;
    color: #1d2129;
  }
}

/* Card Grid Styles */
.user-card {
  transition: all 0.3s;
  border: 1px solid #e5e6eb;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  .user-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    
    .user-main {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .user-avatar {
        background-color: #165dff;
        font-size: 16px;
        font-weight: 600;
      }
      
      .user-meta {
        .user-email {
          font-weight: 600;
          color: #1d2129;
          font-size: 14px;
          margin-bottom: 2px;
          max-width: 140px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .user-uid {
          font-size: 12px;
          color: #86909c;
        }
      }
    }
  }

  .user-card-body {
    background-color: #f7f8fa;
    border-radius: 4px;
    padding: 12px;
    margin-bottom: 16px;

    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 13px;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        color: #86909c;
      }

      .value {
        color: #1d2129;
        font-weight: 500;
      }
    }
  }

  .user-card-footer {
    display: flex;
    justify-content: space-between;
    border-top: 1px solid #f2f3f5;
    padding-top: 12px;
    margin-top: 12px;
    
    .el-button {
      padding: 4px 8px;
      height: 24px;
    }
  }
}

.op-group {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 0 4px;
  
  :deep(.el-button) {
    padding: 4px 10px;
    height: 26px;
    border-radius: 6px;
  }
}

@media screen and (max-width: 768px) {
  .filter-container {
    padding: 12px;
    
    :deep(.el-form-item) {
      margin-right: 0;
      margin-bottom: 12px;
      width: 100%;
      
      .el-form-item__content {
        width: 100%;
      }
    }
  }
}
</style>
