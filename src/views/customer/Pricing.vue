<template>
  <div class="page-container">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">客户单价配置</span>
          </div>
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增规则</el-button>
        </div>
      </template>

      <el-table :data="tableData" style="width: 100%" border v-loading="loading">
        <el-table-column prop="uid" label="用户ID" width="100">
          <template #default="scope">
            {{ scope.row.uid === 0 ? '默认(0)' : scope.row.uid }}
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="180">
          <template #default="scope">
             {{ scope.row.uid === 0 ? '默认' : (scope.row.email || '-') }}
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="120" />
        <el-table-column prop="quality" label="质量" width="120" />
        <el-table-column prop="area" label="区域" width="120" />
        <el-table-column prop="region" label="地区" width="120" />
        <el-table-column prop="price" label="价格" width="120" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
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
        <el-form-item label="用户ID">
          <el-input-number v-model="formData.uid" :min="0" />
          <span class="tips">0表示默认规则</span>
        </el-form-item>
        <el-form-item label="类型">
          <el-input v-model="formData.type" />
        </el-form-item>
        <el-form-item label="质量">
          <el-input v-model="formData.quality" />
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
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import request from '../../utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'

interface StaticProxyPrice {
  id?: number
  uid: number
  email?: string
  nickname?: string
  type: string
  quality: string
  area: string
  region: string
  price: number
}

const loading = ref(false)
const tableData = ref<StaticProxyPrice[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const dialogType = ref<'create' | 'edit'>('create')
const formData = reactive<StaticProxyPrice>({
  uid: 0,
  type: '',
  quality: '',
  area: '',
  region: '',
  price: 0
})

const fetchList = async () => {
  loading.value = true
  try {
    const res = await request.get('/static-proxy-price/list', {
      params: {
        page: currentPage.value,
        size: pageSize.value
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

const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchList()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchList()
}

const handleAdd = () => {
  dialogType.value = 'create'
  Object.assign(formData, {
    uid: 0,
    type: '',
    quality: '',
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

const handleDelete = (row: StaticProxyPrice) => {
  ElMessageBox.confirm('确定要删除这条规则吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await request.post('/static-proxy-price/delete', { id: row.id })
      ElMessage.success('删除成功')
      fetchList()
    } catch (error) {
      console.error(error)
    }
  })
}

const handleSubmit = async () => {
  try {
    const url = dialogType.value === 'create' ? '/static-proxy-price/create' : '/static-proxy-price/update'
    await request.post(url, formData)
    ElMessage.success(dialogType.value === 'create' ? '创建成功' : '更新成功')
    dialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped lang="scss">
.page-container {
  min-height: 100%;
}

.box-card {
  border-radius: 4px;

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
        font-weight: bold;
        color: #1f2937;
      }
    }
  }
}

.price {
  color: #f56c6c;
  font-weight: 600;
}

.tips {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
