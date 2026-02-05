<template>
  <div class="page-container">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">动态代理供应商管理</span>
          </div>
          <div class="header-right">
            <el-button type="primary" :icon="Plus" @click="openCreate">新增供应商</el-button>
          </div>
        </div>
      </template>

      <div v-loading="loading">
        <el-table :data="tableData" style="width: 100%" stripe border>
          <el-table-column prop="id" label="ID" width="80" align="center" />
          <el-table-column prop="supplierName" label="供应商名称" min-width="160" />
          <el-table-column prop="user" label="鉴权用户名" min-width="160" />
          <el-table-column prop="pass" label="鉴权密码" min-width="160" />
          <el-table-column prop="min" label="最短时长" width="120" align="center" />
          <el-table-column prop="max" label="最长时长" width="120" align="center" />
          <el-table-column prop="supplierTypeName" label="类型名称" min-width="140" />
          <el-table-column prop="supportLevel" label="支持级别" width="120" align="center" />
          <el-table-column label="国家大小写" width="120" align="center">
            <template #default="scope">
              <el-tag size="small" :type="scope.row.areaCaseType === 1 ? 'success' : 'warning'">
                {{ scope.row.areaCaseType === 1 ? '大写' : '小写' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" min-width="180" />
          <el-table-column label="操作" width="220" fixed="right" align="center">
            <template #default="scope">
              <el-button link type="primary" :icon="Edit" @click="openEdit(scope.row)">编辑</el-button>
              <el-button link type="danger" :icon="Delete" @click="confirmDelete(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogType === 'create' ? '新增供应商' : '编辑供应商'" width="860px" destroy-on-close>
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="130px" label-position="left">
        <el-row :gutter="16">
          <el-col :xs="24" :md="12">
            <el-form-item label="供应商名称" prop="supplierName">
              <el-input v-model="formData.supplierName" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="鉴权用户名" prop="user">
              <el-input v-model="formData.user" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :xs="24" :md="12">
            <el-form-item label="鉴权密码" prop="pass">
              <el-input v-model="formData.pass" type="password" show-password />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="最短时长" prop="min">
              <el-input-number v-model="formData.min" :min="0" :step="1" style="width: 100%" controls-position="right" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :xs="24" :md="12">
            <el-form-item label="最长时长" prop="max">
              <el-input-number v-model="formData.max" :min="0" :step="1" style="width: 100%" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="类型名称" prop="supplierTypeName">
              <el-input v-model="formData.supplierTypeName" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :xs="24" :md="12">
            <el-form-item label="支持级别" prop="supportLevel">
              <el-input-number v-model="formData.supportLevel" :min="0" :step="1" style="width: 100%" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="国家大小写" prop="areaCaseType">
              <el-select v-model="formData.areaCaseType" placeholder="请选择" style="width: 100%">
                <el-option label="大写" :value="1" />
                <el-option label="小写" :value="0" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :xs="24" :md="12">
            <el-form-item label="any国家+粘性会话" prop="authFormat">
              <el-input v-model="formData.authFormat" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="any国家+一次一换" prop="authFormatOnce">
              <el-input v-model="formData.authFormatOnce" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :xs="24" :md="12">
            <el-form-item label="指定国家+粘性会话" prop="authFormatArea">
              <el-input v-model="formData.authFormatArea" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="指定国家+一次一换" prop="authFormatAreaOnce">
              <el-input v-model="formData.authFormatAreaOnce" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :xs="24" :md="12">
            <el-form-item label="指定state+粘性会话" prop="authFormatRegion">
              <el-input v-model="formData.authFormatRegion" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="指定state+一次一换" prop="authFormatRegionOnce">
              <el-input v-model="formData.authFormatRegionOnce" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :xs="24" :md="12">
            <el-form-item label="指定city+粘性会话" prop="authFormatCity">
              <el-input v-model="formData.authFormatCity" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="指定city+一次一换" prop="authFormatCityOnce">
              <el-input v-model="formData.authFormatCityOnce" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :xs="24" :md="24">
            <el-form-item label="可用国家字符串" prop="availableCountryStr">
              <el-input v-model="formData.availableCountryStr" type="textarea" :rows="3" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :xs="24" :md="24">
            <el-form-item label="可用网关字符串" prop="availableGatewayStr">
              <el-input v-model="formData.availableGatewayStr" type="textarea" :rows="3" />
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
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import request from '../../utils/request'

const loading = ref(false)
const tableData = ref<any[]>([])

const fetchData = async () => {
  loading.value = true
  try {
    const res = await request.get('/web/dynamic/suppliers', { params: { page: 1, size: 50 } })
    tableData.value = res.data?.list || []
  } catch (e) {
  } finally {
    loading.value = false
  }
}

const dialogVisible = ref(false)
const dialogType = ref<'create' | 'edit'>('create')
const submitLoading = ref(false)
const formRef = ref<FormInstance>()
const formData = reactive<any>({
  id: undefined,
  supplierName: '',
  user: '',
  pass: '',
  min: 0,
  max: 0,
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
  supplierTypeName: '',
  supportLevel: 0,
  areaCaseType: 1
})

const rules = reactive<FormRules>({
  supplierName: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
  user: [{ required: true, message: '请输入鉴权用户名', trigger: 'blur' }],
  pass: [{ required: true, message: '请输入鉴权密码', trigger: 'blur' }],
})

const openCreate = () => {
  dialogType.value = 'create'
  Object.assign(formData, {
    id: undefined,
    supplierName: '',
    user: '',
    pass: '',
    min: 0,
    max: 0,
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
    supplierTypeName: '',
    supportLevel: 0,
    areaCaseType: 1
  })
  dialogVisible.value = true
}

const openEdit = (row: any) => {
  dialogType.value = 'edit'
  Object.assign(formData, {
    id: row.id,
    supplierName: row.supplierName,
    user: row.user,
    pass: row.pass,
    min: row.min,
    max: row.max,
    availableCountryStr: row.availableCountryStr || '',
    authFormat: row.authFormat || '',
    authFormatOnce: row.authFormatOnce || '',
    authFormatArea: row.authFormatArea || '',
    authFormatAreaOnce: row.authFormatAreaOnce || '',
    authFormatRegion: row.authFormatRegion || '',
    authFormatRegionOnce: row.authFormatRegionOnce || '',
    authFormatCity: row.authFormatCity || '',
    authFormatCityOnce: row.authFormatCityOnce || '',
    availableGatewayStr: row.availableGatewayStr || '',
    supplierTypeName: row.supplierTypeName,
    supportLevel: row.supportLevel,
    areaCaseType: row.areaCaseType
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
        await request.post('/web/dynamic/addDynamicSupplier', formData)
        ElMessage.success('创建成功')
      } else {
        await request.post('/web/dynamic/updateDynamicSupplier', formData)
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
  ElMessageBox.confirm('确定删除该供应商吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await request.post('/web/dynamic/deleteDynamicSupplier', { id: row.id })
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
</style>
