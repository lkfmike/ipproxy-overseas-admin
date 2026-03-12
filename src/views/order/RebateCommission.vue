<template>
  <div class="page-container">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">返佣订单</span>
          </div>
          <div class="header-right">
            <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          </div>
        </div>
      </template>

      <div class="filter-container">
        <el-form :inline="true" :model="filterForm">
          <el-form-item label="订单号">
            <el-input v-model="filterForm.orderNo" placeholder="支持模糊搜索" clearable style="width: 220px" />
          </el-form-item>
          <el-form-item label="用户邮箱">
            <el-input v-model="filterForm.buyerEmail" placeholder="买家邮箱(支持模糊)" clearable style="width: 220px" />
          </el-form-item>
          <el-form-item label="上级邮箱">
            <el-input v-model="filterForm.parentEmail" placeholder="上级邮箱(支持模糊)" clearable style="width: 220px" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 160px">
              <el-option label="进行中" value="IN_PROGRESS" />
              <el-option label="已完成" value="COMPLETED" />
            </el-select>
          </el-form-item>
          <el-form-item label="创建时间">
            <el-date-picker
              v-model="filterForm.dates"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-form-item>
        </el-form>
      </div>

      <div v-loading="loading">
        <el-table :data="tableData" style="width: 100%" stripe border>
          <el-table-column prop="id" label="ID" width="80" align="center" />
          <el-table-column prop="orderNo" label="订单号" min-width="160" />
          <el-table-column prop="orderType" label="类型" width="120" align="center" />
          <el-table-column prop="buyerEmail" label="买家邮箱" min-width="200" />
          <el-table-column prop="parentEmail" label="上级邮箱" min-width="200" />
          <el-table-column label="订单总额(USD)" width="140" align="right">
            <template #default="scope">
              <span class="price text-bold">{{ Number(scope.row.orderTotalUsd || 0).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="折扣差额" width="120" align="center">
            <template #default="scope">
              <span class="price">{{ Number(scope.row.diff || 0).toFixed(4) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="买家折扣" width="120" align="center">
            <template #default="scope">
              <span class="price">{{ Number(scope.row.childDiscount || 0).toFixed(4) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="上级折扣" width="120" align="center">
            <template #default="scope">
              <span class="price">{{ Number(scope.row.parentDiscount || 0).toFixed(4) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="返佣金额(USD)" width="140" align="right">
            <template #default="scope">
              <span class="price text-bold">{{ Number(scope.row.amountUsd || 0).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120" align="center" />
          <el-table-column prop="levelIndex" label="层级" width="80" align="center" />
          <el-table-column prop="createdAt" label="创建时间" width="180" />
          <el-table-column prop="settleTime" label="结算时间" width="180" />
        </el-table>

        <div class="pagination">
          <el-pagination
            background
            layout="prev, pager, next, jumper, sizes, total"
            :total="pagination.total"
            :page-size="pagination.size"
            :current-page="pagination.page"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :page-sizes="[10, 20, 50, 100]"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import request from '../../utils/request'

const loading = ref(false)
const tableData = ref<any[]>([])
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const filterForm = reactive({
  orderNo: '',
  buyerEmail: '',
  parentEmail: '',
  status: '',
  dates: [] as string[] | []
})

const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      size: pagination.size
    }
    if (filterForm.orderNo) params.orderNo = filterForm.orderNo
    if (filterForm.buyerEmail) params.buyerEmail = filterForm.buyerEmail
    if (filterForm.parentEmail) params.parentEmail = filterForm.parentEmail
    if (filterForm.status) params.status = filterForm.status
    if (Array.isArray(filterForm.dates) && filterForm.dates.length === 2) {
      params.startTime = filterForm.dates[0]
      params.endTime = filterForm.dates[1]
    }
    const res = await request.get('/api/web/rebate-commission/list', { params })
    tableData.value = res.data?.list || []
    pagination.total = res.data?.total || 0
    pagination.page = res.data?.pageNum || pagination.page
    pagination.size = res.data?.pageSize || pagination.size
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const resetSearch = () => {
  filterForm.buyerEmail = ''
  filterForm.parentEmail = ''
  filterForm.status = ''
  filterForm.dates = []
  filterForm.orderNo = ''
  pagination.page = 1
  fetchData()
}

const handleSizeChange = (size: number) => {
  pagination.size = size
  fetchData()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.page-container { padding: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.title { font-size: 16px; font-weight: 600; }
.filter-container { margin-bottom: 12px; }
.price { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
.pagination { margin-top: 12px; display: flex; justify-content: flex-end; }
</style>
