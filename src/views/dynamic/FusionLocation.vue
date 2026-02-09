<template>
  <div class="page-container">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">动态地区管理</span>
            <span class="subtitle">统一地区与供应商映射配置</span>
          </div>
          <div class="header-right">
            <el-button type="primary" :icon="Plus" @click="openCreate">新增地区</el-button>
            <el-button :icon="Refresh" @click="fetchData">刷新</el-button>
          </div>
        </div>
      </template>

      <div class="filter-container">
        <el-form :inline="true" :model="filters">
          <el-form-item label="国家">
            <el-input v-model="filters.area" clearable style="width: 200px" />
          </el-form-item>
          <el-form-item label="州">
            <el-input v-model="filters.region" clearable style="width: 200px" />
          </el-form-item>
          <el-form-item label="城市">
            <el-input v-model="filters.city" clearable style="width: 220px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div v-loading="loading">
        <el-table :data="tableData" style="width: 100%" stripe border size="small">
          <el-table-column prop="id" label="ID" width="80" align="center" />
          <el-table-column label="基础" min-width="240">
            <template #default="scope">
              <div>国家: {{ scope.row.area || '-' }}</div>
              <div>州: {{ scope.row.region || '-' }}</div>
              <div>城市: {{ scope.row.city || '-' }}</div>
            </template>
          </el-table-column>
          <el-table-column label="Infatica" min-width="260">
            <template #default="scope">
              <div>国家: {{ scope.row.infaticaArea || '-' }}</div>
              <div>州: {{ scope.row.infaticaRegion || '-' }}</div>
              <div>城市: {{ scope.row.infaticaCity || '-' }}</div>
              <div class="support-tags">
                <el-tag size="small" :type="scope.row.infaticaAreaSupport ? 'success' : 'danger'">
                  国家 {{ scope.row.infaticaAreaSupport ? '支持' : '不支持' }}
                </el-tag>
                <el-tag size="small" :type="scope.row.infaticaRegionSupport ? 'success' : 'danger'">
                  州 {{ scope.row.infaticaRegionSupport ? '支持' : '不支持' }}
                </el-tag>
                <el-tag size="small" :type="scope.row.infaticaCitySupport ? 'success' : 'danger'">
                  城市 {{ scope.row.infaticaCitySupport ? '支持' : '不支持' }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="NetNut" min-width="260">
            <template #default="scope">
              <div>国家: {{ scope.row.netnutArea || '-' }}</div>
              <div>州: {{ scope.row.netnutRegion || '-' }}</div>
              <div>城市: {{ scope.row.netnutCity || '-' }}</div>
              <div class="support-tags">
                <el-tag size="small" :type="scope.row.netnutAreaSupport ? 'success' : 'danger'">
                  国家 {{ scope.row.netnutAreaSupport ? '支持' : '不支持' }}
                </el-tag>
                <el-tag size="small" :type="scope.row.netnutRegionSupport ? 'success' : 'danger'">
                  州 {{ scope.row.netnutRegionSupport ? '支持' : '不支持' }}
                </el-tag>
                <el-tag size="small" :type="scope.row.netnutCitySupport ? 'success' : 'danger'">
                  城市 {{ scope.row.netnutCitySupport ? '支持' : '不支持' }}
                </el-tag>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="140" fixed="right" align="center">
            <template #default="scope">
              <el-button link type="primary" @click="openEdit(scope.row)">编辑</el-button>
              <el-button link type="danger" @click="confirmDelete(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :small="false"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="1000px" class="no-scroll-dialog" align-center>
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="140px">
        <el-divider content-position="left" class="section-divider">基础信息</el-divider>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="国家" prop="area">
              <el-input v-model="formData.area" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="州" prop="region">
              <el-input v-model="formData.region" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="城市" prop="city">
              <el-input v-model="formData.city" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left" class="section-divider">Infatica 映射</el-divider>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="Infatica 国家">
              <el-input v-model="formData.infaticaArea" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Infatica 州">
              <el-input v-model="formData.infaticaRegion" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Infatica 城市">
              <el-input v-model="formData.infaticaCity" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left" class="section-divider">Infatica 支持</el-divider>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="国家支持">
              <el-switch v-model="formData.infaticaAreaSupport" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="州支持">
              <el-switch v-model="formData.infaticaRegionSupport" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="城市支持">
              <el-switch v-model="formData.infaticaCitySupport" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left" class="section-divider">NetNut 映射</el-divider>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="NetNut 国家">
              <el-input v-model="formData.netnutArea" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="NetNut 州">
              <el-input v-model="formData.netnutRegion" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="NetNut 城市">
              <el-input v-model="formData.netnutCity" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left" class="section-divider">NetNut 支持</el-divider>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="国家支持">
              <el-switch v-model="formData.netnutAreaSupport" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="州支持">
              <el-switch v-model="formData.netnutRegionSupport" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="城市支持">
              <el-switch v-model="formData.netnutCitySupport" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
        </el-row>
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
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import request from '../../utils/request'

interface FusionLocation {
  id?: number
  area: string
  region: string
  city: string
  infaticaArea?: string
  infaticaRegion?: string
  infaticaCity?: string
  netnutArea?: string
  netnutRegion?: string
  netnutCity?: string
  infaticaAreaSupport?: number
  infaticaRegionSupport?: number
  infaticaCitySupport?: number
  netnutAreaSupport?: number
  netnutRegionSupport?: number
  netnutCitySupport?: number
}

const loading = ref(false)
const tableData = ref<FusionLocation[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const filters = reactive({
  area: '',
  region: '',
  city: ''
})

const formRef = ref<FormInstance>()
const dialogVisible = ref(false)
const dialogTitle = ref('新增地区')
const submitLoading = ref(false)
const formData = reactive<FusionLocation>({
  area: '',
  region: '',
  city: '',
  infaticaArea: '',
  infaticaRegion: '',
  infaticaCity: '',
  netnutArea: '',
  netnutRegion: '',
  netnutCity: '',
  infaticaAreaSupport: 0,
  infaticaRegionSupport: 0,
  infaticaCitySupport: 0,
  netnutAreaSupport: 0,
  netnutRegionSupport: 0,
  netnutCitySupport: 0
})
const rules = reactive<FormRules>({
  area: [{ required: true, message: '请输入国家', trigger: 'blur' }],
  region: [{ required: true, message: '请输入州', trigger: 'blur' }],
  city: [{ required: true, message: '请输入城市', trigger: 'blur' }]
})

const fetchData = async () => {
  loading.value = true
  try {
    const res: any = await request.post('/web/dynamic-region/locations', {
      page: currentPage.value,
      size: pageSize.value,
      area: filters.area || undefined,
      region: filters.region || undefined,
      city: filters.city || undefined
    })
    const data = res.data
    tableData.value = data.list || []
    total.value = data.total || 0
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchData()
}

const resetSearch = () => {
  filters.area = ''
  filters.region = ''
  filters.city = ''
  currentPage.value = 1
  fetchData()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  fetchData()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchData()
}

const openCreate = () => {
  dialogTitle.value = '新增地区'
  Object.assign(formData, {
    id: undefined,
    area: '',
    region: '',
    city: '',
    infaticaArea: '',
    infaticaRegion: '',
    infaticaCity: '',
    netnutArea: '',
    netnutRegion: '',
    netnutCity: '',
    infaticaAreaSupport: 0,
    infaticaRegionSupport: 0,
    infaticaCitySupport: 0,
    netnutAreaSupport: 0,
    netnutRegionSupport: 0,
    netnutCitySupport: 0
  })
  dialogVisible.value = true
}

const openEdit = (row: FusionLocation) => {
  dialogTitle.value = '编辑地区'
  Object.assign(formData, {
    id: row.id,
    area: row.area,
    region: row.region,
    city: row.city,
    infaticaArea: row.infaticaArea || '',
    infaticaRegion: row.infaticaRegion || '',
    infaticaCity: row.infaticaCity || '',
    netnutArea: row.netnutArea || '',
    netnutRegion: row.netnutRegion || '',
    netnutCity: row.netnutCity || '',
    infaticaAreaSupport: row.infaticaAreaSupport ?? 0,
    infaticaRegionSupport: row.infaticaRegionSupport ?? 0,
    infaticaCitySupport: row.infaticaCitySupport ?? 0,
    netnutAreaSupport: row.netnutAreaSupport ?? 0,
    netnutRegionSupport: row.netnutRegionSupport ?? 0,
    netnutCitySupport: row.netnutCitySupport ?? 0
  })
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    try {
      if (formData.id) {
        await request.post('/web/dynamic-region/update', formData)
        ElMessage.success('更新成功')
      } else {
        await request.post('/web/dynamic-region/create', formData)
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
      fetchData()
    } catch (e) {
    } finally {
      submitLoading.value = false
    }
  })
}

const confirmDelete = (row: FusionLocation) => {
  ElMessageBox.confirm('确认删除该地区吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await request.post('/web/dynamic-region/delete', { id: row.id })
      ElMessage.success('删除成功')
      fetchData()
    } catch (e) {
    }
  })
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.page-container {
  padding: 16px;
}
.no-scroll-dialog :deep(.el-dialog__body) {
  max-height: none;
  overflow-y: visible;
}
:deep(.el-form-item) {
  margin-bottom: 10px;
}
.title {
  font-size: 18px;
  font-weight: 600;
}
.subtitle {
  margin-left: 12px;
  color: #94a3b8;
  font-size: 13px;
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
.filter-container {
  margin-bottom: 12px;
}
.pagination-container {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-table .cell) {
  white-space: normal;
  word-break: break-word;
  line-height: 1.6;
}

.support-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 4px;
}
.section-divider {
  margin: 12px 0;
}
</style>
