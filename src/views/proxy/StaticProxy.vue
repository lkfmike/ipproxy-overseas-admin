<template>
  <div class="page-container">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">静态代理IP管理</h1>
        <p class="page-subtitle">管理和监控所有的静态代理IP资源配置</p>
      </div>
      <div class="header-right">
        <!-- 
        <el-button type="primary" size="large" :icon="Plus" class="create-btn" @click="handleCreate">
          新增IP资源
        </el-button>
        -->
        <el-tooltip content="刷新数据" placement="bottom">
          <el-button :icon="Refresh" circle size="large" class="refresh-btn" @click="handleRefresh" :loading="loading" />
        </el-tooltip>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Filter Section -->
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
                  :remote-method="fetchUserList"
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
            <el-col :xs="24" :sm="12" :md="6" :lg="4">
              <el-form-item label="资源状态">
                <el-select v-model="filterForm.status" placeholder="全部状态" clearable class="filter-select">
                  <el-option label="活跃运行中" value="active">
                    <span class="status-option active">活跃运行中</span>
                  </el-option>
                  <el-option label="已过期" value="expired">
                    <span class="status-option expired">已过期</span>
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="24" :lg="4" class="filter-actions">
              <el-button type="primary" :icon="Search" @click="handleSearch" class="action-btn">查询</el-button>
              <el-button :icon="RefreshLeft" @click="resetSearch" class="action-btn reset">重置</el-button>
            </el-col>
          </el-row>
        </el-form>
      </el-card>

      <!-- Data Table Section -->
      <el-card class="table-card" shadow="hover" :body-style="{ padding: '0' }">
        <div class="table-container">
          <el-table 
            :data="tableData" 
            style="width: 100%" 
            v-loading="loading" 
            :header-cell-style="headerCellStyle"
            :row-class-name="tableRowClassName"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="50" align="center" fixed />
            
            <el-table-column prop="ip" label="出口IP" width="135">
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
                <div class="protocol-wrapper centered">
                  <el-tag :type="getProtocolTagType(scope.row.protocol)" effect="light" round size="small">
                    {{ scope.row.protocol ? scope.row.protocol.toUpperCase() : 'UNKNOWN' }}
                  </el-tag>
                  <el-dropdown trigger="click" @command="onQrCommand(scope.row, $event)">
                    <div class="qr-action">
                      <el-icon><Download /></el-icon>
                    </div>
                    <template #dropdown>
                      <el-dropdown-menu class="custom-dropdown">
                        <el-dropdown-item command="v2rayNG">
                          <div class="dropdown-item-content">
                            <span class="label">V2rayNG</span>
                            <span class="sub-label">二维码</span>
                          </div>
                        </el-dropdown-item>
                        <el-dropdown-item command="shadowRockets" divided>
                          <div class="dropdown-item-content">
                            <span class="label">ShadowRocket</span>
                            <span class="sub-label">二维码</span>
                          </div>
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="地区" min-width="110">
              <template #default="scope">
                <div class="area-info">
                  <span class="area-text">{{ scope.row.area }}</span>
                  <span v-if="scope.row.region" class="region-text">{{ scope.row.region }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="类型/质量" width="130" align="center">
              <template #default="scope">
                <div class="type-quality-wrapper">
                  <el-tag effect="plain" type="info" size="small" class="mini-tag">{{ formatTerm(scope.row.asnType) }}</el-tag>
                  <span class="quality-text">{{ formatTerm(scope.row.quality) }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="归属用户" min-width="140" class-name="hidden-xs-only">
              <template #default="scope">
                <div v-if="scope.row.uid" class="user-info-cell">
                  <div class="user-details">
                    <div class="email text-truncate" :title="scope.row.email">{{ scope.row.email }}</div>
                  </div>
                </div>
                <span v-else class="empty-text">未分配</span>
              </template>
            </el-table-column>

            <el-table-column prop="status" label="状态" width="80" align="center">
              <template #default="scope">
                <div class="status-badge simple" :class="scope.row.status">
                  <span class="dot"></span>
                  <span class="text">{{ scope.row.status === 'active' ? '活跃' : '过期' }}</span>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="创建时间" width="160" class-name="hidden-xs-only">
               <template #default="scope">
                 <span class="font-mono">{{ formatDate(scope.row.createdAt) }}</span>
               </template>
            </el-table-column>

            <el-table-column label="到期时间" width="160" class-name="hidden-xs-only">
               <template #default="scope">
                 <span class="font-mono">{{ formatDate(scope.row.expireTime) }}</span>
               </template>
            </el-table-column>

            <el-table-column prop="remark" label="备注" min-width="100" show-overflow-tooltip />

            <el-table-column label="操作" width="220" fixed="right" align="center">
              <template #default="scope">
                <div class="row-actions">
                  <el-button link type="primary" :icon="Monitor" @click="handleViewDetail(scope.row)">
                    详情
                  </el-button>
                  <el-button link type="primary" :icon="Edit" @click="handleEdit(scope.row)">
                    编辑
                  </el-button>
                  <el-popconfirm title="确定删除该资源吗？" @confirm="handleDelete(scope.row)" width="200">
                    <template #reference>
                      <el-button link type="danger" :icon="Delete">
                        删除
                      </el-button>
                    </template>
                  </el-popconfirm>
                </div>
              </template>
            </el-table-column>

            <template #empty>
              <div class="empty-state">
                <el-empty description="暂无IP资源数据" :image-size="120" />
              </div>
            </template>
          </el-table>
        </div>

        <!-- Table Footer -->
        <div class="table-footer">
          <div class="batch-operations">
            <transition name="fade">
              <div v-if="selectedRows.length" class="selection-bar">
                <span class="count">已选中 <span class="num">{{ selectedRows.length }}</span> 项</span>
                <div class="batch-btns">
                  <el-button type="primary" plain size="default" @click="handleBatchDownloadQr('v2rayNG')">
                    <el-icon class="el-icon--left"><Download /></el-icon>V2rayNG ZIP
                  </el-button>
                  <el-button type="primary" plain size="default" @click="handleBatchDownloadQr('shadowRockets')">
                    <el-icon class="el-icon--left"><Download /></el-icon>ShadowRocket ZIP
                  </el-button>
                  <el-button type="primary" plain size="default" @click="handleBatchRenew">
                    <el-icon class="el-icon--left"><RefreshLeft /></el-icon>批量续费
                  </el-button>
                </div>
              </div>
            </transition>
          </div>
          
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            background
            class="custom-pagination"
            :pager-count="isMobile ? 5 : 7"
          />
        </div>
      </el-card>
    </div>

    <!-- Detail Dialog -->
    <el-dialog
      v-model="detailDialogVisible"
      title="IP资源详情"
      :width="isMobile ? '95%' : '600px'"
      class="custom-dialog detail-dialog"
      align-center
    >
      <div class="detail-container">
        <!-- Basic Info Section -->
        <div class="detail-section">
          <h3 class="section-title">基础信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">IP地址</span>
              <div class="value-wrapper">
                <span class="value font-mono">{{ currentDetail.ip }}</span>
                <el-icon class="copy-icon" @click="copyToClipboard(currentDetail.ip)"><CopyDocument /></el-icon>
              </div>
            </div>
            <div class="info-item full-width">
              <span class="label">快捷连接串</span>
              <div class="value-wrapper">
                <span class="value font-mono text-truncate" :title="`${currentDetail.gateway}:${currentDetail.port}:${currentDetail.authUser}:${currentDetail.authPassword}`">{{ `${currentDetail.gateway}:${currentDetail.port}:${currentDetail.authUser}:${currentDetail.authPassword}` }}</span>
                <el-icon class="copy-icon" @click="copyToClipboard(`${currentDetail.gateway}:${currentDetail.port}:${currentDetail.authUser}:${currentDetail.authPassword}`)"><CopyDocument /></el-icon>
              </div>
            </div>
            <div class="info-item">
              <span class="label">协议类型</span>
              <span class="value">{{ currentDetail.protocol?.toUpperCase() }}</span>
            </div>
            <div class="info-item">
              <span class="label">当前状态</span>
              <div class="status-badge" :class="currentDetail.status">
                <span class="dot"></span>
                <span class="text">{{ currentDetail.status === 'active' ? '活跃' : '过期' }}</span>
              </div>
            </div>
            <div class="info-item">
              <span class="label">地区</span>
              <span class="value">{{ currentDetail.area }} - {{ currentDetail.region }}</span>
            </div>
            <div class="info-item">
              <span class="label">归属用户</span>
              <span class="value">{{ currentDetail.email || '未分配' }}</span>
            </div>
            <div class="info-item">
              <span class="label">创建时间</span>
              <span class="value">{{ formatDate(currentDetail.createdAt) }}</span>
            </div>
             <div class="info-item">
              <span class="label">到期时间</span>
              <span class="value">{{ formatDate(currentDetail.expireTime) }}</span>
            </div>
          </div>
        </div>

        <!-- Connection Info Section -->
        <div class="detail-section">
          <h3 class="section-title">连接信息</h3>
          
          <!-- V2rayNG -->
          <div class="connection-card" v-if="currentDetail.v2rayNG">
             <div class="card-header">
               <span class="card-title">V2rayNG</span>
               <div class="card-actions">
                 <el-button link type="primary" @click="copyToClipboard(currentDetail.v2rayNG)">
                   <el-icon><CopyDocument /></el-icon> 复制链接
                 </el-button>
                 <el-button link type="primary" @click="showQrCode('v2rayNG')">
                   <el-icon><Picture /></el-icon> 二维码
                 </el-button>
               </div>
             </div>
             <div class="link-preview font-mono">{{ currentDetail.v2rayNG }}</div>
             <div v-if="currentQrType === 'v2rayNG' && qrCodeUrl" class="qr-code-area">
               <img :src="qrCodeUrl" alt="V2rayNG QR Code" />
             </div>
          </div>

          <!-- ShadowRocket -->
          <div class="connection-card" v-if="currentDetail.shadowRockets">
             <div class="card-header">
               <span class="card-title">ShadowRocket</span>
               <div class="card-actions">
                 <el-button link type="primary" @click="copyToClipboard(currentDetail.shadowRockets)">
                   <el-icon><CopyDocument /></el-icon> 复制链接
                 </el-button>
                 <el-button link type="primary" @click="showQrCode('shadowRockets')">
                   <el-icon><Picture /></el-icon> 二维码
                 </el-button>
               </div>
             </div>
             <div class="link-preview font-mono">{{ currentDetail.shadowRockets }}</div>
             <div v-if="currentQrType === 'shadowRockets' && qrCodeUrl" class="qr-code-area">
               <img :src="qrCodeUrl" alt="ShadowRocket QR Code" />
             </div>
          </div>
          
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
      :width="isMobile ? '90%' : '560px'"
      destroy-on-close
      class="custom-dialog"
      :close-on-click-modal="false"
      align-center
    >
      <el-form :model="formData" label-width="80px" ref="formRef" :rules="rules" class="dialog-form">
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
              <el-input v-model="formData.ip" placeholder="IPv4地址" :disabled="dialogType === 'edit'" />
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
                <el-option label="VMESS" value="vmess" />
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

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="到期时间" prop="expireTime">
              <el-date-picker
                v-model="formData.expireTime"
                type="datetime"
                placeholder="选择到期时间"
                style="width: 100%"
                value-format="YYYY-MM-DD HH:mm:ss"
                format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注信息" prop="remark">
          <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false" size="large">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting" size="large">确认保存</el-button>
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
  Download,
  Edit, 
  Delete, 
  CopyDocument, 
  Monitor, 
  User,
  Connection, 
  RefreshLeft,
  Location,
  Picture
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../../utils/request'
import dayjs from 'dayjs'

// --- Visual Helpers ---
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

const getProtocolTagType = (protocol: string) => {
  const map: Record<string, string> = {
    'http': '',
    'socks5': 'success',
    'vmess': 'warning'
  }
  return map[protocol?.toLowerCase()] || 'info'
}

// --- Logic ---
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


const handleEdit = (row: any) => {
  dialogType.value = 'edit'
  Object.assign(formData, row)
  if (row.expireTime) {
    formData.expireTime = dayjs(row.expireTime).format('YYYY-MM-DD HH:mm:ss')
  } else {
    formData.expireTime = ''
  }
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
        const payload: any = { ...formData }
        if (payload.expireTime) {
          payload.expireTime = dayjs(payload.expireTime).format('YYYY-MM-DD HH:mm:ss')
        } else {
          payload.expireTime = null
        }
        const res = await request.post(url, payload)
        
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
  console.log('Batch download clicked, selected rows:', selectedRows.value, 'Type:', type)
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
      console.warn('No valid links found in selected rows')
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

const handleDownloadQr = async (row: any, type: string) => {
    console.log('Single download clicked for row:', row, 'Type:', type)
    const link = type === 'v2rayNG' ? row.v2rayNG : row.shadowRockets
    
    if (!link) {
        ElMessage.warning(`暂无${type === 'v2rayNG' ? 'v2rayNG' : 'ShadowRocket'}二维码链接`)
        return
    }
    try {
        const url = await QRCode.toDataURL(link)
        saveAs(url, `${row.ip}_${row.port}_${type}.png`)
    } catch (e) {
        console.error('Single download error:', e)
        ElMessage.error('生成二维码失败')
    }
}

const onQrCommand = (row: any, cmd: string) => {
  handleDownloadQr(row, cmd)
}

const handleBatchRenew = async () => {
  if (!selectedRows.value.length) return
  const items = selectedRows.value.filter((r: any) => r.uid && r.id)
  if (!items.length) {
    ElMessage.warning('请选择已分配用户的IP进行续费')
    return
  }
  try {
    // 仅允许同一UID批量续费
    const uidSet = new Set(items.map((i: any) => i.uid))
    if (uidSet.size !== 1) {
      ElMessage.error('请选择同一用户的IP进行批量续费')
      return
    }
    const uid = Number(items[0].uid)
    const ids = items.map((i: any) => i.id)
    await ElMessageBox.confirm(`将为 UID=${uid} 的 ${ids.length} 项执行批量续费。是否继续？`, '提示', { type: 'warning' })
    try {
      const res = await request.post('/gateway/batch-renew', { ids, uid })
      const data = res as any
      if (data.code !== 200) {
        ElMessage.error(data.message || '续费失败')
        return
      }
      ElMessage.success('批量续费成功')
      fetchData()
    } catch (e: any) {
      console.error('batch renew error:', e)
      ElMessage.error(e?.message || '续费请求失败')
    }
  } catch (err) {
    console.error('batch renew unexpected error:', err)
    ElMessage.error('批量续费失败')
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
:deep(.el-card) {
  border-radius: 8px;
  border: none;
}

.page-container {
  padding: 24px 32px;
  background-color: #F2F3F5;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

/* Header */
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    
    .header-left {
      .page-title {
        font-size: 24px;
        font-weight: 700;
        color: var(--text-color-primary);
        margin: 0 0 8px 0;
        line-height: 32px;
      }
      .page-subtitle {
        font-size: 14px;
        color: var(--text-color-secondary);
        margin: 0;
      }
    }
    
    .header-right {
      display: flex;
      gap: 16px;
      
      .create-btn {
        padding: 10px 24px;
        font-weight: 500;
        box-shadow: 0 4px 10px rgba(22, 93, 255, 0.2);
      }
      
      .refresh-btn {
        font-size: 18px;
        color: var(--text-color-regular);
        &:hover {
          color: var(--el-color-primary);
          background-color: var(--el-color-primary-light-9);
        }
      }
    }
  }
  
  /* Filter Card */
  .filter-card {
    margin-bottom: 24px;
    overflow: visible;
    background-color: var(--bg-color-card);
    
    :deep(.el-card__body) {
      padding: 24px 24px 8px 24px;
    }
  }
  
  .filter-form {
    :deep(.el-form-item__label) {
      font-weight: 500;
      color: var(--text-color-regular);
      padding-bottom: 8px;
    }
    
    .filter-select {
      width: 100%;
    }
    
    .status-option {
      display: flex;
      align-items: center;
      &::before {
        content: '';
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        margin-right: 8px;
      }
      &.active::before { background-color: var(--color-success-text); }
      &.expired::before { background-color: var(--color-danger-text); }
    }
  }
  
  .filter-actions {
    display: flex;
    align-items: flex-end;
    padding-bottom: 18px;
    gap: 12px;
    
    .action-btn {
      padding: 9px 20px;
      &.reset {
        border-color: var(--el-border-color);
        color: var(--text-color-regular);
        &:hover {
          color: var(--el-color-primary);
          border-color: var(--el-color-primary);
        }
      }
    }
  }
  
  /* Table Card */
  .table-card {
    display: flex;
    flex-direction: column;
    background-color: var(--bg-color-card);
  }
  
  .table-container {
    border-bottom: 1px solid var(--bg-color-page);
  }
  
  .font-mono {
    font-family: "SF Mono", "Roboto Mono", Monaco, Consolas, monospace;
    font-size: 13px;
    color: var(--text-color-primary);
  }
  
  .info-cell {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 24px;
    
    .copy-btn {
      opacity: 0;
      cursor: pointer;
      color: var(--text-color-secondary);
      font-size: 14px;
      transition: all 0.2s;
      
      &:hover {
        color: var(--el-color-primary);
        transform: scale(1.1);
      }
    }
    
    &:hover .copy-btn {
      opacity: 1;
    }
  }
  
  .protocol-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .qr-action {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 4px;
      color: var(--text-color-secondary);
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        background-color: var(--bg-color-page);
        color: var(--el-color-primary);
      }
    }
  }
  
  .quality-text {
    font-weight: 500;
    color: var(--text-color-primary);
    font-size: 12px;
  }
  
  .type-quality-wrapper {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  
  .empty-text {
    color: var(--text-color-placeholder);
    font-style: italic;
    font-size: 12px;
  }
  
  .user-info-cell {
    .user-details {
      line-height: 1.4;
    }
    .email {
      color: var(--text-color-primary);
      font-size: 13px;
    }
  }
  
  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      margin-right: 6px;
    }
    
    &.active {
      background-color: var(--color-success-bg);
      color: var(--color-success-text);
      .dot { background-color: var(--color-success-text); }
    }
    
    &.expired {
      background-color: var(--color-danger-bg);
      color: var(--color-danger-text);
      .dot { background-color: var(--color-danger-text); }
    }
  }
  
  .date-text {
    color: var(--text-color-secondary);
    font-size: 13px;
  }
  
  .row-actions {
    display: flex;
    justify-content: center;
    gap: 8px;
  }
  
  /* Footer & Pagination */
  .table-footer {
    padding: 16px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    background-color: var(--bg-color-card);
  }
  
  .batch-operations {
    min-height: 32px;
    
    .selection-bar {
      display: flex;
      align-items: center;
      gap: 16px;
      background-color: var(--el-color-primary-light-9);
      padding: 6px 16px;
      border-radius: 4px;
      border: 1px solid var(--el-color-primary-light-8);
      
      .count {
        font-size: 13px;
        color: var(--text-color-primary);
        .num {
          color: var(--el-color-primary);
          font-weight: 600;
          margin: 0 2px;
        }
      }
      
      .batch-btns {
        display: flex;
        gap: 8px;
      }
    }
  }

/* Mobile Adaptation */
@media screen and (max-width: 768px) {
  .page-container {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    
    .header-right {
      width: 100%;
      justify-content: space-between;
      
      .create-btn {
        flex: 1;
      }
    }
  }
  
  .filter-actions {
    flex-direction: row;
    padding-top: 8px;
    
    .action-btn {
      flex: 1;
    }
  }
  
  .table-footer {
    flex-direction: column;
    align-items: stretch;
    
    .batch-operations {
      width: 100%;
      .selection-bar {
        width: 100%;
        flex-direction: column;
        align-items: flex-start;
        padding: 12px;
        box-sizing: border-box;
        
        .batch-btns {
          width: 100%;
          margin-top: 8px;
          .el-button {
            flex: 1;
          }
        }
      }
    }
  }
  
  .custom-pagination {
    justify-content: center;
  }
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Detail Dialog Styles */
.detail-dialog {
  :deep(.el-dialog__body) {
    padding: 20px 24px;
    max-height: 70vh;
    overflow-y: auto;
  }
}

.detail-section {
  margin-bottom: 24px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-color-primary);
    margin: 0 0 16px 0;
    padding-left: 12px;
    border-left: 4px solid var(--el-color-primary);
    line-height: 1;
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px 24px;
  
  .info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    
    &.full-width {
      grid-column: span 2;
    }
    
    .label {
      font-size: 12px;
      color: var(--text-color-secondary);
    }
    
    .value-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .copy-icon {
        cursor: pointer;
        color: var(--text-color-secondary);
        font-size: 14px;
        transition: color 0.2s;
        
        &:hover {
          color: var(--el-color-primary);
        }
      }
    }
    
    .value {
      font-size: 14px;
      color: var(--text-color-primary);
      font-weight: 500;
      word-break: break-all;
    }
  }
}

