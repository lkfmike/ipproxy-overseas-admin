<template>
  <div class="page-container">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">动态网关线路池</span>
          </div>
          <div class="header-right">
            <el-button type="primary" :icon="Plus" @click="openCreate">新增线路</el-button>
            <el-button :icon="Refresh" @click="fetchData">刷新</el-button>
          </div>
        </div>
      </template>

      <div class="filter-container">
        <el-form :inline="true" :model="filters">
          <el-form-item label="线路主机名">
            <el-input v-model="filters.lineHostname" placeholder="line.example.com" clearable style="width: 240px" />
          </el-form-item>
          <el-form-item label="网关主机名">
            <el-input v-model="filters.gatewayHostname" placeholder="gateway.example.com" clearable style="width: 240px" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="filters.mark" placeholder="备注模糊匹配" clearable style="width: 200px" />
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div v-loading="loading">
        <el-table :data="tableData" style="width: 100%" stripe border>
          <el-table-column label="线路主机名" min-width="220">
            <template #default="scope">
              <span :title="scope.row?.lineHostname">{{ scope.row?.lineHostname ?? '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="网关主机名" min-width="220">
            <template #default="scope">
              <span :title="scope.row?.gatewayHostname">{{ scope.row?.gatewayHostname ?? '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="备注" min-width="160" align="center">
            <template #default="scope">
              <span>{{ scope.row?.mark ?? '-' }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="创建时间" min-width="180">
            <template #default="scope">
              <span class="font-mono">{{ formatTime(scope.row?.createTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="更新时间" min-width="180">
            <template #default="scope">
              <span class="font-mono">{{ formatTime(scope.row?.updateTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right" align="center">
            <template #default="scope">
              <el-button link type="primary" @click="handleEdit(scope.row)">编辑</el-button>
              <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
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
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" destroy-on-close>
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px" label-position="left">
        <el-form-item label="线路主机名" prop="lineHostname">
          <el-input v-model="formData.lineHostname" placeholder="line.example.com" :disabled="dialogType==='edit'" />
        </el-form-item>
        <el-form-item label="网关主机名" prop="gatewayHostname">
          <el-input v-model="formData.gatewayHostname" placeholder="gateway.example.com" />
        </el-form-item>
        <el-form-item label="备注" prop="mark">
          <el-input v-model="formData.mark" placeholder="备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible=false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
  </template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import dayjs from 'dayjs'
import request from '../../utils/request'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const tableData = ref<any[]>([])
const filters = reactive({
  lineHostname: '',
  gatewayHostname: '',
  mark: '',
  
})
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})
const dialogVisible = ref(false)
const dialogType = ref<'create' | 'edit'>('create')
const dialogTitle = ref('新增线路')
const submitLoading = ref(false)
const formRef = ref<FormInstance>()
const formData = reactive<any>({
  lineHostname: '',
  gatewayHostname: '',
  mark: ''
})
const rules = reactive<FormRules>({
  lineHostname: [{ required: true, message: '请输入线路主机名', trigger: 'blur' }],
  gatewayHostname: [{ required: true, message: '请输入网关主机名', trigger: 'blur' }],
  mark: [{ required: false }]
})

const fetchData = async () => {
  loading.value = true
  try {
    const body: any = {
      page: pagination.page,
      size: pagination.size
    }
    if (filters.lineHostname) body.lineHostname = filters.lineHostname
    if (filters.gatewayHostname) body.gatewayHostname = filters.gatewayHostname
    if (filters.mark) body.mark = filters.mark
    
    const res = await request.post('/web/dynamic-gateway/lines', body)
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
  filters.lineHostname = ''
  filters.gatewayHostname = ''
  filters.mark = ''
  
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

const formatTime = (time: string | undefined) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const openCreate = () => {
  dialogType.value = 'create'
  dialogTitle.value = '新增线路'
  Object.assign(formData, {
    lineHostname: '',
    gatewayHostname: '',
    mark: ''
  })
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  dialogType.value = 'edit'
  dialogTitle.value = '编辑线路'
  Object.assign(formData, {
    lineHostname: row.lineHostname,
    gatewayHostname: row.gatewayHostname,
    mark: row.mark
  })
  dialogVisible.value = true
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定删除该线路吗？此操作不可恢复', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    submitLoading.value = true
    await request.post('/web/dynamic-gateway/delete', { lineHostname: row.lineHostname })
    ElMessage.success('删除成功')
    fetchData()
  } catch (e) {
  } finally {
    submitLoading.value = false
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    try {
      if (dialogType.value === 'create') {
        await request.post('/web/dynamic-gateway/create', {
          lineHostname: formData.lineHostname,
          gatewayHostname: formData.gatewayHostname,
          mark: formData.mark
        })
      } else {
        await request.post('/web/dynamic-gateway/update', {
          lineHostname: formData.lineHostname,
          gatewayHostname: formData.gatewayHostname,
          mark: formData.mark
        })
      }
      dialogVisible.value = false
      fetchData()
    } finally {
      submitLoading.value = false
    }
  })
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.page-container {
  padding: 16px;
}
.box-card {
  border-radius: 10px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.title {
  font-weight: 600;
  font-size: 16px;
}
.filter-container {
  margin-bottom: 16px;
}
.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
