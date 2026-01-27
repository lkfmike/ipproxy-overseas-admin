<template>
  <div class="page-container">
    <el-card class="box-card" shadow="never">
      <div class="filter-bar">
        <el-form :inline="true" :model="filters" class="filter-form">
          <el-form-item label="类型">
            <el-select v-model="filters.type" placeholder="请选择类型" clearable style="width: 160px">
              <el-option label="数据中心 (hosting)" value="hosting" />
              <el-option label="静态住宅 (isp)" value="isp" />
            </el-select>
          </el-form-item>
          <el-form-item label="质量">
            <el-select v-model="filters.quality" placeholder="请选择质量" clearable style="width: 160px">
              <el-option
                v-for="q in filterQualityOptions"
                :key="q.value"
                :label="q.label"
                :value="q.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="区域">
            <el-input v-model="filters.area" placeholder="区域" clearable />
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
            <span class="title">地区单价配置</span>
          </div>
          <div class="header-right">
            <el-button type="primary" :icon="Plus" @click="handleAdd">新增规则</el-button>
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
        <el-table-column prop="type" label="类型" width="120">
          <template #default="scope">
            {{ formatTerm(scope.row.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="quality" label="质量" width="120">
          <template #default="scope">
            {{ formatTerm(scope.row.quality) }}
          </template>
        </el-table-column>
        <el-table-column prop="area" label="区域" min-width="120" />
        <el-table-column prop="region" label="地区" min-width="120" />
        <el-table-column prop="price" label="价格" width="120" align="right">
          <template #default="scope">
            <span class="price-text">{{ scope.row.price }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center">
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
      :title="dialogType === 'create' ? '新增规则' : '编辑规则'"
      width="500px"
    >
      <el-form :model="formData" label-width="100px">
        <el-form-item label="类型">
          <el-select v-model="formData.type" placeholder="请选择类型" style="width: 100%" @change="handleTypeChange">
            <el-option label="数据中心 (hosting)" value="hosting" />
            <el-option label="静态住宅 (isp)" value="isp" />
          </el-select>
        </el-form-item>
        <el-form-item label="质量">
          <el-select v-model="formData.quality" placeholder="请选择质量" style="width: 100%">
            <el-option v-for="q in qualityOptions" :key="q.value" :label="q.label" :value="q.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="区域">
          <el-input v-model="formData.area" />
        </el-form-item>
        <el-form-item label="地区">
          <el-input v-model="formData.region" />
        </el-form-item>
        <el-form-item label="价格">
          <el-input-number v-model="formData.price" :precision="2" :step="0.1" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted, computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { Plus, Search, Refresh } from '@element-plus/icons-vue'
  import request from '../../utils/request'
  import { ElMessage, ElMessageBox } from 'element-plus'
  
  // Helper function to format technical terms
  const formatTerm = (term: string) => {
    if (!term) return ''
    const map: Record<string, string> = {
      'L3': '普通',
      'L4': '原生',
      'isp': '静态住宅',
      'hosting': '数据中心'
    }
    return map[term] || term
  }

interface StaticProxyPrice {
  id?: number
  type: string
  quality: string
  area: string
  region: string
  price: number
}

const mounted = ref(false)
const loading = ref(false)
const tableData = ref<StaticProxyPrice[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const dialogType = ref<'create' | 'edit'>('create')
const formData = reactive<StaticProxyPrice>({
  type: 'hosting',
  quality: 'L3',
  area: '',
  region: '',
  price: 0
})

const qualityOptions = computed(() => {
  return formData.type === 'isp'
    ? [{ value: 'L4', label: 'L4 原生' }]
    : [{ value: 'L3', label: 'L3 普通' }]
})

const filterQualityOptions = computed(() => {
  if (filters.type === 'isp') {
    return [{ value: 'L4', label: 'L4 原生' }]
  }
  if (filters.type === 'hosting') {
    return [{ value: 'L3', label: 'L3 普通' }]
  }
  return [
    { value: 'L3', label: 'L3 普通' },
    { value: 'L4', label: 'L4 原生' }
  ]
})

// Filters
const filters = reactive({
  type: '',
  quality: '',
  area: ''
})
const route = useRoute()
const router = useRouter()

const fetchList = async () => {
  console.log('fetchList start')
  loading.value = true
  try {
    const params = {
        page: currentPage.value,
        size: pageSize.value,
        type: filters.type || undefined,
        quality: filters.quality || undefined,
        area: filters.area || undefined,
    }
    const res = await request.get('/web/static-proxy-price/list', { params })
    console.log('fetchList success', res)
    tableData.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (error) {
    console.error('Fetch list error', error)
  } finally {
    loading.value = false
  }
}

const syncQuery = () => {
  router.replace({
    query: {
      page: String(currentPage.value),
      size: String(pageSize.value),
      type: filters.type || undefined,
      quality: filters.quality || undefined,
      area: filters.area || undefined,
    }
  })
}

const initFromQuery = () => {
  try {
    const q = route.query as Record<string, any>
    if (q.page) currentPage.value = Number(q.page) || 1
    if (q.size) pageSize.value = Number(q.size) || 10
    if (q.type) filters.type = String(q.type)
    if (q.quality) filters.quality = String(q.quality)
    if (q.area) filters.area = String(q.area)
  } catch (e) {
    console.error('initFromQuery error', e)
  }
}

const handleSearch = () => {
  currentPage.value = 1
  syncQuery()
  fetchList()
}

const handleReset = () => {
  Object.assign(filters, {
    type: '',
    quality: '',
    area: ''
  })
  currentPage.value = 1
  syncQuery()
  fetchList()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  syncQuery()
  fetchList()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  syncQuery()
  fetchList()
}

const handleAdd = () => {
  dialogType.value = 'create'
  Object.assign(formData, {
    type: 'hosting',
    quality: 'L3',
    area: '',
    region: '',
    price: 0
  })
  delete formData.id
  dialogVisible.value = true
}

const handleEdit = (row: StaticProxyPrice) => {
  dialogType.value = 'edit'
  Object.assign(formData, row)
  dialogVisible.value = true
}

const handleTypeChange = (val: string) => {
  formData.quality = val === 'isp' ? 'L4' : 'L3'
}

const handleDelete = (row: StaticProxyPrice) => {
  ElMessageBox.confirm('确定要删除这条规则吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await request.post('/web/static-proxy-price/delete', { id: row.id })
      ElMessage.success('删除成功')
      fetchList()
    } catch (error) {
      console.error(error)
    }
  })
}

const handleSubmit = async () => {
  try {
    const url = dialogType.value === 'create' ? '/web/static-proxy-price/create' : '/web/static-proxy-price/update'
    await request.post(url, formData)
    ElMessage.success(dialogType.value === 'create' ? '创建成功' : '更新成功')
    dialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  console.log('Pricing.vue mounted')
  mounted.value = true
  initFromQuery()
  fetchList()
})
</script>

<style scoped lang="scss">
.page-container {
  padding: 20px;
}

.filter-bar {
  margin-bottom: 12px;
  .filter-form :deep(.el-form-item) {
    margin-bottom: 0;
    margin-right: 12px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .header-left {
    .title {
      font-size: 16px;
      font-weight: bold;
    }
  }
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.price-text {
  font-weight: bold;
  color: #f56c6c;
}

.tips {
  font-size: 12px;
  color: #909399;
  margin-left: 10px;
}
</style>
