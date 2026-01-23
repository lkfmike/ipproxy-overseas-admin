<template>
  <div class="page-container">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">异步订单管理</span>
            <el-tag type="info" size="small" effect="plain" class="count-tag">共 {{ pagination.total }} 条数据</el-tag>
          </div>
        </div>
      </template>

      <div class="filter-container">
        <el-form :inline="true" :model="filterForm">
          <el-form-item label="归属用户">
            <el-select
              v-model="filterForm.uid"
              placeholder="搜索用户"
              filterable
              remote
              clearable
              :remote-method="searchUsers"
              :loading="userLoading"
              style="width: 240px"
            >
              <el-option
                v-for="item in userList"
                :key="item.uid"
                :label="item.email + ' (UID: ' + item.uid + ')'"
                :value="item.uid"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="订单号">
            <el-input v-model="filterForm.orderNo" placeholder="系统或供应商订单号" clearable style="width: 240px" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 180px">
              <el-option label="Pending" value="pending" />
              <el-option label="Processing" value="processing" />
              <el-option label="Completed" value="completed" />
              <el-option label="Failed" value="failed" />
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
          <el-table-column label="订单号" min-width="220">
            <template #default="scope">
              <div>System: {{ scope.row.systemOrderNo }}</div>
              <div v-if="scope.row.orderNo" class="text-xs text-gray">Vendor: {{ scope.row.orderNo }}</div>
            </template>
          </el-table-column>
          <el-table-column label="用户" min-width="180">
            <template #default="scope">
              <div>
                <div class="text-bold" :title="scope.row.email || '-'">{{ scope.row.email || '-' }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="价格/数量" min-width="160" align="right">
            <template #default="scope">
              <span class="price text-bold">${{ Number(scope.row.totalPrice || 0).toFixed(2) }}</span>
              <div class="text-xs text-gray">Unit: {{ scope.row.unitPrice }} x {{ scope.row.quantity }}</div>
            </template>
          </el-table-column>
          <el-table-column label="配置详情" min-width="220">
            <template #default="scope">
              <el-tag size="small" class="mr-1">{{ scope.row.protocol?.toUpperCase() }}</el-tag>
              <el-tag size="small" type="success" class="mr-1">{{ formatAsnType(scope.row.asnType) }}</el-tag>
              <el-tag size="small" type="warning" class="mr-1">{{ scope.row.quality }}</el-tag>
              <div class="mt-1 text-xs">
                <span v-if="scope.row.dedicatedLine">专线({{ scope.row.bandwidth }})</span>
                <span v-else>普通线路</span>
                <span class="ml-2">期限: {{ scope.row.period }}天</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="orderType" label="类型" width="110" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.orderType === 'purchase' ? 'success' : 'warning'">
                {{ scope.row.orderType }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="时间" min-width="200">
            <template #default="scope">
              <div>Created: {{ formatTime(scope.row.createdAt) }}</div>
              <div v-if="scope.row.finishTime" class="text-xs text-gray">Finish: {{ formatTime(scope.row.finishTime) }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120" align="center">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import request from '../../utils/request'
import dayjs from 'dayjs'

const loading = ref(false)
const userLoading = ref(false)
const userList = ref<any[]>([])
const tableData = ref<any[]>([])

const filterForm = reactive({
  uid: undefined as number | undefined,
  orderNo: '',
  status: ''
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
    if (query) {
      params.email = query
    }
    const res = await request.get('/account/list', { params })
    userList.value = res.data?.list || []
  } catch (error) {
  } finally {
    userLoading.value = false
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      uid: filterForm.uid,
      status: filterForm.status,
      orderNo: filterForm.orderNo
    }
    const res = await request.get('/async-order/list', { params })
    tableData.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (error) {
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const resetSearch = () => {
  filterForm.uid = undefined
  filterForm.orderNo = ''
  filterForm.status = ''
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

const formatTime = (time: string) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const getStatusType = (status: string) => {
  switch (status) {
    case 'completed': return 'success'
    case 'pending': return 'warning'
    case 'failed': return 'danger'
    default: return 'info'
  }
}

const formatAsnType = (val: string) => {
  if (!val) return '-'
  const t = val.toLowerCase()
  if (t === 'l4' || t === 'ispl4' || t === 'isp-l4') return '原生'
  if (t === 'l3' || t === 'ispl3' || t === 'isp-l3') return '普通'
  return val
}

onMounted(() => {
  fetchData()
  searchUsers('')
})
</script>

<style scoped lang="scss">
.page-container {
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

.text-bold {
  font-weight: 600;
}

.text-xs {
  font-size: 12px;
}

.text-gray {
  color: #909399;
}

.mr-1 {
  margin-right: 4px;
}

.mt-1 {
  margin-top: 4px;
}

.ml-2 {
  margin-left: 8px;
}
</style>
