<template>
  <div class="page-container">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">IP白名单</span>
            <el-tag type="info" size="small" effect="plain" class="count-tag">共 {{ pagination.total }} 条</el-tag>
          </div>
          <div class="header-right">
            <el-button type="primary" :icon="Plus" @click="openAdd">新增白名单</el-button>
          </div>
        </div>
      </template>

      <div class="filter-container">
        <el-form :inline="true" :model="filterForm">
          <el-form-item label="归属用户">
            <el-select
              v-model="filterForm.accountId"
              placeholder="选择用户"
              filterable
              remote
              clearable
              :remote-method="searchUsers"
              :loading="userLoading"
              style="width: 280px"
            >
              <el-option
                v-for="item in userList"
                :key="item.uid"
                :label="item.email"
                :value="item.uid"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div v-loading="loading">
        <el-table :data="tableData" style="width: 100%" stripe border>
          <el-table-column prop="id" label="ID" width="80" align="center" />
          <el-table-column prop="ip" label="IP地址" min-width="200" />
          <el-table-column label="状态" width="120" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.verified ? 'success' : 'info'" size="small">
                {{ scope.row.verified ? '已验证' : '未验证' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" min-width="180">
            <template #default="scope">
              <span class="font-mono">{{ formatTime(scope.row.createdAt) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right" align="center">
            <template #default="scope">
              <el-button link type="primary" @click="toggleVerify(scope.row)">{{ scope.row.verified ? '取消验证' : '验证' }}</el-button>
              <el-button link type="danger" :icon="Delete" @click="confirmDelete(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          background
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" title="新增白名单" width="520px" destroy-on-close>
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px" label-position="left">
        <el-form-item label="归属用户" prop="accountId">
          <el-select
            v-model="formData.accountId"
            placeholder="选择用户"
            filterable
            remote
            clearable
            :remote-method="searchUsers"
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
        <el-form-item label="IP地址" prop="ip">
          <el-input v-model="formData.ip" placeholder="例如 1.2.3.4 / 1.2.3.4/32" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, Search, Refresh, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import request from '../../utils/request'
import dayjs from 'dayjs'

const loading = ref(false)
const userLoading = ref(false)
const userList = ref<any[]>([])
const tableData = ref<any[]>([])

const filterForm = reactive({
  accountId: undefined as number | undefined
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
    if (query) params.email = query
    const res = await request.get('/web/account/list', { params })
    userList.value = res.data?.list || []
  } catch (e) {
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
      accountId: filterForm.accountId
    }
    const res = await request.get('/web/dynamic-account-whitelist/list', { params })
    tableData.value = res.data?.list || []
    pagination.total = res.data?.total || 0
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
  filterForm.accountId = undefined
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

const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()
const formData = reactive({
  accountId: undefined as number | undefined,
  ip: ''
})

const rules = reactive<FormRules>({
  accountId: [{ required: true, message: '请选择用户', trigger: 'blur' }],
  ip: [{ required: true, message: '请输入IP地址', trigger: 'blur' }]
})

const openAdd = () => {
  formData.accountId = filterForm.accountId
  formData.ip = ''
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    // Frontend duplicate guard
    if (formData.accountId && tableData.value.some(item => item.ip === formData.ip)) {
      ElMessage.warning('该IP已在白名单中')
      return
    }
    submitLoading.value = true
    try {
      await request.post('/web/dynamic-account-whitelist/create', formData)
      ElMessage.success('添加成功')
      dialogVisible.value = false
      fetchData()
    } catch (e) {
    } finally {
      submitLoading.value = false
    }
  })
}

const confirmDelete = (row: any) => {
  ElMessageBox.confirm('确定删除该白名单吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await request.post('/web/dynamic-account-whitelist/delete', { id: row.id })
      ElMessage.success('删除成功')
      fetchData()
    } catch (e) {
    }
  })
}

const toggleVerify = async (row: any) => {
  try {
    await request.post('/web/dynamic-account-whitelist/verify', { id: row.id, verified: !row.verified })
    ElMessage.success('状态已更新')
    fetchData()
  } catch (e) {
  }
}

const formatTime = (time: string) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

onMounted(() => {
  fetchData()
  searchUsers('')
})
</script>

<style scoped lang="scss">
.page-container {
  padding: 20px;
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
      font-size: 18px;
      font-weight: 600;
      color: #1d2129;
    }

    .count-tag {
      font-weight: normal;
    }
  }
}

.filter-container {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.font-mono {
  font-family: 'Roboto Mono', monospace;
}
</style>
