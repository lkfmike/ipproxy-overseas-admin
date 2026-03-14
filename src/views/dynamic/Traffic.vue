<template>
  <div class="page-container">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">流量消耗明细</span>
          </div>
          <div class="header-right">
            <el-form :inline="true" :model="queryParams" class="demo-form-inline">
              <el-form-item label="邮箱">
                <el-input v-model="queryParams.email" placeholder="请输入邮箱" clearable @keyup.enter="handleQuery" />
              </el-form-item>
              <el-form-item label="日期范围">
                <el-date-picker
                  v-model="dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                  :shortcuts="shortcuts"
                  @change="handleQuery"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :icon="Search" @click="handleQuery">查询</el-button>
                <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </template>
      
      <div v-loading="loading">
        <el-table :data="tableData" border style="width: 100%" stripe>
          <el-table-column prop="email" label="用户邮箱" min-width="180" show-overflow-tooltip />
          <el-table-column prop="hostname" label="主机名" min-width="150" show-overflow-tooltip />
          <el-table-column prop="upLink" label="上行流量" min-width="120">
              <template #default="scope">
                  {{ formatTraffic(scope.row.upLink) }}
              </template>
          </el-table-column>
          <el-table-column prop="downLink" label="下行流量" min-width="120">
              <template #default="scope">
                  {{ formatTraffic(scope.row.downLink) }}
              </template>
          </el-table-column>
          <el-table-column prop="link" label="总流量" min-width="120">
              <template #default="scope">
                  {{ formatTraffic(scope.row.link) }}
              </template>
          </el-table-column>
          <el-table-column prop="recordDate" label="记录日期" min-width="120" />
          <el-table-column prop="createTime" label="创建时间" min-width="160">
             <template #default="scope">
                  {{ formatTime(scope.row.createTime) }}
              </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container">
          <el-pagination
            v-model:current-page="queryParams.page"
            v-model:page-size="queryParams.size"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import request from '../../utils/request'

const loading = ref(false)
const total = ref(0)
const dateRange = ref<string[]>([])
const tableData = ref([])

const queryParams = reactive({
  page: 1,
  size: 10,
  email: '',
  startDate: '',
  endDate: ''
})

const shortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    },
  },
  {
    text: '最近一个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    },
  },
  {
    text: '最近三个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      return [start, end]
    },
  },
]

const formatTraffic = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
    return size + ' ' + sizes[i];
}

const formatTime = (time: string) => {
    if (!time) return '-';
    return time.replace('T', ' ').substring(0, 19);
}

const fetchData = async () => {
  loading.value = true
  try {
    if (dateRange.value && dateRange.value.length === 2) {
        queryParams.startDate = dateRange.value[0]
        queryParams.endDate = dateRange.value[1]
    } else {
        queryParams.startDate = ''
        queryParams.endDate = ''
    }
    
    const res: any = await request.post('/api/web/dynamic/trafficList', queryParams)
    if (res.code === 200) {
      tableData.value = res.data.list
      total.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.page = 1
  fetchData()
}

const resetQuery = () => {
  queryParams.email = ''
  setDefaultDateRange()
  handleQuery()
}

const handleSizeChange = (val: number) => {
  queryParams.size = val
  fetchData()
}

const handleCurrentChange = (val: number) => {
  queryParams.page = val
  fetchData()
}

const setDefaultDateRange = () => {
    const end = new Date()
    const start = new Date()
    start.setMonth(start.getMonth() - 1)
    
    const formatDate = (date: Date) => {
        const y = date.getFullYear()
        const m = String(date.getMonth() + 1).padStart(2, '0')
        const d = String(date.getDate()).padStart(2, '0')
        return `${y}-${m}-${d}`
    }
    
    dateRange.value = [formatDate(start), formatDate(end)]
}

onMounted(() => {
  setDefaultDateRange()
  fetchData()
})
</script>

<style scoped lang="scss">
.page-container {
  padding: 20px;
  .box-card {
    min-height: calc(100vh - 120px);
  }
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  .header-left {
    display: flex;
    flex-direction: column;
    .title {
      font-size: 18px;
      font-weight: bold;
      color: #303133;
    }
  }
  .header-right {
    display: flex;
    align-items: center;
  }
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
