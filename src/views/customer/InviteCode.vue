<template>
  <div class="page-container">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">邀请码管理</span>
            <span class="subtitle">管理客户的多个邀请码及折扣配置</span>
          </div>
          <div class="header-right">
            <el-button type="primary" :icon="Plus" @click="handleAdd">新增邀请码</el-button>
          </div>
        </div>
      </template>

      <div class="filter-bar">
        <el-form :inline="true" :model="filters" class="filter-form">
          <el-form-item label="用户">
            <el-select
              v-model="filters.uid"
              placeholder="搜索邮箱/UID"
              filterable
              remote
              clearable
              :remote-method="searchUsers"
              :loading="userLoading"
              style="width: 260px"
            >
              <el-option
                v-for="item in userList"
                :key="item.uid"
                :label="`${item.uid} - ${item.email}`"
                :value="item.uid"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="邀请码">
            <el-input
              v-model="filters.code"
              placeholder="支持模糊搜索"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table
        :data="tableData"
        border
        stripe
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column label="用户" min-width="260">
          <template #default="scope">
            <span class="font-mono">{{ scope.row.uid }} - {{ getEmail(scope.row.uid) || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名字" min-width="140">
          <template #default="scope">
            <span>{{ scope.row.name || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="邀请码" min-width="150">
          <template #default="scope">
            <el-tag type="info" effect="plain" class="font-mono">
              {{ scope.row.code }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isDefault" label="默认" width="80" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.isDefault === 1" type="success" size="small">是</el-tag>
            <span v-else>否</span>
          </template>
        </el-table-column>
        <el-table-column label="静态住宅折扣" min-width="120" align="center">
          <template #default="scope">
            <span class="price">{{ formatDiscount(scope.row.staticResidentialDiscount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="动态住宅折扣" min-width="120" align="center">
          <template #default="scope">
            <span class="price">{{ formatDiscount(scope.row.dynamicResidentialDiscount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="静态数据中心折扣" min-width="140" align="center">
          <template #default="scope">
            <span class="price">{{ formatDiscount(scope.row.staticDatacenterDiscount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="移动住宅折扣" min-width="120" align="center">
          <template #default="scope">
            <span class="price">{{ formatDiscount(scope.row.mobileResidentialDiscount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="180">
          <template #default="scope">
            <span class="font-mono">{{ formatDate(scope.row.createdAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="scope">
            <el-button type="primary" link size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增邀请码' : '编辑邀请码'"
      width="520px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="所属用户" prop="uid">
          <el-select
            v-model="formData.uid"
            placeholder="搜索邮箱/UID"
            filterable
            remote
            clearable
            :remote-method="searchUsers"
            :loading="userLoading"
            style="width: 260px"
            :disabled="dialogMode === 'edit'"
          >
            <el-option
              v-for="item in userList"
              :key="item.uid"
              :label="`${item.uid} - ${item.email}`"
              :value="item.uid"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="名字" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="可选，方便区分"
            maxlength="32"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="邀请码" prop="code">
          <el-input
            v-model="formData.code"
            placeholder="不填则随机生成"
            maxlength="32"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="是否默认" prop="isDefault">
          <el-switch
            v-model="formData.isDefault"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
        <el-form-item label="静态住宅折扣" prop="staticResidentialDiscount">
          <el-input-number
            v-model="formData.staticResidentialDiscount"
            :min="0"
            :step="0.01"
            controls-position="right"
          />
          <span class="unit">倍</span>
        </el-form-item>
        <el-form-item label="动态住宅折扣" prop="dynamicResidentialDiscount">
          <el-input-number
            v-model="formData.dynamicResidentialDiscount"
            :min="0"
            :step="0.01"
            controls-position="right"
          />
          <span class="unit">倍</span>
        </el-form-item>
        <el-form-item label="静态数据中心折扣" prop="staticDatacenterDiscount">
          <el-input-number
            v-model="formData.staticDatacenterDiscount"
            :min="0"
            :step="0.01"
            controls-position="right"
          />
          <span class="unit">倍</span>
        </el-form-item>
        <el-form-item label="移动住宅折扣" prop="mobileResidentialDiscount">
          <el-input-number
            v-model="formData.mobileResidentialDiscount"
            :min="0"
            :step="0.01"
            controls-position="right"
          />
          <span class="unit">倍</span>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
            确 定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import request from '../../utils/request'

interface InviteCodeItem {
  id?: number
  uid: number | null
  name?: string
  code: string
  isDefault: number
  staticResidentialDiscount: number | null
  dynamicResidentialDiscount: number | null
  staticDatacenterDiscount: number | null
  mobileResidentialDiscount: number | null
  createdAt?: string
}

interface AccountOption {
  uid: number
  email: string
}

const filters = reactive({
  uid: undefined as number | undefined,
  code: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const tableData = ref<InviteCodeItem[]>([])
const loading = ref(false)
const userLoading = ref(false)
const userList = ref<AccountOption[]>([])

const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const formRef = ref<FormInstance>()
const submitLoading = ref(false)

const formData = reactive<InviteCodeItem>({
  id: undefined,
  uid: null,
  name: '',
  code: '',
  isDefault: 0,
  staticResidentialDiscount: 1,
  dynamicResidentialDiscount: 1,
  staticDatacenterDiscount: 1,
  mobileResidentialDiscount: 1
})

const formRules: FormRules = {
  uid: [{ required: true, message: '请选择所属用户', trigger: 'change' }]
}

const formatDate = (val?: string) => {
  if (!val) return '-'
  return val
}

const formatDiscount = (val?: number | null) => {
  if (val === null || val === undefined) return '100.00%'
  const pct = Number(val) * 100
  return `${pct.toFixed(2)}%`
}

const getEmail = (uid: number): string | undefined => {
  const found = userList.value.find((u) => u.uid === uid)
  return found?.email
}

const fetchInviteCodes = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      size: pagination.size
    }
    if (filters.uid) params.uid = filters.uid
    if (filters.code) params.code = filters.code

    const res: any = await request.get('/web/invite-code/list', { params })
    tableData.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (e) {
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchInviteCodes()
}

const handleReset = () => {
  filters.uid = undefined
  filters.code = ''
  pagination.page = 1
  fetchInviteCodes()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchInviteCodes()
}

const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.page = 1
  fetchInviteCodes()
}

const searchUsers = async (query: string) => {
  userLoading.value = true
  try {
    const params: any = {
      page: 1,
      size: 100000
    }
    if (query) params.email = query
    const res: any = await request.get('/web/account/list', { params })
    userList.value = res.data?.list || []
  } catch (e) {
    userList.value = []
  } finally {
    userLoading.value = false
  }
}

const resetForm = () => {
  formData.id = undefined
  formData.uid = null
  formData.name = ''
  formData.code = ''
  formData.isDefault = 0
  formData.staticResidentialDiscount = 1
  formData.dynamicResidentialDiscount = 1
  formData.staticDatacenterDiscount = 1
  formData.mobileResidentialDiscount = 1
}

const handleAdd = () => {
  dialogMode.value = 'create'
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row: InviteCodeItem) => {
  dialogMode.value = 'edit'
  formData.id = row.id
  formData.uid = row.uid
  formData.name = (row as any).name || ''
  formData.code = row.code
  formData.isDefault = row.isDefault
  formData.staticResidentialDiscount = row.staticResidentialDiscount ?? 0
  formData.dynamicResidentialDiscount = row.dynamicResidentialDiscount ?? 0
  formData.staticDatacenterDiscount = row.staticDatacenterDiscount ?? 0
  formData.mobileResidentialDiscount = row.mobileResidentialDiscount ?? 0
  dialogVisible.value = true
}

const handleDelete = (row: InviteCodeItem) => {
  ElMessageBox.confirm(`确定删除邀请码 ${row.code} 吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await request.post('/web/invite-code/delete', {
        id: row.id
      })
      ElMessage.success('删除成功')
      fetchInviteCodes()
    } catch (e) {}
  }).catch(() => {})
}

const generateCodeIfEmpty = () => {
  if (formData.code && formData.code.trim()) return
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const length = 6
  let result = ''
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * chars.length)
    result += chars.charAt(idx)
  }
  formData.code = result
}

const handleSubmit = () => {
  if (!formRef.value) return
  formRef.value.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    try {
      generateCodeIfEmpty()

      const payload: any = {
        id: formData.id,
        uid: formData.uid,
        name: formData.name,
        code: formData.code,
        isDefault: formData.isDefault,
        staticResidentialDiscount: formData.staticResidentialDiscount,
        dynamicResidentialDiscount: formData.dynamicResidentialDiscount,
        staticDatacenterDiscount: formData.staticDatacenterDiscount,
        mobileResidentialDiscount: formData.mobileResidentialDiscount
      }

      if (dialogMode.value === 'create') {
        await request.post('/web/invite-code/create', payload)
        ElMessage.success('创建成功')
      } else {
        await request.post('/web/invite-code/update', payload)
        ElMessage.success('更新成功')
      }
      dialogVisible.value = false
      fetchInviteCodes()
    } catch (e) {
    } finally {
      submitLoading.value = false
    }
  })
}

onMounted(() => {
  fetchInviteCodes()
  searchUsers('')
})
</script>

<style scoped lang="scss">
.page-container {
  padding: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title {
  font-size: 16px;
  font-weight: 600;
}

.subtitle {
  font-size: 12px;
  color: #909399;
}

.filter-bar {
  margin-bottom: 16px;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.price {
  font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.unit {
  margin-left: 8px;
  color: #909399;
}
</style>
