<template>
  <div class="page-container">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">静态代理IP管理</span>
            <el-tag type="info" size="small" effect="plain" class="count-tag">共 {{ total }} 条数据</el-tag>
          </div>
          <div class="header-right">
            <el-button :icon="Refresh" circle @click="handleRefresh" :loading="loading" />
          </div>
        </div>
      </template>

      <div class="filter-container">
        <el-form :inline="true" :model="filterForm" class="demo-form-inline">
          <el-form-item label="归属用户">
            <el-select
              v-model="filterForm.uid"
              placeholder="搜索用户"
              filterable
              remote
              clearable
              :remote-method="fetchUserList"
              :loading="userLoading"
              style="width: 200px"
            >
              <el-option
                v-for="item in userList"
                :key="item.uid"
                :label="item.email"
                :value="item.uid"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="地区">
            <el-input v-model="filterForm.area" placeholder="地区代码" clearable style="width: 120px" />
          </el-form-item>
          <el-form-item label="IP地址">
            <el-input v-model="filterForm.ip" placeholder="输入IP" clearable style="width: 160px" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 120px">
              <el-option label="活跃运行中" value="active" />
              <el-option label="已过期" value="expired" />
            </el-select>
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="filterForm.remark" placeholder="输入备注" clearable style="width: 160px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button :icon="RefreshLeft" @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- Batch Operations -->
      <transition name="fade">
        <div v-if="selectedRows.length" class="batch-bar">
          <el-alert type="info" show-icon :closable="false" class="mb-4">
            <template #title>
              <div class="batch-content">
                <span>已选中 {{ selectedRows.length }} 项</span>
                <div class="batch-btns">
                  <el-button type="primary" link size="small" @click="handleBatchDownloadQr('v2rayNG')">
                    下载 V2rayNG ZIP
                  </el-button>
                  <el-button type="primary" link size="small" @click="handleBatchDownloadQr('shadowRockets')">
                    下载 ShadowRocket ZIP
                  </el-button>
                </div>
              </div>
            </template>
          </el-alert>
        </div>
      </transition>

      <div v-loading="loading">
        <el-table 
          :data="tableData" 
          style="width: 100%" 
          stripe 
          border
          :row-class-name="tableRowClassName"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="50" align="center" fixed />
          
          <el-table-column prop="ip" label="出口IP" width="150" align="center">
            <template #default="scope">
              <div class="info-cell">
                <span>{{ scope.row.ip }}</span>
                <el-icon class="copy-btn cursor-pointer ml-1" @click.stop="copyToClipboard(scope.row.ip)">
                  <CopyDocument />
                </el-icon>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="protocol" label="协议" width="100" align="center">
            <template #default="scope">
              <el-tag :type="getProtocolTagType(scope.row.protocol)" effect="light" size="small">
                {{ scope.row.protocol ? scope.row.protocol.toUpperCase() : 'UNKNOWN' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="地区" min-width="120" show-overflow-tooltip>
            <template #default="scope">
              <span>{{ scope.row.area }}</span>
              <span v-if="scope.row.region"> - {{ scope.row.region }}</span>
            </template>
          </el-table-column>

          <el-table-column label="类型/质量" width="140" align="center">
            <template #default="scope">
              <el-space spacer="/">
                <el-tag effect="plain" type="info" size="small">{{ formatTerm(scope.row.asnType) }}</el-tag>
                <span>{{ formatTerm(scope.row.quality) }}</span>
              </el-space>
            </template>
          </el-table-column>

          <el-table-column label="归属用户" min-width="180">
            <template #default="scope">
              <div v-if="scope.row.uid">
                <span>{{ scope.row.email }}</span>
              </div>
              <span v-else class="text-gray-400">未分配</span>
            </template>
          </el-table-column>

          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'" effect="dark" size="small">
                {{ scope.row.status === 'active' ? '活跃' : '过期' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="创建时间" width="160" align="center">
             <template #default="scope">
               {{ formatDate(scope.row.createdAt) }}
             </template>
          </el-table-column>

          <el-table-column label="到期时间" width="160" align="center">
             <template #default="scope">
               {{ formatDate(scope.row.expireTime) }}
             </template>
          </el-table-column>

          <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />

          <el-table-column label="操作" width="200" fixed="right" align="center">
            <template #default="scope">
              <el-button-group>
                <el-tooltip content="查看详情" placement="top">
                  <el-button link type="primary" :icon="Monitor" @click="handleViewDetail(scope.row)" />
                </el-tooltip>
                <el-tooltip content="下载二维码" placement="top">
                  <el-dropdown trigger="click" @command="(cmd: string) => handleDownloadQr(scope.row, cmd)">
                    <el-button link type="primary" :icon="Download" />
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="v2rayNG">V2rayNG</el-dropdown-item>
                        <el-dropdown-item command="shadowRockets">ShadowRocket</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </el-tooltip>
                <el-tooltip content="编辑" placement="top">
                  <el-button link type="primary" :icon="Edit" @click="handleEdit(scope.row)" />
                </el-tooltip>
                <el-tooltip content="删除" placement="top">
                  <el-popconfirm title="确定删除该资源吗？" @confirm="handleDelete(scope.row)">
                    <template #reference>
                      <el-button link type="danger" :icon="Delete" />
                    </template>
                  </el-popconfirm>
                </el-tooltip>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
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

    <!-- Detail Dialog -->
    <el-dialog
      v-model="detailDialogVisible"
      title="IP资源详情"
      width="600px"
      destroy-on-close
      align-center
    >
      <div class="detail-container">
        <!-- Basic Info Section -->
        <div class="detail-section">
          <h3 class="section-title">基础信息</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="IP地址">
              <div class="flex-center">
                <span class="font-mono">{{ currentDetail.ip }}</span>
                <el-icon class="copy-icon cursor-pointer ml-1" @click="copyToClipboard(currentDetail.ip)"><CopyDocument /></el-icon>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="协议类型">{{ currentDetail.protocol?.toUpperCase() }}</el-descriptions-item>
            <el-descriptions-item label="地区">{{ currentDetail.area }} - {{ currentDetail.region }}</el-descriptions-item>
            <el-descriptions-item label="归属用户">{{ currentDetail.email || '未分配' }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="currentDetail.status === 'active' ? 'success' : 'danger'" size="small">
                {{ currentDetail.status === 'active' ? '活跃' : '过期' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDate(currentDetail.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="到期时间">{{ formatDate(currentDetail.expireTime) }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ currentDetail.remark || '-' }}</el-descriptions-item>
          </el-descriptions>
          
          <div class="mt-4">
             <div class="font-bold mb-2">快捷连接串</div>
             <div class="p-2 bg-gray-50 rounded flex justify-between items-center">
                <span class="font-mono text-sm truncate mr-2">{{ `${currentDetail.gateway}:${currentDetail.port}:${currentDetail.authUser}:${currentDetail.authPassword}` }}</span>
                <el-icon class="cursor-pointer" @click="copyToClipboard(`${currentDetail.gateway}:${currentDetail.port}:${currentDetail.authUser}:${currentDetail.authPassword}`)"><CopyDocument /></el-icon>
             </div>
          </div>
        </div>

        <!-- Connection Info Section -->
        <div class="detail-section mt-6">
          <h3 class="section-title">连接信息</h3>
          
          <el-tabs type="border-card" class="mt-2">
            <el-tab-pane label="V2rayNG" v-if="currentDetail.v2rayNG">
              <div class="p-2">
                <div class="mb-4 flex gap-2">
                   <el-button type="primary" plain size="small" @click="copyToClipboard(currentDetail.v2rayNG)">复制链接</el-button>
                   <el-button type="success" plain size="small" @click="showQrCode('v2rayNG')">查看二维码</el-button>
                </div>
                <div class="break-all font-mono text-xs text-gray-500 bg-gray-50 p-2 rounded mb-4">
                  {{ currentDetail.v2rayNG }}
                </div>
                <div v-if="currentQrType === 'v2rayNG' && qrCodeUrl" class="text-center">
                  <img :src="qrCodeUrl" alt="V2rayNG QR Code" class="mx-auto" />
                </div>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="ShadowRocket" v-if="currentDetail.shadowRockets">
              <div class="p-2">
                 <div class="mb-4 flex gap-2">
                   <el-button type="primary" plain size="small" @click="copyToClipboard(currentDetail.shadowRockets)">复制链接</el-button>
                   <el-button type="success" plain size="small" @click="showQrCode('shadowRockets')">查看二维码</el-button>
                </div>
                <div class="break-all font-mono text-xs text-gray-500 bg-gray-50 p-2 rounded mb-4">
                  {{ currentDetail.shadowRockets }}
                </div>
                <div v-if="currentQrType === 'shadowRockets' && qrCodeUrl" class="text-center">
                  <img :src="qrCodeUrl" alt="ShadowRocket QR Code" class="mx-auto" />
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>

           <div v-if="!currentDetail.v2rayNG && !currentDetail.shadowRockets" class="empty-links">
             <el-empty description="暂无连接信息" :image-size="80" />
           </div>
        </div>
      </div>
    </el-dialog>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增IP资源' : '编辑IP配置'"
      width="560px"
      destroy-on-close
      :close-on-click-modal="false"
      align-center
    >
      <el-form :model="formData" label-width="80px" ref="formRef" :rules="rules">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="归属用户" prop="uid">
              <el-select
                v-model="formData.uid"
                placeholder="选择用户"
                filterable
                remote
                clearable
                :remote-method="fetchUserList"
                :loading="userLoading"
                style="width: 100%"
              >
                <el-option
                  v-for="item in userList"
                  :key="item.uid"
                  :label="item.email"
                  :value="item.uid"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="IP地址" prop="ip">
              <el-input v-model="formData.ip" placeholder="IPv4地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="端口" prop="port">
              <el-input v-model.number="formData.port" placeholder="端口号" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="网关地址" prop="gateway">
              <el-input v-model="formData.gateway" placeholder="网关地址" />
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

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="认证账号" prop="authUser">
              <el-input v-model="formData.authUser" placeholder="认证账号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="认证密码" prop="authPassword">
              <el-input v-model="formData.authPassword" placeholder="认证密码" show-password />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属地区" prop="area">
              <el-input v-model="formData.area" placeholder="地区代码 (如: US)" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="具体区域" prop="region">
              <el-input v-model="formData.region" placeholder="城市/州/省" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注信息" prop="remark">
          <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">确认保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import QRCode from 'qrcode'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { 
  Search, 
  Refresh, 
  Plus, 
  Download,
  Edit, 
  Delete, 
  CopyDocument, 
  Monitor, 
  RefreshLeft,
  Location,
  Picture
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../../utils/request'
import dayjs from 'dayjs'

const tableRowClassName = ({ row }: { row: any }) => {
  return row.status === 'expired' ? 'expired-row' : ''
}

const getProtocolTagType = (protocol: string) => {
  const map: Record<string, string> = {
    'http': '',
    'socks5': 'success',
    'vmess': 'warning'
  }
  return map[protocol?.toLowerCase()] || 'info'
}

const formatTerm = (term: string) => {
  const map: Record<string, string> = {
    'L3': '普通',
    'L4': '原生',
    'isp': '静态住宅',
    'hosting': '数据中心'
  }
  return map[term] || term
}

const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

const userList = ref<any[]>([])
const userLoading = ref(false)

const fetchUserList = async (query: string) => {
  userLoading.value = true
  try {
    const res = await request.get('/account/list', {
      params: {
        page: 1,
        size: 50,
        email: query
      }
    })
    const data = res as any
    if (data.code === 200) {
      userList.value = data.data.list
    }
  } catch (error) {
    console.error(error)
  } finally {
    userLoading.value = false
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  fetchData()
  fetchUserList('')
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
const selectedRows = ref<any[]>([])

const handleSelectionChange = (val: any[]) => {
  selectedRows.value = val
}

const filterForm = reactive({
  uid: undefined,
  ip: '',
  status: '',
  area: '',
  remark: ''
})

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
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
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
        area: filterForm.area || undefined,
        remark: filterForm.remark || undefined
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
  filterForm.uid = undefined
  filterForm.ip = ''
  filterForm.status = ''
  filterForm.area = ''
  filterForm.remark = ''
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

const detailDialogVisible = ref(false)
const currentDetail = ref<any>({})
const qrCodeUrl = ref('')
const currentQrType = ref('')

const handleViewDetail = async (row: any) => {
  currentDetail.value = { ...row }
  detailDialogVisible.value = true
  // Reset QR code display
  qrCodeUrl.value = ''
  currentQrType.value = ''
}

const showQrCode = async (type: string) => {
  const link = type === 'v2rayNG' ? currentDetail.value.v2rayNG : currentDetail.value.shadowRockets
  if (!link) {
    ElMessage.warning('暂无链接')
    return
  }
  
  if (currentQrType.value === type && qrCodeUrl.value) {
    // Toggle off if clicking same type
    qrCodeUrl.value = ''
    currentQrType.value = ''
    return
  }

  try {
    qrCodeUrl.value = await QRCode.toDataURL(link)
    currentQrType.value = type
  } catch (e) {
    console.error(e)
    ElMessage.error('二维码生成失败')
  }
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
  // Check if current user is in userList, if not add it temporarily so it displays correctly
  if (row.uid && !userList.value.find((u: any) => u.uid === row.uid)) {
     userList.value.push({ uid: row.uid, email: row.email })
  }
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

const handleBatchDownloadQr = async (type: string = 'shadowRockets') => {
  if (!selectedRows.value.length) return
  
  try {
    const zip = new JSZip()
    const folder = zip.folder(`qrcodes_${type}`)
    let hasValidLink = false
    
    for (const row of selectedRows.value) {
      const link = type === 'v2rayNG' ? row.v2rayNG : row.shadowRockets
      
      if (link) {
         hasValidLink = true
         try {
           const url = await QRCode.toDataURL(link)
           const base64Data = url.split(',')[1]
           folder?.file(`${row.ip}_${row.port}_${type}.png`, base64Data, {base64: true})
         } catch (err) {
           console.error('Error generating QR for row', row.id, err)
         }
      }
    }
    
    if (!hasValidLink) {
      ElMessage.warning(`选中项中没有可用的${type === 'v2rayNG' ? 'v2rayNG' : 'ShadowRocket'}二维码链接`)
      return
    }
    
    const content = await zip.generateAsync({type: "blob"})
    saveAs(content, `qrcodes_${type}.zip`)
    ElMessage.success('下载已开始')
  } catch (error) {
    console.error('Batch download error:', error)
    ElMessage.error('批量下载失败')
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
.page-container {
  padding: 20px;
}

.box-card {
  border-radius: 8px;
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
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }
  }
}

.filter-container {
  margin-bottom: 20px;
  
  :deep(.el-form-item) {
    margin-bottom: 12px;
    margin-right: 16px;
  }
}

.batch-bar {
  margin-bottom: 16px;
  
  .batch-content {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .batch-btns {
      display: flex;
      gap: 12px;
    }
  }
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.info-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.flex-center {
  display: flex;
  align-items: center;
}

.cursor-pointer {
  cursor: pointer;
}

.ml-1 {
  margin-left: 4px;
}

.mt-4 {
  margin-top: 16px;
}

.mb-2 {
  margin-bottom: 8px;
}

:deep(.expired-row) {
  background-color: #fff1f2;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-left: 10px;
  border-left: 3px solid #409EFF;
}
</style>