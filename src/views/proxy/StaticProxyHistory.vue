<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">网关列表</h1>
        <p class="page-subtitle">与网关列表一致样式，仅展示已释放记录</p>
      </div>
      <div class="header-right">
      </div>
    </div>

    <div class="main-content">
      <el-card class="filter-card" shadow="hover">
        <el-form :model="filterForm" class="filter-form" label-position="top">
          <el-row :gutter="24">
            <el-col :xs="24" :sm="12" :md="6" :lg="4">
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
                >
                  <template #prefix>
                    <el-icon><User /></el-icon>
                  </template>
                  <el-option
                    v-for="item in userList"
                    :key="item.uid"
                    :label="item.email"
                    :value="item.uid"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6" :lg="4">
              <el-form-item label="地区筛选">
                <el-input v-model="filterForm.area" placeholder="地区代码" clearable :prefix-icon="Location" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6" :lg="4">
              <el-form-item label="IP地址">
                <el-input v-model="filterForm.ip" placeholder="输入IP" clearable :prefix-icon="Connection" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6" :lg="4">
              <el-form-item label="备注">
                <el-input v-model="filterForm.remark" placeholder="输入备注" clearable :prefix-icon="Edit" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="4" class="filter-actions">
              <el-button type="primary" :icon="Search" @click="handleSearch" class="action-btn">查询</el-button>
              <el-button :icon="RefreshLeft" @click="resetSearch" class="action-btn reset">重置</el-button>
            </el-col>
          </el-row>
        </el-form>
      </el-card>

      <el-card class="table-card" shadow="hover" :body-style="{ padding: '0' }">
        <el-table 
          :data="tableData" 
          style="width: 100%" 
          v-loading="loading" 
          :header-cell-style="headerCellStyle"
          :row-class-name="tableRowClassName"
        >
          <el-table-column prop="ip" label="出口IP" width="160">
            <template #default="scope">
              <div class="info-cell">
                <span class="info-text font-mono">{{ scope.row.ip }}</span>
                <el-tooltip content="复制IP" placement="top">
                  <el-icon class="copy-btn" @click.stop="copyToClipboard(scope.row.ip)">
                    <CopyDocument />
                  </el-icon>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="protocol" label="协议" width="100" align="center">
            <template #default="scope">
              <el-tag effect="light" round size="small">
                {{ scope.row.protocol ? scope.row.protocol.toUpperCase() : 'UNKNOWN' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="地区" min-width="120">
            <template #default="scope">
              <div class="region-inline">
                <span class="font-mono">{{ scope.row.area }}</span>
                <span v-if="scope.row.region" class="separator"> / </span>
                <span v-if="scope.row.region" class="text-xs text-gray">{{ scope.row.region }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="类型/质量" width="130" align="center">
            <template #default="scope">
              <el-tag effect="plain" type="info" size="small" class="mini-tag">{{ formatAsnType(scope.row.asnType) }}</el-tag>
              <span class="quality-text">{{ scope.row.quality }}</span>
            </template>
          </el-table-column>
          <el-table-column label="归属用户" min-width="160" class-name="hidden-xs-only">
            <template #default="scope">
              <div v-if="scope.row.uid">
                <div class="email text-truncate" :title="scope.row.email">{{ scope.row.email }}</div>
              </div>
              <span v-else class="empty-text">未分配</span>
            </template>
          </el-table-column>
          <el-table-column label="到期时间" width="160" class-name="hidden-xs-only">
            <template #default="scope">
              <span class="font-mono">{{ formatTime(scope.row.expireTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="删除时间" width="160" class-name="hidden-xs-only">
            <template #default="scope">
              <span class="font-mono">{{ formatTime(scope.row.createdAt) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
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
import { Search, RefreshLeft, CopyDocument, User, Location, Connection, Edit } from '@element-plus/icons-vue'
import request from '../../utils/request'
import dayjs from 'dayjs'

const loading = ref(false)
const userLoading = ref(false)
const userList = ref<any[]>([])
const tableData = ref([])

const filterForm = reactive({
  uid: undefined,
  ip: '',
  area: '',
  remark: ''
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
      ip: filterForm.ip,
      area: filterForm.area,
      remark: filterForm.remark
    }
    const res = await request.get('/gateway-ip-pool-history/list', { params })
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
  filterForm.ip = ''
  filterForm.area = ''
  filterForm.remark = ''
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

const formatAsnType = (val: string) => {
  if (!val) return '-'
  const t = val.toLowerCase()
  if (t === 'l4' || t === 'ispl4' || t === 'isp-l4') return '原生'
  if (t === 'l3' || t === 'ispl3' || t === 'isp-l3') return '普通'
  return val
}

// 与网关列表一致的表头样式与行高亮
const headerCellStyle = {
  background: '#F9FAFB',
  color: '#4B5563',
  fontWeight: '600',
  height: '50px',
  fontSize: '13px'
}
const tableRowClassName = ({ row }: { row: any }) => {
  return row.status === 'expired' ? 'expired-row' : ''
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    // 使用全局消息组件以保持一致体验
  } catch (err) {
    // 忽略错误以避免打断用户流程
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
.filter-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #4B5563;
  padding-bottom: 8px;
}
.filter-select {
  width: 100%;
}
.status-option {
  display: none;
}
.filter-actions {
  display: flex;
  align-items: flex-end;
  padding-bottom: 18px;
  gap: 12px;
}
.action-btn {
  padding: 9px 20px;
}
.action-btn.reset {
  border-color: var(--el-border-color);
  color: #606266;
}
.action-btn.reset:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
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

.font-mono {
  font-family: "SF Mono", "Roboto Mono", Monaco, Consolas, monospace;
  font-size: 13px;
}
.info-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.region-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.separator {
  color: #c0c4cc;
}
.copy-btn {
  cursor: pointer;
  color: #909399;
}
.quality-text {
  font-size: 12px;
  color: #606266;
  margin-left: 6px;
}
.email {
  font-size: 13px;
}
.empty-text {
  color: #c0c4cc;
  font-style: italic;
  font-size: 12px;
}
</style>
