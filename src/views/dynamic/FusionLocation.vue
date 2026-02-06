<template>
  <div class="page-container">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">融合地区设置</span>
          </div>
          <div class="header-right">
            <el-button type="primary" :icon="Plus" @click="openCreate">新增</el-button>
          </div>
        </div>
      </template>

      <div class="filter-container">
        <el-form :inline="true" :model="filters">
          <el-form-item label="国家/地区">
            <el-input v-model="filters.area" placeholder="输入国家/地区代码" clearable style="width: 160px" />
          </el-form-item>
          <el-form-item label="省份/州">
            <el-input v-model="filters.region" placeholder="输入省份/州代码" clearable style="width: 160px" />
          </el-form-item>
          <el-form-item label="城市">
            <el-input v-model="filters.city" placeholder="输入城市" clearable style="width: 160px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div v-loading="loading">
        <el-table :data="tableData" style="width: 100%" stripe border>
          <el-table-column prop="id" label="ID" width="80" align="center" />
          <el-table-column prop="area" label="国家/地区" min-width="120" show-overflow-tooltip />
          <el-table-column prop="region" label="省份/州" min-width="120" show-overflow-tooltip />
          <el-table-column prop="city" label="城市" min-width="140" show-overflow-tooltip />

          <el-table-column label="infatica映射" min-width="240">
            <template #default="{ row }">
              <div class="map-grid">
                <el-tooltip :content="row.infaticaArea || '-'" placement="top">
                  <span class="map-item">{{ row.infaticaArea || '-' }}</span>
                </el-tooltip>
                <el-tooltip :content="row.infaticaRegion || '-'" placement="top">
                  <span class="map-item">{{ row.infaticaRegion || '-' }}</span>
                </el-tooltip>
                <el-tooltip :content="row.infaticaCity || '-'" placement="top">
                  <span class="map-item">{{ row.infaticaCity || '-' }}</span>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="infatica支持" min-width="240" align="center">
            <template #default="{ row }">
              <div class="tag-grid">
                <el-tag :type="row.infaticaAreaSupport === 1 ? 'success' : 'danger'">国家{{ row.infaticaAreaSupport === 1 ? '支持' : '不支持' }}</el-tag>
                <el-tag :type="row.infaticaRegionSupport === 1 ? 'success' : 'danger'">省份{{ row.infaticaRegionSupport === 1 ? '支持' : '不支持' }}</el-tag>
                <el-tag :type="row.infaticaCitySupport === 1 ? 'success' : 'danger'">城市{{ row.infaticaCitySupport === 1 ? '支持' : '不支持' }}</el-tag>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="netnut映射" min-width="240">
            <template #default="{ row }">
              <div class="map-grid">
                <el-tooltip :content="row.netnutArea || '-'" placement="top">
                  <span class="map-item">{{ row.netnutArea || '-' }}</span>
                </el-tooltip>
                <el-tooltip :content="row.netnutRegion || '-'" placement="top">
                  <span class="map-item">{{ row.netnutRegion || '-' }}</span>
                </el-tooltip>
                <el-tooltip :content="row.netnutCity || '-'" placement="top">
                  <span class="map-item">{{ row.netnutCity || '-' }}</span>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="netnut支持" min-width="240" align="center">
            <template #default="{ row }">
              <div class="tag-grid">
                <el-tag :type="row.netnutAreaSupport === 1 ? 'success' : 'danger'">国家{{ row.netnutAreaSupport === 1 ? '支持' : '不支持' }}</el-tag>
                <el-tag :type="row.netnutRegionSupport === 1 ? 'success' : 'danger'">省份{{ row.netnutRegionSupport === 1 ? '支持' : '不支持' }}</el-tag>
                <el-tag :type="row.netnutCitySupport === 1 ? 'success' : 'danger'">城市{{ row.netnutCitySupport === 1 ? '支持' : '不支持' }}</el-tag>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="160" fixed="right" align="center">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
              <el-divider direction="vertical" />
              <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="table-footer">
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
      </div>
    </el-card>

    <el-dialog v-model="editDialogVisible" title="编辑融合地区" width="700px" align-center>
      <el-form :model="formData" label-width="120px">
        <el-form-item label="国家/地区">
          <el-input v-model="formData.area" placeholder="国家/地区代码" />
        </el-form-item>
        <el-form-item label="省份/州">
          <el-input v-model="formData.region" placeholder="省份/州代码" />
        </el-form-item>
        <el-form-item label="城市">
          <el-input v-model="formData.city" placeholder="城市" />
        </el-form-item>
        <el-form-item label="infatica映射">
          <el-input v-model="formData.infaticaArea" placeholder="国家" style="width: 30%" />
          <el-input v-model="formData.infaticaRegion" placeholder="省份州" style="width: 30%; margin-left: 10px" />
          <el-input v-model="formData.infaticaCity" placeholder="城市" style="width: 30%; margin-left: 10px" />
        </el-form-item>
        <el-form-item label="infatica支持">
          <el-switch v-model="formData.infaticaAreaSupport" :active-value="1" :inactive-value="0" active-text="国家支持" inactive-text="国家不支持" />
          <el-switch v-model="formData.infaticaRegionSupport" :active-value="1" :inactive-value="0" style="margin-left: 12px" active-text="省份支持" inactive-text="省份不支持" />
          <el-switch v-model="formData.infaticaCitySupport" :active-value="1" :inactive-value="0" style="margin-left: 12px" active-text="城市支持" inactive-text="城市不支持" />
        </el-form-item>
        <el-form-item label="netnut映射">
          <el-input v-model="formData.netnutArea" placeholder="国家" style="width: 30%" />
          <el-input v-model="formData.netnutRegion" placeholder="省份州" style="width: 30%; margin-left: 10px" />
          <el-input v-model="formData.netnutCity" placeholder="城市" style="width: 30%; margin-left: 10px" />
        </el-form-item>
        <el-form-item label="netnut支持">
          <el-switch v-model="formData.netnutAreaSupport" :active-value="1" :inactive-value="0" active-text="国家支持" inactive-text="国家不支持" />
          <el-switch v-model="formData.netnutRegionSupport" :active-value="1" :inactive-value="0" style="margin-left: 12px" active-text="省份支持" inactive-text="省份不支持" />
          <el-switch v-model="formData.netnutCitySupport" :active-value="1" :inactive-value="0" style="margin-left: 12px" active-text="城市支持" inactive-text="城市不支持" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import request from '../../utils/request'

