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
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="tableData" style="width: 100%" v-loading="loading" stripe border>
        <el-table-column prop="uid" label="UID" width="80" align="center" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="telegram" label="Telegram" min-width="120" />
        <el-table-column prop="inviteCode" label="邀请码" width="100" align="center" />
        <el-table-column prop="balance" label="余额" min-width="120" align="right">
          <template #default="scope">
            <span class="price">${{ Number(scope.row.balance || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" size="small" effect="light">
              {{ scope.row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="注册时间" min-width="160" align="center">
           <template #default="scope">
              {{ formatDate(scope.row.createdAt) }}
           </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleDetail(scope.row)">详情</el-button>
            <el-divider direction="vertical" />
            <el-button link type="primary" size="small" @click="handleBalance(scope.row)">余额</el-button>
            <el-divider direction="vertical" />
            <el-button 
              link 
              :type="scope.row.status === 1 ? 'danger' : 'success'" 
              size="small" 
              @click="handleStatusChange(scope.row)"
            >
              {{ scope.row.status === 1 ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

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
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="createForm.password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="Telegram" prop="telegram">
          <el-input v-model="createForm.telegram" placeholder="请输入Telegram账号" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="createForm.remark" type="textarea" placeholder="请输入备注" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCreate" :loading="createLoading">确定</el-button>
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

    <!-- Details Dialog -->
    <el-dialog v-model="detailsDialogVisible" title="用户详情" width="600px" destroy-on-close>
      <el-descriptions :column="1" border v-if="currentAccount">
        <el-descriptions-item label="UID">{{ currentAccount.uid }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ currentAccount.email }}</el-descriptions-item>
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
import { ref, reactive, onMounted } from 'vue'
import { Plus, Search, Refresh, DocumentCopy } from '@element-plus/icons-vue'
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
}

const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const tableData = ref<Account[]>([])

const filterForm = reactive({
  email: ''
})

// Create Dialog
const createDialogVisible = ref(false)
const createLoading = ref(false)
const createFormRef = ref<FormInstance>()
const createForm = reactive({
  email: '',
  password: '',
  telegram: '',
  remark: ''
})
const createRules = reactive<FormRules>({
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
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
    { required: true, message: '请输入金额', trigger: 'blur' }
  ]
})

// Details Dialog
const detailsDialogVisible = ref(false)
const currentAccount = ref<Account | null>(null)

const handleDetail = (row: Account) => {
  currentAccount.value = row
  detailsDialogVisible.value = true
}

const copyToken = (token: string) => {
  if (!token) return
  navigator.clipboard.writeText(token).then(() => {
    ElMessage.success('复制成功')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString()
}

const fetchData = async () => {
  loading.value = true
  try {
    const res: any = await request.get('/account/list', {
      params: {
        page: currentPage.value,
        size: pageSize.value,
        email: filterForm.email
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

const handleSearch = () => {
  currentPage.value = 1
  fetchData()
}

const handleReset = () => {
  filterForm.email = ''
  handleSearch()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchData()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchData()
}

// Create Logic
const handleCreate = () => {
  createForm.email = ''
  createForm.password = ''
  createForm.telegram = ''
  createForm.remark = ''
  createDialogVisible.value = true
}

const submitCreate = async () => {
  if (!createFormRef.value) return
  await createFormRef.value.validate(async (valid) => {
    if (valid) {
      createLoading.value = true
      try {
        await request.post('/account/create', createForm)
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

// Status Logic
const handleStatusChange = (row: Account) => {
  const action = row.status === 1 ? '禁用' : '启用'
  const api = row.status === 1 ? '/account/disable' : '/account/enable'
  
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
      // Error handled
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
        await request.post('/account/balance', balanceForm)
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
  fetchData()
})
</script>

<style scoped>
.page-container {
  /* Padding handled by MainLayout */
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
}

.filter-container {
  margin-bottom: 24px;
  padding: 24px;
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid #e5e6eb;
}

.demo-form-inline {
  margin-bottom: 0;
}

.price {
  color: #f53f3f;
  font-weight: 600;
  font-family: 'Helvetica Neue', sans-serif;
}

.price-text {
  font-weight: 600;
  font-size: 16px;
  color: #1d2129;
}

.pagination-container {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}
</style>
