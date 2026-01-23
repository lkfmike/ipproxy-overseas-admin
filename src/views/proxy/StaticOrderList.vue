<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">异步订单列表</h1>
        <p class="page-subtitle">查看所有异步订单记录</p>
      </div>
      <div class="header-right">
        <el-tooltip content="刷新数据" placement="bottom">
          <el-button :icon="Refresh" circle size="large" class="refresh-btn" @click="handleRefresh" :loading="loading" />
        </el-tooltip>
      </div>
    </div>

    <div class="main-content">
      <el-card class="filter-card" shadow="hover">
        <el-form :model="filterForm" class="filter-form" label-position="top">
          <el-row :gutter="24">
            <el-col :xs="24" :sm="12" :md="6" :lg="6">
              <el-form-item label="归属用户">
                <el-select
                  v-model="filterForm.uid"
                  placeholder="搜索用户"
                  filterable
                  remote
                  clearable
                  :remote-method="searchUsers"
                  :loading="userLoading"
                  class="filter-select"
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
            </el-col>
            <el-col :xs="24" :sm="12" :md="6" :lg="6">
              <el-form-item label="订单号">
                <el-input v-model="filterForm.orderNo" placeholder="供应商订单号" clearable />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6" :lg="6">
              <el-form-item label="订单状态">
                <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 100%">
                  <el-option label="Pending" value="pending" />
                  <el-option label="Processing" value="processing" />
                  <el-option label="Completed" value="completed" />
                  <el-option label="Failed" value="failed" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="6" :lg="6" class="filter-actions">
              <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
              <el-button :icon="RefreshLeft" @click="resetSearch">重置</el-button>
            </el-col>
          </el-row>
        </el-form>
      </el-card>

      <el-card class="table-card" shadow="hover" :body-style="{ padding: '0' }">
        <el-table :data="tableData" style="width: 100%" v-loading="loading">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column label="订单号" width="200">
            <template #default="scope">
              <div>System: {{ scope.row.systemOrderNo }}</div>
              <div v-if="scope.row.orderNo" class="text-xs text-gray">Vendor: {{ scope.row.orderNo }}</div>
            </template>
          </el-table-column>
          <el-table-column label="用户" width="200">
            <template #default="scope">
              <div>{{ scope.row.email }}</div>
              <div class="text-xs text-gray">UID: {{ scope.row.uid }}</div>
            </template>
          </el-table-column>
          <el-table-column label="价格/数量" width="150">
            <template #default="scope">
              <div>Total: {{ scope.row.totalPrice }}</div>
              <div class="text-xs text-gray">Unit: {{ scope.row.unitPrice }} x {{ scope.row.quantity }}</div>
            </template>
          </el-table-column>
          <el-table-column label="配置详情" min-width="200">
            <template #default="scope">
              <el-tag size="small" class="mr-1">{{ scope.row.protocol }}</el-tag>
              <el-tag size="small" type="success" class="mr-1">{{ scope.row.asnType }}</el-tag>
              <el-tag size="small" type="warning" class="mr-1">{{ scope.row.quality }}</el-tag>
              <div class="mt-1 text-xs">
                <span v-if="scope.row.dedicatedLine">专线({{ scope.row.bandwidth }})</span>
                <span v-else>普通线路</span>
                <span class="ml-2">期限: {{ scope.row.period }}天</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="orderType" label="类型" width="100">
             <template #default="scope">
                <el-tag :type="scope.row.orderType === 'purchase' ? 'success' : 'warning'">
                  {{ scope.row.orderType }}
                </el-tag>
             </template>
          </el-table-column>
          <el-table-column label="时间" width="180">
            <template #default="scope">
              <div>Created: {{ formatTime(scope.row.createdAt) }}</div>
              <div v-if="scope.row.finishTime" class="text-xs text-gray">Finish: {{ formatTime(scope.row.finishTime) }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.size"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh, RefreshLeft } from '@element-plus/icons-vue'
import request from '../../utils/request'
import dayjs from 'dayjs'

const loading = ref(false)
const userLoading = ref(false)
const userList = ref<any[]>([])
const tableData = ref([])

const filterForm = reactive({
  uid: undefined,
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
    console.error('Search user error', error)
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
      orderNo: filterForm.orderNo,
      status: filterForm.status
    }
    const res = await request.get('/async-order/list', { params })
    tableData.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    console.error('Fetch data error', error)
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

const handleRefresh = () => {
  fetchData()
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

onMounted(() => {
  fetchData()
  searchUsers('') // Load initial user list
})
</script>

<style scoped>
.page-container {
  padding: 24px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}
.page-subtitle {
  color: #909399;
  margin: 8px 0 0;
}
.filter-card {
  margin-bottom: 24px;
}
.pagination-container {
  padding: 16px;
  display: flex;
  justify-content: flex-end;
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
