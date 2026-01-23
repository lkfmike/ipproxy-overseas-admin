<template>
  <div class="page-container">
    <el-card class="box-card" shadow="never">
      <div class="filter-bar">
        <el-form :inline="true" :model="filters" class="filter-form">
          <el-form-item label="关键字">
            <el-input v-model="filters.keyword" placeholder="用户ID/邮箱" clearable @keyup.enter="handleSearch" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">客户折扣管理</span>
          </div>
          <div class="header-right">
            <el-button type="primary" :icon="Plus" @click="handleAdd">新增折扣</el-button>
          </div>
        </div>
      </template>

      <el-table 
        v-if="mounted"
        :data="tableData" 
        style="width: 100%" 
        border 
        v-loading="loading" 
        stripe
      >
        <el-table-column prop="uid" label="UID" width="100" align="center" />
        <el-table-column prop="email" label="邮箱" min-width="220">
          <template #default="scope">
            {{ scope.row.email || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="staticResidentialDiscount" label="静态住宅折扣" width="150" align="center">
            <template #default="scope">
                {{ scope.row.staticResidentialDiscount || '-' }}
            </template>
        </el-table-column>
        <el-table-column prop="dynamicResidentialDiscount" label="动态住宅折扣" width="150" align="center">
            <template #default="scope">
                {{ scope.row.dynamicResidentialDiscount || '-' }}
            </template>
        </el-table-column>
        <el-table-column prop="staticDatacenterDiscount" label="静态数据中心折扣" width="150" align="center">
            <template #default="scope">
                {{ scope.row.staticDatacenterDiscount || '-' }}
            </template>
        </el-table-column>
        <el-table-column prop="mobileResidentialDiscount" label="移动住宅折扣" width="150" align="center">
            <template #default="scope">
                {{ scope.row.mobileResidentialDiscount || '-' }}
            </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="160">
            <template #default="scope">
                {{ formatTime(scope.row.createTime) }}
            </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" min-width="160">
            <template #default="scope">
                {{ formatTime(scope.row.updateTime) }}
            </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-divider direction="vertical" />
            <el-button link type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增折扣' : '编辑折扣'"
      width="500px"
    >
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="140px">
        <el-form-item label="用户" prop="uid">
          <el-select
            v-model="formData.uid"
            filterable
            remote
            reserve-keyword
            placeholder="请输入邮箱搜索"
            :remote-method="searchUsers"
            :loading="userLoading"
            style="width: 100%"
            :disabled="dialogType === 'edit'"
          >
            <el-option
              v-for="item in userList"
              :key="item.uid"
              :label="item.email + ' (UID: ' + item.uid + ')'"
              :value="item.uid"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="静态住宅折扣" prop="staticResidentialDiscount">
          <el-input-number v-model="formData.staticResidentialDiscount" :precision="2" :step="0.01" :min="0" :max="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="动态住宅折扣" prop="dynamicResidentialDiscount">
          <el-input-number v-model="formData.dynamicResidentialDiscount" :precision="2" :step="0.01" :min="0" :max="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="静态数据中心折扣" prop="staticDatacenterDiscount">
          <el-input-number v-model="formData.staticDatacenterDiscount" :precision="2" :step="0.01" :min="0" :max="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="移动住宅折扣" prop="mobileResidentialDiscount">
          <el-input-number v-model="formData.mobileResidentialDiscount" :precision="2" :step="0.01" :min="0" :max="1" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import request from '../../utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

interface AccountDiscount {
  id?: number
  uid: number
  email?: string
  staticResidentialDiscount?: number
  dynamicResidentialDiscount?: number
  staticDatacenterDiscount?: number
  mobileResidentialDiscount?: number
  createTime?: string
  updateTime?: string
}

const mounted = ref(false)
const loading = ref(false)
const tableData = ref<AccountDiscount[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const dialogType = ref<'create' | 'edit'>('create')
const formRef = ref<FormInstance>()

// User search
const userLoading = ref(false)
const userList = ref<any[]>([])

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

const formData = reactive<AccountDiscount>({
  uid: undefined as any,
  staticResidentialDiscount: 1.00,
  dynamicResidentialDiscount: 1.00,
  staticDatacenterDiscount: 1.00,
  mobileResidentialDiscount: 1.00
})

const filters = reactive({
  keyword: ''
})

const rules = reactive<FormRules>({
  uid: [
    { required: true, message: '请选择用户', trigger: 'change' }
  ]
})

const formatTime = (time: string | undefined) => {
  if (!time) return '-'
  return new Date(time).toLocaleString()
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      keyword: filters.keyword || undefined
    }
    const res = await request.get('/account-discount/list', { params })
    tableData.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (error) {
    console.error('Fetch list error', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchList()
}

const handleReset = () => {
  filters.keyword = ''
  handleSearch()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchList()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchList()
}

const handleAdd = () => {
  dialogType.value = 'create'
  formData.id = undefined
  formData.uid = undefined as any
  formData.staticResidentialDiscount = 1.00
  formData.dynamicResidentialDiscount = 1.00
  formData.staticDatacenterDiscount = 1.00
  formData.mobileResidentialDiscount = 1.00
  searchUsers('')
  dialogVisible.value = true
}

const handleEdit = (row: AccountDiscount) => {
  dialogType.value = 'edit'
  Object.assign(formData, row)
  if (row.uid && row.email) {
    userList.value = [{ uid: row.uid, email: row.email }]
  }
  dialogVisible.value = true
}

const handleDelete = (row: AccountDiscount) => {
  ElMessageBox.confirm('确认删除该用户的折扣配置吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await request.post('/account-discount/delete', { id: row.id })
      ElMessage.success('删除成功')
      fetchList()
    } catch (error) {
      console.error('Delete error', error)
    }
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid, fields) => {
    if (valid) {
      try {
        const url = dialogType.value === 'create' ? '/account-discount/create' : '/account-discount/update'
        await request.post(url, formData)
        ElMessage.success(dialogType.value === 'create' ? '新增成功' : '更新成功')
        dialogVisible.value = false
        fetchList()
      } catch (error) {
        console.error('Submit error', error)
      }
    }
  })
}

onMounted(() => {
  mounted.value = true
  fetchList()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
}
.filter-bar {
  margin-bottom: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
