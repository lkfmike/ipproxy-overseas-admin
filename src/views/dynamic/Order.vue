<template>
  <div class="page-container">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">订单管理</span>
            <el-tag type="info" size="small" effect="plain" class="count-tag">共 {{ pagination.total }} 条</el-tag>
          </div>
          <div class="header-right">
            <el-button type="primary" :icon="Plus" @click="openCreate">新增订单</el-button>
          </div>
        </div>
      </template>

      <div class="filter-container">
        <el-form :inline="true" :model="filterForm">
          <el-form-item label="归属用户">
            <el-select
              v-model="filterForm.accountId"
              placeholder="选择用户"
              filterable
              remote
              clearable
              :remote-method="searchUsers"
              :loading="userLoading"
              style="width: 280px"
            >
              <el-option
                v-for="item in userList"
                :key="item.uid"
                :label="item.email"
                :value="item.uid"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="订单号">
            <el-input v-model="filterForm.orderNo" placeholder="订单号" clearable style="width: 200px" />
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="filterForm.type" placeholder="全部" clearable style="width: 160px">
              <el-option label="动态住宅" value="residential" />
              <el-option label="移动代理" value="mobile" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 160px">
              <el-option label="待支付" value="pending" />
              <el-option label="已支付" value="paid" />
              <el-option label="已取消" value="cancelled" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div v-loading="loading">
        <el-table :data="tableData" style="width: 100%" stripe border>
          <el-table-column prop="id" label="ID" width="80" align="center" />
          <el-table-column prop="orderNo" label="订单号" min-width="180" />
          
          <el-table-column label="用户邮箱" min-width="180" align="center">
            <template #default="scope">
              <span :title="getUserEmail(scope.row.accountId)">{{ getUserEmail(scope.row.accountId) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="类型" width="120" align="center">
            <template #default="scope">
              <el-tag size="small" :type="scope.row.type === 'residential' ? 'success' : 'warning'">
                {{ formatType(scope.row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="已用/剩余(GB)" width="180" align="center">
            <template #default="scope">
              <div class="traffic-cell">
                <span class="font-mono">{{ formatUsedRemaining(scope.row) }}</span>
                <el-progress :percentage="calcPercent(scope.row)" :stroke-width="4" style="width:120px" />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="金额" width="120" align="right">
            <template #default="scope">
              <span class="price text-bold">${{ Number(scope.row.amount || 0).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="startTime" label="开始时间" min-width="180">
            <template #default="scope">
              <span class="font-mono">{{ formatTime(scope.row.startTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="到期时间" width="180" align="center">
            <template #default="scope">
              <span class="font-mono">{{ formatTime(scope.row.expireTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="200" align="center">
            <template #default="scope">
              <div style="display:inline-flex;gap:8px;align-items:center">
                <el-tag :type="scope.row.isExpired ? 'danger' : 'success'" size="small">
                  {{ scope.row.isExpired ? '已过期' : '未过期' }}
                </el-tag>
                <el-tag :type="scope.row.isExhausted ? 'warning' : 'success'" size="small">
                  {{ scope.row.isExhausted ? '已用完' : '未用完' }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right" align="center">
            <template #default="scope">
              <el-dropdown @command="onDropdownCommand($event, scope.row)">
                <el-button link type="primary">更多</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="detail">详情</el-dropdown-item>
                    <el-dropdown-item command="markPaid">标记为已支付</el-dropdown-item>
                    <el-dropdown-item command="markCancelled">取消订单</el-dropdown-item>
                    <el-dropdown-item command="extend">延长有效期</el-dropdown-item>
                    <el-dropdown-item command="expire">设置为过期</el-dropdown-item>
                    <el-dropdown-item command="delete">删除订单</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          background
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" title="新增订单" width="620px" destroy-on-close>
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px" label-position="left">
        <el-form-item label="归属用户" prop="accountId">
          <el-select
            v-model="formData.accountId"
            placeholder="选择用户"
            filterable
            remote
            clearable
            :remote-method="searchUsers"
            :loading="userLoading"
            style="width: 100%"
          >
            <el-option
              v-for="item in userList"
              :key="item.uid"
              :label="item.email + ' (UID: ' + item.uid + ')'"
              :value="item.uid"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="购买类型" prop="purchaseMode">
          <el-radio-group v-model="formData.purchaseMode">
            <el-radio label="meal">套餐</el-radio>
            <el-radio label="manual">手动</el-radio>
          </el-radio-group>
        </el-form-item>
        <template v-if="formData.purchaseMode === 'meal'">
          <el-form-item label="套餐类型" prop="type">
            <el-select v-model="formData.type" placeholder="请选择类型" style="width: 100%" @change="loadMeals" :disabled="true">
              <el-option v-if="selectedAccountType === 'residential'" label="动态住宅" value="residential" />
              <el-option v-if="selectedAccountType === 'mobile'" label="移动代理" value="mobile" />
            </el-select>
          </el-form-item>
          <el-form-item label="选择套餐" prop="mealId">
            <el-select v-model="formData.mealId" placeholder="请选择套餐" filterable style="width: 100%">
              <el-option
                v-for="item in mealList"
                :key="item.id"
                :label="item.name + ' (' + item.traffic + 'GB / $' + item.price + ')'"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="数量" prop="quantity">
            <el-input-number v-model="formData.quantity" :min="1" :step="1" style="width: 100%" controls-position="right" />
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="类型" prop="type">
            <el-select v-model="formData.type" placeholder="请选择类型" style="width: 100%" :disabled="true">
              <el-option v-if="selectedAccountType === 'residential'" label="动态住宅" value="residential" />
              <el-option v-if="selectedAccountType === 'mobile'" label="移动代理" value="mobile" />
            </el-select>
          </el-form-item>
          <el-form-item label="总流量(GB)" prop="totalTraffic">
            <el-input-number v-model="formData.totalTraffic" :precision="2" :step="1.0" style="width: 100%" controls-position="right" />
          </el-form-item>
          <el-form-item label="金额" prop="amount">
            <el-input-number v-model="formData.amount" :precision="2" :step="1.0" style="width: 100%" controls-position="right" />
          </el-form-item>
          <el-form-item label="有效期(天)" prop="durationDays">
            <el-input-number v-model="formData.durationDays" :min="0" :step="1" style="width: 100%" controls-position="right" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <el-dialog v-model="detailsDialogVisible" title="订单详情" width="700px" destroy-on-close>
    <el-descriptions :column="2" border v-if="currentOrder">
        <el-descriptions-item label="订单号">{{ currentOrder.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="用户邮箱">{{ getUserEmail(currentOrder.accountId) }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ formatType(currentOrder.type) }}</el-descriptions-item>
        <el-descriptions-item label="数量">{{ currentOrder.quantity }}</el-descriptions-item>
        <el-descriptions-item label="金额">${{ Number(currentOrder.amount || 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="总流量(GB)">{{ Number(currentOrder.totalTraffic || 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="已用/剩余(GB)">{{ Number(currentOrder.usedTraffic || 0).toFixed(2) }} / {{ Number(currentOrder.remainingTraffic || 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ formatStatus(currentOrder.status) }}</el-descriptions-item>
        <el-descriptions-item label="到期状态">{{ currentOrder.isExpired ? '已过期' : '未过期' }}</el-descriptions-item>
        <el-descriptions-item label="用完状态">{{ currentOrder.isExhausted ? '已用完' : '未用完' }}</el-descriptions-item>
        <el-descriptions-item label="开始时间"><span class="font-mono">{{ formatTime(currentOrder.startTime) }}</span></el-descriptions-item>
        <el-descriptions-item label="过期时间"><span class="font-mono">{{ formatTime(currentOrder.expireTime) }}</span></el-descriptions-item>
        <el-descriptions-item label="创建时间"><span class="font-mono">{{ formatTime(currentOrder.createdAt) }}</span></el-descriptions-item>
        <el-descriptions-item label="更新时间"><span class="font-mono">{{ formatTime(currentOrder.updatedAt) }}</span></el-descriptions-item>
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
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import request from '../../utils/request'
import dayjs from 'dayjs'

const loading = ref(false)
const userLoading = ref(false)
const tableData = ref<any[]>([])
const userList = ref<any[]>([])
const mealList = ref<any[]>([])

const filterForm = reactive({
  accountId: undefined as number | undefined,
  status: '',
  type: '',
  orderNo: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const searchUsers = async (query: string) => {
  userLoading.value = true
  try {
    const params: any = {
      page: 1,
      size: 100000
    }
    if (query) params.email = query
    const res = await request.get('/web/account/list', { params })
    userList.value = res.data?.list || []
  } catch (e) {
  } finally {
    userLoading.value = false
  }
}

const selectedAccountType = computed(() => {
  const uid = formData.accountId ?? filterForm.accountId
  if (!uid) return ''
  const found = userList.value.find((u: any) => u.uid === uid)
  return found?.proxyType || ''
})

const loadMeals = async () => {
  try {
    const params: any = { page: 1, size: 1000 }
    const type = selectedAccountType.value || formData.type
    if (type) params.type = type
    const res = await request.get('/web/dynamic-proxy-meal/list', { params })
    mealList.value = res.data?.list || []
  } catch (e) {}
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      accountId: filterForm.accountId,
      status: filterForm.status || undefined,
      type: filterForm.type || undefined,
      orderNo: filterForm.orderNo || undefined
    }
    const res = await request.get('/web/dynamic-proxy-order/list', { params })
    tableData.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (e) {
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const resetSearch = () => {
  filterForm.accountId = undefined
  filterForm.status = ''
  filterForm.type = ''
  filterForm.orderNo = ''
  handleSearch()
}

const handleSizeChange = (val: number) => {
  pagination.size = val
  fetchData()
}

const handleCurrentChange = (val: number) => {
  pagination.page = val
  fetchData()
}

const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()
const formData = reactive({
  accountId: undefined as number | undefined,
  purchaseMode: 'meal',
  mealId: undefined as number | undefined,
  type: '',
  quantity: 1,
  totalTraffic: 0,
  amount: 0,
  durationDays: 0
})

const rules = reactive<FormRules>({
  accountId: [{ required: true, message: '请选择用户', trigger: 'blur' }],
  purchaseMode: [{ required: true, message: '请选择购买类型', trigger: 'change' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }]
})

const openCreate = () => {
  Object.assign(formData, {
    accountId: filterForm.accountId,
    purchaseMode: 'meal',
    mealId: undefined,
    type: selectedAccountType.value || '',
    quantity: 1,
    totalTraffic: 0,
    amount: 0,
    durationDays: 0
  })
  dialogVisible.value = true
  loadMeals()
}

watch(() => formData.accountId, () => {
  formData.type = selectedAccountType.value || ''
  loadMeals()
})

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    try {
      const payload: any = {
        accountId: formData.accountId,
        type: formData.type || undefined,
        quantity: formData.quantity || 1
      }
      if (formData.purchaseMode === 'meal') {
        payload.mealId = formData.mealId
        if (!payload.mealId) {
          ElMessage.warning('请选择套餐')
          submitLoading.value = false
          return
        }
      } else {
        payload.totalTraffic = formData.totalTraffic
        payload.amount = formData.amount
        payload.durationDays = formData.durationDays
      }
      await request.post('/web/dynamic-proxy-order/create', payload)
      ElMessage.success('创建成功')
      dialogVisible.value = false
      fetchData()
    } catch (e) {
    } finally {
      submitLoading.value = false
    }
  })
}

const handleCommand = async (cmd: string, row: any) => {
  try {
    if (cmd === 'markPaid') {
      await request.post('/web/dynamic-proxy-order/update-status', { id: row.id, status: 'paid' })
      ElMessage.success('已标记为已支付')
    } else if (cmd === 'markCancelled') {
      await request.post('/web/dynamic-proxy-order/update-status', { id: row.id, status: 'cancelled' })
      ElMessage.success('已取消订单')
    } else if (cmd === 'extend') {
      const { value } = await ElMessageBox.prompt('请输入需要延长的天数', '延长有效期', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /^\d+$/,
        inputErrorMessage: '请输入正整数天数'
      }) as any
      const days = Number(value)
      if (isNaN(days) || days <= 0) return
      await request.post('/web/dynamic-proxy-order/extend', { id: row.id, days })
      ElMessage.success('已延长有效期')
    } else if (cmd === 'expire') {
      await ElMessageBox.confirm('确定将该订单设置为过期吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await request.post('/web/dynamic-proxy-order/expire', { id: row.id })
      ElMessage.success('已标记为过期')
    } else if (cmd === 'detail') {
      openDetails(row)
    } else if (cmd === 'delete') {
      if (row.status !== 'cancelled') {
        ElMessage.warning('仅可删除已取消的订单')
        return
      }
      await ElMessageBox.confirm('确定删除该订单吗？此操作不可恢复', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await request.post('/web/dynamic-proxy-order/delete', { id: row.id })
      ElMessage.success('删除成功')
    }
    fetchData()
  } catch (e) {
  }
}

// 删除操作已禁用

const formatType = (val?: string) => {
  if (!val) return '-'
  return val === 'residential' ? '动态住宅' : '移动代理'
}

const formatStatus = (val?: string) => {
  if (!val) return '-'
  if (val === 'pending') return '待支付'
  if (val === 'paid') return '已支付'
  if (val === 'cancelled') return '已取消'
  return val
}

const formatTime = (time: string) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const calcPercent = (row: any) => {
  const used = Number(row.usedTraffic || 0)
  const remaining = Number(row.remainingTraffic || 0)
  let total = Number(row.totalTraffic ?? used + remaining)
  if (!isFinite(total) || total <= 0) return 0
  const p = (used / total) * 100
  return Math.max(0, Math.min(100, Number(p.toFixed(2))))
}

const formatUsedRemaining = (row: any) => {
  const used = Number(row.usedTraffic || 0).toFixed(2)
  const remaining = Number(row.remainingTraffic || 0).toFixed(2)
  return `${used} / ${remaining} GB`
}
const onDropdownCommand = (cmd: string, row: any) => {
  handleCommand(cmd, row)
}
const getUserEmail = (uid?: number) => {
  if (!uid) return '-'
  const u = userList.value.find((x: any) => x.uid === uid)
  return u?.email || '-'
}

onMounted(() => {
  fetchData()
  searchUsers('')
})

// Details Dialog
const detailsDialogVisible = ref(false)
const currentOrder = ref<any | null>(null)
const openDetails = (row: any) => {
  currentOrder.value = row
  detailsDialogVisible.value = true
}

</script>

<style scoped lang="scss">
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

.text-bold {
  font-weight: 600;
}

.font-mono {
  font-family: 'Roboto Mono', monospace;
}
.traffic-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-direction: column;
  padding: 2px 0;
  line-height: 1.1;
  font-size: 12px;
}
</style>
