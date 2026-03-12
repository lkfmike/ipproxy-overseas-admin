<template>
  <div class="page-container">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">站内信</span>
            <span class="subtitle">用于在系统内向用户展示公告或通知</span>
          </div>
          <div class="header-right">
            <el-button type="primary" :icon="Plus" @click="openCreate">新增站内信</el-button>
            <el-button :icon="Refresh" @click="fetchData">刷新</el-button>
          </div>
        </div>
      </template>

      <div class="filter-container">
        <el-form :inline="true" :model="filterForm">
          <el-form-item label="标题">
            <el-input v-model="filterForm.title" placeholder="模糊匹配" clearable style="width: 240px" />
          </el-form-item>
          <el-form-item label="是否显示">
            <el-select v-model="filterForm.visible" placeholder="全部" clearable style="width: 160px">
              <el-option label="显示" :value="1" />
              <el-option label="隐藏" :value="0" />
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
          <el-table-column prop="title" label="标题" min-width="240" show-overflow-tooltip />
          <el-table-column label="是否显示" width="140" align="center">
            <template #default="scope">
              <el-switch
                v-model="scope.row.visible"
                :active-value="1"
                :inactive-value="0"
                @change="onToggleVisible(scope.row, $event)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" min-width="180">
            <template #default="scope">
              <span class="font-mono">{{ formatTime(scope.row?.createdAt) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="updatedAt" label="更新时间" min-width="180">
            <template #default="scope">
              <span class="font-mono">{{ formatTime(scope.row?.updatedAt) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right" align="center">
            <template #default="scope">
              <el-button link type="primary" :icon="Edit" @click="openEdit(scope.row)">编辑</el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogType === 'create' ? '新增站内信' : '编辑站内信'" width="680px" destroy-on-close>
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px" label-position="left">
        <el-form-item label="标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="formData.content" type="textarea" :rows="6" placeholder="支持纯文本" />
        </el-form-item>
        <el-form-item label="是否显示" prop="visible">
          <el-switch v-model="formData.visible" :active-value="1" :inactive-value="0" />
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
import { Plus, Search, Refresh, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import request from '../../utils/request'

const loading = ref(false)
const tableData = ref<any[]>([])

const filterForm = reactive({
  title: '',
  visible: undefined as number | undefined
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      size: pagination.size
    }
    if (filterForm.title) params.title = filterForm.title
    if (filterForm.visible !== undefined) params.visible = filterForm.visible
    const res = await request.get('/api/web/system-message/list', { params })
    tableData.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const resetSearch = () => {
  filterForm.title = ''
  filterForm.visible = undefined
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
const dialogType = ref<'create' | 'edit'>('create')
const submitLoading = ref(false)
const formRef = ref<FormInstance>()
const formData = reactive({
  id: undefined as number | undefined,
  title: '',
  content: '',
  visible: 1
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

const openCreate = () => {
  dialogType.value = 'create'
  Object.assign(formData, { id: undefined, title: '', content: '', visible: 1 })
  dialogVisible.value = true
}

const openEdit = (row: any) => {
  dialogType.value = 'edit'
  Object.assign(formData, {
    id: row.id,
    title: row.title,
    content: row.content,
    visible: row.visible
  })
  dialogVisible.value = true
}

const submitForm = () => {
  formRef.value?.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    try {
      if (dialogType.value === 'create') {
        await request.post('/api/web/system-message/create', formData)
        ElMessage.success('新增成功')
      } else {
        await request.post('/api/web/system-message/update', formData)
        ElMessage.success('更新成功')
      }
      dialogVisible.value = false
      fetchData()
    } catch (e) {
      ElMessage.error('提交失败')
    } finally {
      submitLoading.value = false
    }
  })
}

const confirmDelete = (row: any) => {
  ElMessageBox.confirm('确定删除该站内信吗？', '提示', { type: 'warning' })
    .then(async () => {
      try {
        await request.post('/api/web/system-message/delete', { id: row.id })
        ElMessage.success('删除成功')
        fetchData()
      } catch (e) {
        ElMessage.error('删除失败')
      }
    })
    .catch(() => {})
}

const onToggleVisible = async (row: any, value: number) => {
  const prev = row.visible
  row.visible = value
  const text = value === 1 ? '显示' : '隐藏'
  try {
    await ElMessageBox.confirm(`确定将该站内信设置为「${text}」吗？`, '提示', { type: 'warning' })
    await request.post('/api/web/system-message/update', { id: row.id, visible: value })
    ElMessage.success('更新成功')
  } catch (e: any) {
    row.visible = prev
    if (e && e !== 'cancel') {
      ElMessage.error('更新显示状态失败')
    }
  }
}

const formatTime = (val: any) => {
  if (!val) return '-'
  try {
    const d = new Date(val)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    const ss = String(d.getSeconds()).padStart(2, '0')
    return `${y}-${m}-${day} ${hh}:${mm}:${ss}`
  } catch {
    return String(val)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.page-container {
  padding: 20px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.title {
  font-size: 16px;
  font-weight: 600;
}
.subtitle {
  margin-left: 12px;
  color: #999;
  font-size: 12px;
}
.filter-container {
  margin: 12px 0 16px;
}
.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}
</style>
