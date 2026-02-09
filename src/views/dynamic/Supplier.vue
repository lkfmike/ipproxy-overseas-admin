<template>
  <div class="page-container">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">供应商管理</span>
            <span class="subtitle">管理动态代理供应商接入配置</span>
          </div>
          <div class="header-right">
            <el-button type="primary" :icon="Plus" @click="openCreate">新增供应商</el-button>
            <el-button :icon="Refresh" @click="fetchData">刷新</el-button>
          </div>
        </div>
      </template>
      <div v-loading="loading">
        <el-table :data="tableData" style="width: 100%" stripe border size="small">
          <el-table-column prop="supplierName" label="供应商名称" min-width="160" show-overflow-tooltip />
          <el-table-column prop="user" label="鉴权用户名" min-width="140" show-overflow-tooltip />
          <el-table-column prop="pass" label="鉴权密码" min-width="140" show-overflow-tooltip />
          <el-table-column label="会话时长" min-width="160">
            <template #default="scope">
              <span>{{ scope.row.min ?? '-' }} - {{ scope.row.max ?? '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="proxyType" label="代理类型" min-width="120">
            <template #default="scope">
              <el-tag type="info" v-if="scope.row.proxyType === 'residential'">动态住宅</el-tag>
              <el-tag type="warning" v-else-if="scope.row.proxyType === 'mobile'">移动住宅</el-tag>
              <span v-else>{{ scope.row.proxyType || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="supportLevel" label="支持级别" min-width="100" />
          <el-table-column prop="supplierTypeName" label="类型名称" min-width="140" show-overflow-tooltip />
          <el-table-column prop="updatedAt" label="更新时间" min-width="180">
            <template #default="scope">
              <span>{{ formatTime(scope.row.updatedAt) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="180">
            <template #default="scope">
              <el-button size="small" :icon="Edit" @click="openEdit(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" :icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-container">
          <el-pagination
            background
            layout="total, sizes, prev, pager, next, jumper"
            :current-page="pagination.page"
            :page-size="pagination.size"
            :page-sizes="[10, 20, 50]"
            :total="pagination.total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogType === 'create' ? '新增供应商' : '编辑供应商'" width="1000px" class="no-scroll-dialog" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px">
        <el-divider content-position="left" class="section-divider">基础信息</el-divider>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="供应商名称" prop="supplierName">
              <el-input v-model="formData.supplierName" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="代理类型" prop="proxyType">
              <el-select v-model="formData.proxyType" placeholder="选择类型" style="width: 100%">
                <el-option label="动态住宅" value="residential" />
                <el-option label="移动住宅" value="mobile" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="类型名称">
              <el-input v-model="formData.supplierTypeName" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="鉴权用户名" prop="user">
              <el-input v-model="formData.user" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="鉴权密码" prop="pass">
              <el-input v-model="formData.pass" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="国家大小写">
              <el-select v-model="formData.areaCaseType" style="width: 100%">
                <el-option label="大写" :value="1" />
                <el-option label="小写" :value="0" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left" class="section-divider">会话与支持</el-divider>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="最短时长(min)" prop="min">
              <el-input-number v-model="formData.min" :min="0" :step="1" style="width: 100%" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最长时长(max)" prop="max">
              <el-input-number v-model="formData.max" :min="0" :step="1" style="width: 100%" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="支持级别">
              <el-input-number v-model="formData.supportLevel" :min="0" :step="1" style="width: 100%" controls-position="right" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left" class="section-divider">可用资源</el-divider>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="可用网关">
              <el-input v-model="formData.availableGatewayStr" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="国家可用串">
              <el-input v-model="formData.availableCountryStr" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
          </el-col>
        </el-row>

        <el-divider content-position="left" class="section-divider">鉴权格式模板</el-divider>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="any国家+粘性">
              <el-input v-model="formData.authFormat" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="any国家+一次一换">
              <el-input v-model="formData.authFormatOnce" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="指定国家+粘性">
              <el-input v-model="formData.authFormatArea" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="指定国家+一次一换">
              <el-input v-model="formData.authFormatAreaOnce" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="指定州+粘性">
              <el-input v-model="formData.authFormatRegion" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="指定州+一次一换">
              <el-input v-model="formData.authFormatRegionOnce" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="指定城市+粘性">
              <el-input v-model="formData.authFormatCity" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="指定城市+一次一换">
              <el-input v-model="formData.authFormatCityOnce" type="textarea" :rows="2" />
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
import { Plus, Refresh, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import request from '../../utils/request'

const loading = ref(false)
const tableData = ref<any[]>([])

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const fetchData = async () => {
  loading.value = true
  try {
    const params = { page: pagination.page, size: pagination.size }
    const res: any = await request.get('/web/dynamic/suppliers', { params })
    tableData.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (e) {
    ElMessage.error('加载供应商数据失败')
  } finally {
    loading.value = false
  }
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
  supplierName: '',
  user: '',
  pass: '',
  min: undefined as number | undefined,
  max: undefined as number | undefined,
  availableCountryStr: '',
  authFormat: '',
  authFormatOnce: '',
  authFormatArea: '',
  authFormatAreaOnce: '',
  authFormatRegion: '',
  authFormatRegionOnce: '',
  authFormatCity: '',
  authFormatCityOnce: '',
  availableGatewayStr: '',
  areaCaseType: 1 as number | undefined,
  supplierTypeName: '',
  proxyType: 'residential',
  supportLevel: undefined as number | undefined
})

const rules = reactive<FormRules>({
  supplierName: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
  user: [{ required: true, message: '请输入鉴权用户名', trigger: 'blur' }],
  pass: [{ required: true, message: '请输入鉴权密码', trigger: 'blur' }],
  proxyType: [{ required: true, message: '请选择代理类型', trigger: 'change' }]
})

const openCreate = () => {
  dialogType.value = 'create'
  Object.assign(formData, {
    id: undefined,
    supplierName: '',
    user: '',
    pass: '',
    min: undefined,
    max: undefined,
    availableCountryStr: '',
    authFormat: '',
    authFormatOnce: '',
    authFormatArea: '',
    authFormatAreaOnce: '',
    authFormatRegion: '',
    authFormatRegionOnce: '',
    authFormatCity: '',
    authFormatCityOnce: '',
    availableGatewayStr: '',
    areaCaseType: 1,
    supplierTypeName: '',
    proxyType: 'residential',
    supportLevel: undefined
  })
  dialogVisible.value = true
}

const openEdit = (row: any) => {
  dialogType.value = 'edit'
  Object.assign(formData, row)
  dialogVisible.value = true
}

const submitForm = () => {
  formRef.value?.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    try {
      if (dialogType.value === 'create') {
        await request.post('/web/dynamic/addDynamicSupplier', formData)
        ElMessage.success('新增成功')
      } else {
        await request.post('/web/dynamic/updateDynamicSupplier', formData)
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

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确定删除该供应商吗？', '提示', { type: 'warning' })
    .then(async () => {
      try {
        await request.post('/web/dynamic/deleteDynamicSupplier', { id: row.id })
        ElMessage.success('删除成功')
        fetchData()
      } catch (e) {
        ElMessage.error('删除失败')
      }
    })
    .catch(() => {})
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
.no-scroll-dialog :deep(.el-dialog__body) {
  max-height: none;
  overflow-y: visible;
}
:deep(.el-form-item) {
  margin-bottom: 10px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
.section-divider {
  margin: 12px 0;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
