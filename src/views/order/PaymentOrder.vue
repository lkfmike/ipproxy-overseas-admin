<template>
  <div class="page-container">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">充值订单</span>
          </div>
          <div class="header-right">
            <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button type="success" @click="openManual">手动充值</el-button>
          </div>
        </div>
      </template>

      <div class="filter-container">
        <el-form :inline="true" :model="filterForm">
          <el-form-item label="邮箱">
            <el-input v-model="filterForm.email" placeholder="用户邮箱(支持模糊)" clearable style="width: 240px" />
          </el-form-item>
          <el-form-item label="订单号">
            <el-input v-model="filterForm.outTradeNo" placeholder="商户订单号" clearable style="width: 220px" />
          </el-form-item>
          <el-form-item label="支付方式">
            <el-select v-model="filterForm.type" placeholder="全部" clearable style="width: 160px">
              <el-option label="支付宝" value="alipay" />
              <el-option label="微信" value="wxpay" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 160px">
              <el-option label="PENDING" value="PENDING" />
              <el-option label="TRADE_SUCCESS" value="TRADE_SUCCESS" />
              <el-option label="FAILED" value="FAILED" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <div v-loading="loading">
        <el-table :data="tableData" style="width: 100%" stripe border>
          <el-table-column prop="id" label="ID" width="80" align="center" />
          <el-table-column prop="email" label="邮箱" min-width="200" />
          <el-table-column prop="outTradeNo" label="商户订单号" min-width="180" />
          <el-table-column prop="type" label="支付方式" width="120" align="center" />
          <el-table-column label="美元金额" width="120" align="right">
            <template #default="scope">
              <span class="price text-bold">{{ Number(scope.row.amountUsd || 0).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="人民币金额" width="120" align="right">
            <template #default="scope">
              <span class="price text-bold">{{ Number(scope.row.amountCny || 0).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="赠送(USD)" width="120" align="right">
            <template #default="scope">
              <span class="price">{{ Number(scope.row.giftUsd || 0).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="140" align="center">
            <template #default="scope">
              <el-tag size="small" :type="formatStatusTag(scope.row.status)">{{ scope.row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="tradeNo" label="平台订单号" min-width="160" />
          <el-table-column prop="createdAt" label="创建时间" width="180" />
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
    <el-dialog v-model="manualVisible" title="手动充值" width="480px">
      <el-form :model="manualForm" label-width="100px">
        <el-form-item label="邮箱">
          <el-input v-model="manualForm.email" placeholder="用户邮箱" />
        </el-form-item>
        <el-form-item label="充值(USD)">
          <el-input v-model="manualForm.amountUsd" placeholder="美元金额" />
        </el-form-item>
        <el-form-item label="赠送(USD)">
          <el-input v-model="manualForm.giftUsd" placeholder="赠送美元" />
        </el-form-item>
        <el-form-item label="支付类型">
          <el-select v-model="manualForm.type" style="width: 200px">
            <el-option label="后台" value="backed" />
            <el-option label="支付宝" value="alipay" />
            <el-option label="微信" value="wxpay" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="manualVisible = false">取消</el-button>
        <el-button type="primary" @click="submitManual">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, watch, onActivated } from 'vue'
import { useRoute } from 'vue-router'
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
  email: '',
  outTradeNo: '',
  type: '',
  status: ''
})

const formatStatusTag = (status: string) => {
  if (status === 'TRADE_SUCCESS') return 'success'
  if (status === 'FAILED') return 'danger'
  return 'info'
}

const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      size: pagination.size
    }
    if (filterForm.email) params.email = filterForm.email
    if (filterForm.outTradeNo) params.outTradeNo = filterForm.outTradeNo
    if (filterForm.type) params.type = filterForm.type
    if (filterForm.status) params.status = filterForm.status
    const res = await request.get('/api/web/payment-order/list', { params })
    tableData.value = res.data?.list || []
    pagination.total = res.data?.total || 0
    pagination.page = res.data?.pageNum || pagination.page
    pagination.size = res.data?.pageSize || pagination.size
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
  filterForm.email = ''
  filterForm.outTradeNo = ''
  filterForm.type = ''
  filterForm.status = ''
  pagination.page = 1
  fetchData()
}

// 手动充值
const manualForm = reactive({
  email: '',
  amountUsd: '',
  giftUsd: '',
  type: 'backed'
})
const manualVisible = ref(false)
const openManual = () => {
  manualForm.email = ''
  manualForm.amountUsd = ''
  manualForm.giftUsd = ''
  manualForm.type = 'backed'
  manualVisible.value = true
}
const submitManual = async () => {
  try {
    const payload: any = {
      email: manualForm.email,
      amountUsd: Number(manualForm.amountUsd || 0),
      giftUsd: Number(manualForm.giftUsd || 0),
      type: manualForm.type
    }
    await request.post('/api/web/payment-order/manual-recharge', payload)
    manualVisible.value = false
    fetchData()
  } catch (e) {
    console.error(e)
  }
}

const handleSizeChange = (size: number) => {
  pagination.size = size
  fetchData()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchData()
}

const route = useRoute()
onMounted(() => {
  fetchData()
})
onActivated(() => {
  fetchData()
})
watch(() => route.fullPath, (p) => {
  if (p.includes('/order/payment')) {
    fetchData()
  }
})
</script>

<style scoped>
.page-container {
  padding: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title {
  font-size: 16px;
  font-weight: 600;
}
.filter-container {
  margin-bottom: 12px;
}
.price {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
.pagination {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>
