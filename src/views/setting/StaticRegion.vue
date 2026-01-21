<template>
  <div class="page-container">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">静态地区设置</span>
            <el-tag type="info" size="small" effect="plain" class="count-tag">共 {{ total }} 条数据</el-tag>
          </div>
          <el-button type="primary" :icon="Plus" @click="handleCreate">新增地区</el-button>
        </div>
      </template>

      <div class="filter-container">
        <el-form :inline="true" :model="filterForm" class="demo-form-inline">
          <el-form-item label="区域代码">
            <el-input v-model="filterForm.area" placeholder="请输入区域代码" clearable @keyup.enter="handleSearch" />
          </el-form-item>
          <el-form-item label="地区代码">
            <el-input v-model="filterForm.region" placeholder="请输入地区代码" clearable @keyup.enter="handleSearch" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="tableData" style="width: 100%" v-loading="loading" stripe border>
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="area" label="区域代码" min-width="120" show-overflow-tooltip />
        <el-table-column prop="areaCn" label="区域中文名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="region" label="地区代码" min-width="120" show-overflow-tooltip />
        <el-table-column prop="regionCn" label="地区中文名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="isShow" label="是否显示" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.isShow === 1 ? 'success' : 'info'">
              {{ scope.row.isShow === 1 ? '显示' : '隐藏' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isAvailable" label="是否可用" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.isAvailable === 1 ? 'success' : 'danger'">
              {{ scope.row.isAvailable === 1 ? '可用' : '不可用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
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
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          background
        />
      </div>
    </el-card>

    <!-- Dialog -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px" label-position="left">
        <el-form-item label="区域代码" prop="area">
          <el-input v-model="form.area" placeholder="请输入区域代码" />
        </el-form-item>
        <el-form-item label="区域中文名称" prop="areaCn">
          <el-input v-model="form.areaCn" placeholder="请输入区域中文名称" />
        </el-form-item>
        <el-form-item label="地区代码" prop="region">
          <el-input v-model="form.region" placeholder="请输入地区代码" />
        </el-form-item>
        <el-form-item label="地区中文名称" prop="regionCn">
          <el-input v-model="form.regionCn" placeholder="请输入地区中文名称" />
        </el-form-item>
        <el-form-item label="是否显示" prop="isShow">
          <el-switch v-model="form.isShow" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="是否可用" prop="isAvailable">
          <el-switch v-model="form.isAvailable" :active-value="1" :inactive-value="0" />
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
import { useRoute, useRouter } from 'vue-router'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import request from '../../utils/request'

interface AreaRegionInfo {
  id?: number
  area: string
  areaCn: string
  region: string
  regionCn: string
  isShow: number
  isAvailable: number
}

const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const tableData = ref<AreaRegionInfo[]>([])
const route = useRoute()
const router = useRouter()

const filterForm = reactive({
  area: '',
  region: ''
})

const dialogVisible = ref(false)
const dialogTitle = ref('新增地区')
const submitLoading = ref(false)
const formRef = ref<FormInstance>()
const form = reactive<AreaRegionInfo>({
  area: '',
  areaCn: '',
  region: '',
  regionCn: '',
  isShow: 1,
  isAvailable: 1
})

const rules = reactive<FormRules>({
  area: [{ required: true, message: '请输入区域代码', trigger: 'blur' }],
  areaCn: [{ required: true, message: '请输入区域中文名称', trigger: 'blur' }],
  region: [{ required: true, message: '请输入地区代码', trigger: 'blur' }],
  regionCn: [{ required: true, message: '请输入地区中文名称', trigger: 'blur' }]
})

const fetchData = async () => {
  loading.value = true
  try {
    const res: any = await request.get('/area-region/list', {
      params: {
        page: currentPage.value,
        size: pageSize.value,
        area: filterForm.area,
        region: filterForm.region
      }
    })
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const syncQuery = () => {
  router.replace({
    query: {
      page: String(currentPage.value),
      size: String(pageSize.value),
      area: filterForm.area || undefined,
      region: filterForm.region || undefined
    }
  })
}

const initFromQuery = () => {
  const q = route.query as Record<string, any>
  if (q.page) currentPage.value = Number(q.page) || 1
  if (q.size) pageSize.value = Number(q.size) || 10
  if (q.area) filterForm.area = String(q.area)
  if (q.region) filterForm.region = String(q.region)
}

const handleSearch = () => {
  currentPage.value = 1
  syncQuery()
  fetchData()
}

const handleReset = () => {
  filterForm.area = ''
  filterForm.region = ''
  currentPage.value = 1
  syncQuery()
  handleSearch()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  syncQuery()
  fetchData()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  syncQuery()
  fetchData()
}

const handleCreate = () => {
  dialogTitle.value = '新增地区'
  form.id = undefined
  form.area = ''
  form.areaCn = ''
  form.region = ''
  form.regionCn = ''
  form.isShow = 1
  form.isAvailable = 1
  dialogVisible.value = true
}

const handleEdit = (row: AreaRegionInfo) => {
  dialogTitle.value = '编辑地区'
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleDelete = (row: AreaRegionInfo) => {
  ElMessageBox.confirm('确定要删除该记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await request.post('/area-region/delete', { id: row.id })
      ElMessage.success('删除成功')
      fetchData()
    } catch (error) {
      console.error(error)
    }
  })
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        const url = form.id ? '/area-region/update' : '/area-region/create'
        await request.post(url, form)
        ElMessage.success(form.id ? '更新成功' : '创建成功')
        dialogVisible.value = false
        fetchData()
      } catch (error) {
        console.error(error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

onMounted(() => {
  initFromQuery()
  fetchData()
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
      font-size: 16px;
      font-weight: 600;
      color: #1d2129;
    }
    .count-tag {
      font-weight: normal;
    }
  }
}

.filter-container {
  margin-bottom: 24px;
  background-color: #f7f8fa;
  padding: 16px;
  border-radius: 4px;

  :deep(.el-form-item) {
    margin-bottom: 0;
    margin-right: 24px;
  }
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

@media screen and (max-width: 768px) {
  .filter-container {
    padding: 12px;
    :deep(.el-form-item) {
      margin-right: 0;
      margin-bottom: 12px;
      width: 100%;
      .el-form-item__content {
        width: 100%;
      }
    }
  }
}
</style>