interface FusionLocation {
  id?: number
  area?: string
  region?: string
  city?: string
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

const filters = reactive({
  area: '',
  region: '',
  city: ''
})

const tableData = ref<FusionLocation[]>([])
const loading = ref(false)
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

const editDialogVisible = ref(false)
const formData = reactive<FusionLocation>({})

const fetchList = async () => {
  loading.value = true
  try {
    const body = {
      page: pagination.page,
      size: pagination.size,
      area: filters.area || undefined,
      region: filters.region || undefined,
      city: filters.city || undefined
    }
    const res = await request.post('/web/dynamic/fusion/locations', body)
    tableData.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (e) {
    console.error('fetch fusion locations error', e)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchList()
}

const handleReset = () => {
  filters.area = ''
  filters.region = ''
  filters.city = ''
  pagination.page = 1
  fetchList()
}

const handleSizeChange = (val: number) => {
  pagination.size = val
  fetchList()
}

const handleCurrentChange = (val: number) => {
  pagination.page = val
  fetchList()
}

const openCreate = () => {
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
  editDialogVisible.value = true
}

const handleEdit = (row: FusionLocation) => {
  Object.assign(formData, row)
  editDialogVisible.value = true
}

const submitForm = async () => {
  try {
    const url = formData.id ? '/web/dynamic/fusion/update' : '/web/dynamic/fusion/create'
    await request.post(url, formData)
    ElMessage.success('保存成功')
    editDialogVisible.value = false
    fetchList()
  } catch (e) {
    console.error('submit fusion location error', e)
    ElMessage.error('保存失败')
  }
}

const handleDelete = (row: FusionLocation) => {
  ElMessageBox.confirm('确认删除该记录？', '提示', { type: 'warning' })
    .then(async () => {
      await request.post('/web/dynamic/fusion/delete', { id: row.id })
      ElMessage.success('删除成功')
      fetchList()
    })
    .catch(() => {})
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.page-container {
  padding: 16px;
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
.map-grid, .tag-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}
.map-item {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.table-footer {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>