.connection-card {
  background-color: var(--bg-color-section);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    
    .card-title {
      font-weight: 600;
      color: var(--text-color-primary);
    }
    
    .card-actions {
      display: flex;
      gap: 12px;
    }
  }
  
  .link-preview {
    font-size: 12px;
    color: #4E5969;
    background-color: #fff;
    padding: 8px 12px;
    border-radius: 4px;
    border: 1px solid #E5E6EB;
    word-break: break-all;
    margin-bottom: 12px;
  }
  
  .qr-code-area {
    display: flex;
    justify-content: center;
    padding: 16px;
    background-color: #fff;
    border-radius: 4px;
    border: 1px solid #E5E6EB;
    
    img {
      width: 180px;
      height: 180px;
    }
  }
}

@media screen and (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
    
    .info-item.full-width {
      grid-column: span 1;
    }
  }
  
  .connection-card .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    
    .card-actions {
      width: 100%;
      justify-content: space-between;
    }
  }
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  display: block;
}

.area-info {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  
  .area-text {
    font-weight: 500;
    color: #1D2129;
  }
  
  .region-text {
    font-size: 13px;
    color: #86909C;
    &::before {
      content: '-';
      margin-right: 8px;
    }
  }
}

.mini-tag {
  transform: scale(0.9);
}

.protocol-wrapper.centered {
  justify-content: center;
  gap: 4px;
  
  .el-tag {
    margin-right: 0;
  }
}

.status-badge.simple {
  padding: 2px 6px;
  
  .text {
    font-size: 12px;
  }
}
</style>
