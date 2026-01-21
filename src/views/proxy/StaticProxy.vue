<template>
  <div class="page-container">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="demo-tabs">
              <el-tab-pane label="全部 IP" name="all"></el-tab-pane>
              <el-tab-pane label="活跃中" name="active"></el-tab-pane>
              <el-tab-pane label="已过期" name="expired"></el-tab-pane>
            </el-tabs>
          </div>
          <div class="header-right">
            <el-button type="primary" :icon="Plus" @click="handleCreate">添加IP</el-button>
            <el-button :icon="Download" @click="handleBatchExport">导出</el-button>
            <el-button :icon="Refresh" circle @click="handleRefresh" :loading="loading" />
          </div>
        </div>
      </template>

      <!-- Advanced Filter -->
      <div class="filter-container">
        <el-form :model="filterForm" class="filter-form" label-position="top">
          <el-row :gutter="20">
            <el-col :xs="24" :sm="8" :md="6" :lg="6">
              <el-form-item label="用户ID">
                <el-input v-model="filterForm.uid" placeholder="输入用户ID" clearable :prefix-icon="User" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="8" :md="6" :lg="6">
              <el-form-item label="IP地址">
                <el-input v-model="filterForm.ip" placeholder="输入IP地址" clearable :prefix-icon="Connection" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="8" :md="6" :lg="6">
              <el-form-item label="区域">
                <el-input v-model="filterForm.region" placeholder="输入区域" clearable :prefix-icon="Connection" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="6" :lg="6" class="filter-actions">
              <el-button type="primary" :icon="Search" @click="handleSearch" class="w-full-mobile">查询</el-button>
              <el-button :icon="RefreshLeft" @click="resetSearch" class="w-full-mobile">重置</el-button>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <!-- Batch Action Bar -->
      <transition name="el-zoom-in-top">
        <div v-if="multipleSelection.length > 0" class="batch-action-bar">
          <div class="selection-info">
            <el-icon><Check /></el-icon>
            <span>已选择 {{ multipleSelection.length }} 项</span>
          </div>
          <div class="action-group">
            <el-button type="danger" plain size="small" :icon="Delete" @click="handleBatchDelete">批量删除</el-button>
            <el-button plain size="small" :icon="Download" @click="handleBatchExport">导出选中</el-button>
          </div>
        </div>
      </transition>

      <!-- Data Table -->
      <el-skeleton :rows="10" animated v-if="loading && !tableData.length" />
      <div v-else class="table-wrapper">
        <el-table 
          :data="tableData" 
          style="width: 100%" 
          v-loading="loading" 
          :header-cell-style="{ background: '#F7F8FA', color: '#1D2129', fontWeight: '600' }"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          
          <el-table-column label="IP信息" min-width="200">
            <template #default="scope">
              <div class="ip-cell">
                <span class="ip-text">{{ scope.row.ip }}:{{ scope.row.port }}</span>
                <el-icon class="copy-icon" @click="copyToClipboard(`${scope.row.ip}:${scope.row.port}`)">
                  <CopyDocument />
                </el-icon>
              </div>
              <div class="sub-text">
                <el-tag size="small" effect="plain" type="info">{{ scope.row.protocol }}</el-tag>
                <span class="divider">|</span>
                <span>{{ scope.row.area }} - {{ scope.row.region }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="所属用户" min-width="150" class-name="hidden-xs-only">
            <template #default="scope">
              <div v-if="scope.row.uid" class="user-cell">
                <el-avatar :size="24" class="user-avatar">{{ scope.row.uid.toString().slice(-2) }}</el-avatar>
                <div class="user-info">
                  <div class="uid">UID: {{ scope.row.uid }}</div>
                  <div class="email text-truncate" :title="scope.row.email">{{ scope.row.email }}</div>
                </div>
              </div>
              <span v-else class="text-gray-400">未分配</span>
            </template>
          </el-table-column>

          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <div class="status-indicator">
                <span class="dot" :class="scope.row.status === 'active' ? 'bg-success' : 'bg-danger'"></span>
                <span>{{ scope.row.status === 'active' ? '活跃' : '过期' }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="expireTime" label="到期时间" width="160" class-name="hidden-xs-only">
             <template #default="scope">
               <span class="date-text">{{ formatDate(scope.row.expireTime) }}</span>
             </template>
          </el-table-column>

          <el-table-column label="操作" width="140" fixed="right" align="center">
            <template #default="scope">
              <div class="action-buttons">
                <el-tooltip content="编辑" placement="top">
                  <el-button link type="primary" :icon="Edit" @click="handleEdit(scope.row)" />
                </el-tooltip>
                <el-popconfirm 
                  title="确定要删除这个IP吗？" 
                  @confirm="handleDelete(scope.row)"
                  confirm-button-text="删除"
                  cancel-button-text="取消"
                  confirm-button-type="danger"
                >
                  <template #reference>
                    <el-button link type="danger" :icon="Delete" />
                  </template>
                </el-popconfirm>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          background
          :pager-count="isMobile ? 5 : 7"
        />
      </div>
    </el-card>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '添加静态IP' : '编辑静态IP'"
      :width="isMobile ? '90%' : '600px'"
      destroy-on-close
      class="custom-dialog"
    >
      <el-form :model="formData" label-width="100px" ref="formRef" :rules="rules" label-position="left">
        <el-form-item label="用户ID" prop="uid">
          <el-input v-model.number="formData.uid" placeholder="请输入用户ID" />
        </el-form-item>
        <el-form-item label="IP地址" prop="ip">
          <el-input v-model="formData.ip" placeholder="请输入IP地址" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="端口" prop="port">
              <el-input v-model.number="formData.port" placeholder="端口" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="协议" prop="protocol">
              <el-select v-model="formData.protocol" placeholder="选择协议" style="width: 100%">
                <el-option label="HTTP" value="http" />
                <el-option label="SOCKS5" value="socks5" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="地区" prop="area">
          <el-input v-model="formData.area" placeholder="国家/地区代码" />
        </el-form-item>
        <el-form-item label="区域" prop="region">
          <el-input v-model="formData.region" placeholder="城市/区域" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio label="active">活跃</el-radio>
            <el-radio label="expired">过期</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { 
  Search, 
  Refresh, 
  Plus, 
  Edit, 
  Delete, 
  CopyDocument, 
  Check, 
  User,
  Connection,
  Download
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../../utils/request'

// Mobile Check
const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  fetchData()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

const loading = ref(false)
const submitting = ref(false)
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const dialogType = ref<'create' | 'edit'>('create')
const formRef = ref()
const multipleSelection = ref<any[]>([])
const activeTab = ref('all')

const filterForm = reactive({
  uid: '',
  ip: '',
  status: '',
  region: ''
})

// Watch tab change
const handleTabClick = (tab: any) => {
  filterForm.status = tab.props.name === 'all' ? '' : tab.props.name
  handleSearch()
}

const handleSelectionChange = (val: any[]) => {
  multipleSelection.value = val
}

const handleBatchExport = () => {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning('请先选择要导出的数据')
    return
  }
  
  const headers = ['ID', 'IP', '端口', '协议', '地区', '状态', '到期时间']
  const csvContent = [
    headers.join(','),
    ...multipleSelection.value.map(row => [
      row.id,
      row.ip,
      row.port,
      row.protocol,
      `${row.area}-${row.region}`,
      row.status,
      formatDate(row.expireTime)
    ].join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'proxy_ips_export.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

const handleBatchDelete = () => {
  if (multipleSelection.value.length === 0) return
  
  ElMessageBox.confirm(
    `确定要删除选中的 ${multipleSelection.value.length} 个IP吗？`,
    '批量删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    // Mock batch delete by looping (since we only have single delete API)
    // In real app, backend should support batch delete
    loading.value = true
    try {
      for (const row of multipleSelection.value) {
        await request.post('/gateway/delete', { id: row.id })
      }
      ElMessage.success('批量删除成功')
      fetchData()
    } catch (error) {
      ElMessage.error('部分删除失败')
    } finally {
      loading.value = false
    }
  })
}

const formData = reactive({
  id: undefined,
  uid: undefined,
  ip: '',
  port: 8080,
  gateway: '',
  area: '',
  region: '',
  protocol: 'http',
  status: 'active',
  authUser: '',
  authPassword: '',
  expireTime: '',
  remark: '',
  autoRenew: false,
  dedicatedLine: false
})

const rules = {
  ip: [{ required: true, message: '请输入IP地址', trigger: 'blur' }],
  port: [{ required: true, message: '请输入端口', trigger: 'blur' }],
  protocol: [{ required: true, message: '请选择协议', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const formatDate = (date: string) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await request.get('/gateway/list', {
      params: {
        page: currentPage.value,
        size: pageSize.value,
        uid: filterForm.uid || undefined,
        ip: filterForm.ip || undefined,
        status: filterForm.status || undefined,
        area: filterForm.region || undefined
      }
    })
    const data = res as any
    if (data.code === 200) {
      tableData.value = data.data.list
      total.value = data.data.total
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('加载失败，请重试')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchData()
}

const handleRefresh = () => {
  fetchData()
}

const resetSearch = () => {
  filterForm.uid = ''
  filterForm.ip = ''
  filterForm.status = ''
  filterForm.region = ''
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

const handleCreate = () => {
  dialogType.value = 'create'
  Object.assign(formData, {
    id: undefined,
    uid: undefined,
    ip: '',
    port: 8080,
    gateway: '',
    area: '',
    region: '',
    protocol: 'http',
    status: 'active',
    authUser: '',
    authPassword: '',
    expireTime: '',
    remark: '',
    autoRenew: false,
    dedicatedLine: false
  })
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  dialogType.value = 'edit'
  Object.assign(formData, row)
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitting.value = true
      try {
        const url = dialogType.value === 'create' 
          ? '/gateway/create' 
          : '/gateway/update'
        
        const res = await request.post(url, formData)
        
        const data = res as any
        if (data.code === 200) {
          ElMessage.success(dialogType.value === 'create' ? '创建成功' : '更新成功')
          dialogVisible.value = false
          fetchData()
        }
      } catch (error) {
        console.error(error)
        ElMessage.error('操作失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

const handleDelete = async (row: any) => {
  try {
    const res = await request.post('/gateway/delete', { id: row.id })
    const data = res as any
    if (data.code === 200) {
      ElMessage.success('删除成功')
      fetchData()
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('删除失败')
  }
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch (err) {
    ElMessage.error('复制失败')
  }
}
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .title {
    font-size: 16px;
    font-weight: 600;
  }

  /* Tabs styling in header */
  :deep(.el-tabs__header) {
    margin: 0;
  }
  :deep(.el-tabs__nav-wrap::after) {
    display: none;
  }
}

.batch-action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
  padding: 8px 16px;
  border-radius: 4px;
  margin-bottom: 16px;
  
  .selection-info {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #1890ff;
    font-size: 14px;
  }
  
  .action-group {
    display: flex;
    gap: 8px;
  }
}

.filter-container {
  margin-bottom: 24px;
  background-color: #F7F8FA;
  padding: 16px;
  border-radius: 4px;

  .filter-form {
    :deep(.el-form-item) {
      margin-bottom: 0;
    }
  }
  
  .filter-actions {
    display: flex;
    align-items: flex-end;
    justify-content: flex-start;
    
    .el-button {
      margin-top: 30px; /* Align with inputs with labels */
    }
  }
}

.ip-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .ip-text {
    font-weight: 500;
    color: #1D2129;
  }
  
  .copy-icon {
    cursor: pointer;
    color: #86909C;
    transition: color 0.2s;
    font-size: 14px;
    
    &:hover {
      color: #165DFF;
    }
  }
}

.sub-text {
  font-size: 12px;
  color: #86909C;
  margin-top: 4px;
  
  .divider {
    margin: 0 4px;
    color: #E5E6EB;
  }
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .user-avatar {
    background-color: #165DFF;
    font-size: 12px;
  }
  
  .user-info {
    overflow: hidden;
    
    .uid {
      font-weight: 500;
      color: #1D2129;
    }
    .email {
      font-size: 12px;
      color: #86909C;
    }
  }
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    
    &.bg-success { background-color: #00B42A; }
    &.bg-danger { background-color: #F53F3F; }
  }
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* Mobile Adjustments */
@media screen and (max-width: 768px) {
  .filter-container {
    padding: 12px;
    
    .filter-actions {
      margin-top: 12px;
      flex-direction: row;
      gap: 12px;
      
      .el-button {
        margin-top: 0;
        flex: 1;
      }
    }
  }
  
  .w-full-mobile {
    width: 100%;
  }
  
  .pagination-container {
    justify-content: center;
  }
}
</style>
