<template>
  <div class="page-container">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">动态代理套餐管理</span>
          </div>
          <div class="header-right">
            <el-button type="primary" :icon="Plus" @click="openCreate">新增套餐</el-button>
          </div>
        </div>
      </template>

      <div class="filter-container">
        <el-form :inline="true" :model="filterForm">
          <el-form-item label="类型">
            <el-select v-model="filterForm.type" placeholder="全部类型" clearable style="width: 180px">
              <el-option label="动态住宅" value="residential" />
              <el-option label="移动代理" value="mobile" />
            </el-select>
          </el-form-item>
          <el-form-item label="关键词">
            <el-input v-model="filterForm.keyword" placeholder="套餐编号/名称/描述" clearable style="width: 240px" />
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
          <el-table-column prop="mealNo" label="套餐编号" min-width="160" />
          <el-table-column prop="name" label="名称" min-width="160" />
          <el-table-column prop="type" label="类型" width="120" align="center">
            <template #default="scope">
              <el-tag size="small" :type="scope.row.type === 'residential' ? 'success' : 'warning'">
                {{ formatType(scope.row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="流量(GB)" width="120" align="right">
            <template #default="scope">
              <span class="price text-bold">{{ Number(scope.row.traffic || 0).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="价格" width="120" align="right">
            <template #default="scope">
              <span class="price text-bold">${{ Number(scope.row.price || 0).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="durationDays" label="有效期(天)" width="120" align="center" />
          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
          <el-table-column label="操作" width="200" fixed="right" align="center">
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

    <el-dialog v-model="dialogVisible" :title="dialogType === 'create' ? '新增套餐' : '编辑套餐'" width="560px" destroy-on-close>
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px" label-position="left">
        <el-form-item label="套餐编号" prop="mealNo">
          <el-input v-model="formData.mealNo" placeholder="例如 meal_100gb" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.name" placeholder="套餐名称" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择类型" style="width: 100%">
            <el-option label="动态住宅" value="residential" />
            <el-option label="移动代理" value="mobile" />
          </el-select>
        </el-form-item>
        <el-form-item label="流量(GB)" prop="traffic">
          <el-input-number v-model="formData.traffic" :precision="2" :step="1.0" style="width: 100%" controls-position="right" />
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number v-model="formData.price" :precision="2" :step="1.0" style="width: 100%" controls-position="right" />
        </el-form-item>
        <el-form-item label="有效期(天)" prop="durationDays">
          <el-input-number v-model="formData.durationDays" :min="0" :step="1" style="width: 100%" controls-position="right" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="套餐描述(可选)" />
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
  type: '',
  keyword: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      type: filterForm.type || undefined,
      keyword: filterForm.keyword || undefined
    }
    const res = await request.get('/web/dynamic-proxy-meal/list', { params })
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
  filterForm.type = ''
  filterForm.keyword = ''
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
  mealNo: '',
  name: '',
  type: '',
  traffic: 0,
  price: 0,
  durationDays: 0,
  description: ''
})

const rules = reactive<FormRules>({
  mealNo: [{ required: true, message: '请输入套餐编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入套餐名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'blur' }],
  traffic: [{ required: true, message: '请输入流量', trigger: 'blur' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }]
})

const openCreate = () => {
  dialogType.value = 'create'
  Object.assign(formData, {
    id: undefined,
    mealNo: '',
    name: '',
    type: '',
    traffic: 0,
    price: 0,
    durationDays: 0,
    description: ''
  })
  dialogVisible.value = true
}

const openEdit = (row: any) => {
  dialogType.value = 'edit'
  Object.assign(formData, {
    id: row.id,
    mealNo: row.mealNo,
    name: row.name,
    type: row.type,
    traffic: row.traffic,
    price: row.price,
    durationDays: row.durationDays,
    description: row.description || ''
  })
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    try {
      if (dialogType.value === 'create') {
        await request.post('/web/dynamic-proxy-meal/create', formData)
        ElMessage.success('创建成功')
      } else {
        await request.post('/web/dynamic-proxy-meal/update', formData)
        ElMessage.success('更新成功')
      }
      dialogVisible.value = false
      fetchData()
    } catch (e) {
    } finally {
      submitLoading.value = false
    }
  })
}

const confirmDelete = (row: any) => {
  ElMessageBox.confirm('确定删除该套餐吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await request.post('/web/dynamic-proxy-meal/delete', { id: row.id })
      ElMessage.success('删除成功')
      fetchData()
    } catch (e) {
    }
  })
}

const formatType = (val?: string) => {
  if (!val) return '-'
  return val === 'residential' ? '动态住宅' : '移动代理'
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
@use '../../styles/variables.scss' as *;

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
      font-weight: $font-weight-bold;
      color: $text-primary;
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

.price {
  color: $warning-color;
  font-family: 'Roboto', sans-serif;
}

.text-bold {
  font-weight: $font-weight-bold;
}
</style>
