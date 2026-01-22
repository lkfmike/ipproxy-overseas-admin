<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <h1 class="title">IP提取工具</h1>
      </div>
      <div class="header-right">
        <el-tooltip content="刷新库存与用户列表" placement="bottom">
          <el-button :icon="Refresh" circle size="large" class="refresh-btn" @click="handleRefresh" :loading="submitting" />
        </el-tooltip>
      </div>
    </div>

    <transition name="fade" mode="out-in">
      <div v-if="!result" key="form">
        <el-row :gutter="24">
          <el-col :xs="24" :lg="16">
            <el-card class="main-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span class="card-title">提取配置</span>
                  <span class="card-subtitle">填写下列信息后进行提取</span>
                </div>
              </template>
              <el-form :model="form" :rules="rules" ref="formRef" label-position="top" class="purchase-form" size="large">
                <el-row :gutter="24">
                  <el-col :xs="24" :md="12">
                    <el-form-item label="归属用户" prop="userId">
                      <el-select
                        v-model="form.userId"
                        placeholder="搜索用户 (邮箱/UID)"
                        filterable
                        remote
                        clearable
                        :remote-method="searchUsers"
                        :loading="userLoading"
                        style="width: 100%"
                        :disabled="submitting"
                        @change="handleUserChange"
                      >
                        <template #prefix>
                          <el-icon><User /></el-icon>
                        </template>
                        <el-option
                          v-for="item in userList"
                          :key="item.uid"
                          :label="item.email"
                          :value="item.uid"
                        >
                          <div class="option-item">
                            <span class="option-label">{{ item.email }}</span>
                            <span class="option-sub">UID: {{ item.uid }}</span>
                          </div>
                        </el-option>
                      </el-select>
                    </el-form-item>
                  </el-col>
 
                  <el-col :xs="24" :md="12">
                    <el-form-item label="IP类型" prop="stockType">
                      <el-radio-group v-model="form.stockType" @change="handleStockTypeChange" class="full-width-radio">
                        <el-radio-button label="isp">
                          <el-icon class="radio-icon"><House /></el-icon> ISP住宅
                        </el-radio-button>
                        <el-radio-button label="hosting">
                          <el-icon class="radio-icon"><OfficeBuilding /></el-icon> 数据中心
                        </el-radio-button>
                      </el-radio-group>
                    </el-form-item>
                  </el-col>

                  <el-col :xs="24" :md="12">
                    <el-form-item label="地区/区域" prop="stockId">
                      <el-select 
                        v-model="form.stockId" 
                        placeholder="请选择地区" 
                        style="width: 100%" 
                        filterable 
                        clearable 
                        :disabled="submitting"
                      >
                        <template #prefix>
                          <el-icon><Location /></el-icon>
                        </template>
                        <el-option
                          v-for="item in currentStocks"
                          :key="item.id"
                          :label="formatStockLabel(item)"
                          :value="item.id"
                        >
                          <div class="option-item">
                            <span class="option-label">{{ formatStockLabel(item) }}</span>
                            <el-tag size="small" :type="item.inventory > 0 ? 'success' : 'danger'" effect="light">
                              库存: {{ item.inventory }}
                            </el-tag>
                          </div>
                        </el-option>
                      </el-select>
                    </el-form-item>
                  </el-col>

                  <el-col :xs="24" :md="12">
                    <el-form-item label="协议类型" prop="protocol">
                      <el-radio-group v-model="form.protocol" class="full-width-radio">
                        <el-radio-button label="socks5">SOCKS5</el-radio-button>
                        <el-radio-button label="http">HTTP</el-radio-button>
                        <el-radio-button label="vmess">VMess</el-radio-button>
                      </el-radio-group>
                    </el-form-item>
                  </el-col>

                  <el-col :xs="24" :md="12">
                    <el-form-item label="购买时长" prop="period">
                      <el-radio-group v-model="form.period" class="full-width-radio">
                        <el-radio-button :label="30">
                          <div class="radio-with-badge">
                            <span>30天</span>
                            <span class="corner-badge" v-if="getPeriodDiscount(30) < 1">{{ (getPeriodDiscount(30) * 10).toFixed(1) }} 折</span>
                          </div>
                        </el-radio-button>
                        <el-radio-button :label="60">
                          <div class="radio-with-badge">
                            <span>60天</span>
                            <span class="corner-badge" v-if="getPeriodDiscount(60) < 1">{{ (getPeriodDiscount(60) * 10).toFixed(1) }} 折</span>
                          </div>
                        </el-radio-button>
                        <el-radio-button :label="120">
                          <div class="radio-with-badge">
                            <span>120天</span>
                            <span class="corner-badge" v-if="getPeriodDiscount(120) < 1">{{ (getPeriodDiscount(120) * 10).toFixed(1) }} 折</span>
                          </div>
                        </el-radio-button>
                        <el-radio-button :label="360">
                          <div class="radio-with-badge">
                            <span>360天</span>
                            <span class="corner-badge" v-if="getPeriodDiscount(360) < 1">{{ (getPeriodDiscount(360) * 10).toFixed(1) }} 折</span>
                          </div>
                        </el-radio-button>
                      </el-radio-group>
                    </el-form-item>
                  </el-col>

                  <el-col :xs="24" :md="12">
                    <el-form-item label="提取数量" prop="quantity">
                      <el-input-number v-model="form.quantity" :min="1" :max="100" controls-position="right" :disabled="submitting" style="width: 100%" />
                    </el-form-item>
                  </el-col>

                  <el-col :xs="24" :md="12">
                    <el-form-item label="专线中转">
                      <div class="transfer-inline">
                        <el-switch v-model="form.dedicatedLine" active-text="开启" inactive-text="关闭" :disabled="submitting || form.protocol !== 'vmess'" />
                        <el-tooltip content="仅 VMess 可用；开启可提升稳定性，需额外带宽费用" placement="top">
                          <el-icon class="info-icon"><InfoFilled /></el-icon>
                        </el-tooltip>
                        <el-select
                          v-if="form.dedicatedLine && form.protocol === 'vmess'"
                          v-model="form.bandwidth"
                          placeholder="请选择带宽"
                          :disabled="submitting"
                          class="bandwidth-inline"
                        >
                          <el-option label="3 Mbps" value="3M" />
                          <el-option label="5 Mbps" value="5M" />
                          <el-option label="10 Mbps" value="10M" />
                        </el-select>
                      </div>
                    </el-form-item>
                  </el-col>

                  <el-col :xs="24" :md="12">
                    <el-form-item label="自动续费">
                      <el-switch v-model="form.autoRenew" active-text="开启" inactive-text="关闭" :disabled="submitting" />
                    </el-form-item>
                  </el-col>

                  <el-col :xs="24">
                    <div class="form-actions">
                      <el-button type="primary" size="large" @click="handleSubmit" :loading="submitting" class="submit-btn">立即提取</el-button>
                      <el-button size="large" @click="resetForm" :disabled="submitting">重置配置</el-button>
                    </div>
                  </el-col>
                </el-row>
              </el-form>
            </el-card>
          </el-col>

          <el-col :xs="24" :lg="8">
            <el-card class="summary-card" shadow="never">
              <template #header>
                <div class="summary-card-header">
                  <span>配置总览</span>
                  <el-tag size="small" effect="plain">PREVIEW</el-tag>
                </div>
              </template>
              <div class="summary-content">
                <div class="summary-item">
                  <span class="label">归属用户</span>
                  <span class="value user-value">{{ displayUserLabel }}</span>
                </div>
                <div class="summary-item" v-if="displayUserBalance !== null">
                  <span class="label">用户余额</span>
                  <span class="value">¥ {{ displayUserBalance }}</span>
                </div>
                <div class="summary-item">
                  <span class="label">IP类型</span>
                  <span class="value">
                    <el-tag type="info" size="small">{{ form.stockType === 'isp' ? 'ISP住宅' : '数据中心' }}</el-tag>
                  </span>
                </div>
                <div class="summary-item">
                  <span class="label">地区/区域</span>
                  <span class="value">{{ selectedStock ? formatStockLabel(selectedStock) : '未选择' }}</span>
                </div>
                <div class="summary-item">
                  <span class="label">协议类型</span>
                  <span class="value">
                    <el-tag type="success" size="small">{{ form.protocol.toUpperCase() }}</el-tag>
                  </span>
                </div>
                <div class="summary-item">
                  <span class="label">购买时长</span>
                  <span class="value">{{ form.period }} 天</span>
                </div>
                <div class="summary-item">
                  <span class="label">提取数量</span>
                  <span class="value highlight">{{ form.quantity }} 个</span>
                </div>
                <el-divider style="margin: 12px 0" />
                <div class="summary-item" v-if="priceDetail">
                  <span class="label">基础单价</span>
                  <span class="value">¥ {{ priceDetail.userBasePrice }} / 30天</span>
                </div>
                <div class="summary-item" v-if="priceDetail && priceDetail.daysDiscountRate < 1">
                  <span class="label">时长折扣</span>
                  <span class="value success-text">{{ (priceDetail.daysDiscountRate * 10).toFixed(1) }} 折</span>
                </div>
                <div class="summary-item" v-if="priceDetail && form.dedicatedLine">
                  <span class="label">专线费用</span>
                  <span class="value">¥ {{ priceDetail.bandwidthPrice }}</span>
                </div>
                <div class="summary-item" v-if="priceDetail">
                  <span class="label">预估总价</span>
                  <span class="value price-text">¥ {{ priceDetail.totalAmount }}</span>
                </div>
              </div>
              <div class="summary-footer">
                <el-alert title="确认配置后点击立即提取，系统将异步处理开通" type="info" :closable="false" show-icon />
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <div v-else key="result" class="result-wrapper">
        <el-card shadow="hover" class="result-card">
          <el-result icon="success" title="提取成功" sub-title="系统正在后台为您分配IP资源">
            <template #extra>
              <div class="result-details">
                <el-descriptions border :column="1" size="large" class="result-descriptions">
                  <el-descriptions-item label="系统订单号">
                    <span class="font-mono font-bold">{{ result.orderId }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="总金额">
                    <span class="price-text">¥ {{ result.totalAmount }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="基础价格">¥ {{ result.detail?.basePrice }}</el-descriptions-item>
                  <el-descriptions-item label="带宽价格">¥ {{ result.detail?.bandwidthPrice }}</el-descriptions-item>
                  <el-descriptions-item label="折扣金额">
                    <span class="discount-text">- ¥ {{ result.detail?.discount }}</span>
                  </el-descriptions-item>
                </el-descriptions>
              </div>
              <div class="result-actions">
                <el-button type="primary" size="large" @click="resetForm">继续提取</el-button>
                <el-button size="large" @click="goToOrderList">查看订单</el-button>
              </div>
            </template>
          </el-result>
        </el-card>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Refresh, 
  User, 
  Location, 
  House, 
  OfficeBuilding, 
  InfoFilled 
} from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import request from '../../utils/request'

console.log('Tools.vue script setup started')

const priceDetail = ref<any>(null)
const calculating = ref(false)

const debounce = (fn: Function, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

const calculatePrice = debounce(async () => {
  console.log('calculatePrice triggered', form)
  if (!form.userId) {
    console.log('calculatePrice skipped: userId is missing')
    priceDetail.value = null
    return
  }
  calculating.value = true
  try {
    console.log('sending calculate request', form)
    const res = await request.post('/static-proxy-order/calculate', form) as any
    console.log('calculate response', res)
    if (res.code === 200) {
      priceDetail.value = res.data
    }
  } catch (error) {
    console.error('Calculate price error', error)
  } finally {
    calculating.value = false
  }
}, 500)
const router = useRouter()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const userLoading = ref(false)
const userList = ref<any[]>([])
const selectedUser = ref<any>(null)
const stocks = ref<any>({ isp: [], hosting: [] })
const result = ref<any>(null)

const handleUserChange = (val: any) => {
  const user = userList.value.find((u: any) => u.uid === val)
  if (user) {
    selectedUser.value = user
  } else {
    selectedUser.value = null
  }
}

const displayUserLabel = computed(() => {
  return selectedUser.value ? selectedUser.value.email : '未选择'
})

const displayUserBalance = computed(() => {
  return selectedUser.value ? selectedUser.value.balance : null
})

const getPeriodDiscount = (p: number) => {
  switch (p) {
    case 30: return 1.0
    case 60: return 0.95
    case 120: return 0.93
    case 360: return 0.90
    default: return 1.0
  }
}

// Remove group overlay badge logic; badges display inside each option

const form = reactive({
  userId: undefined,
  stockType: 'isp',
  stockId: undefined,
  quantity: 1,
  period: 30,
  protocol: 'socks5',
  dedicatedLine: false,
  bandwidth: '3M',
  autoRenew: false
})

const rules = reactive<FormRules>({
  userId: [{ required: true, message: '请选择用户', trigger: 'change' }],
  stockId: [{ required: true, message: '请选择地区', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  protocol: [{ required: true, message: '请选择协议', trigger: 'change' }],
  period: [{ required: true, message: '请选择时长', trigger: 'change' }]
})

watch(() => form, () => {
  calculatePrice()
}, { deep: true })

const currentStocks = computed(() => {
  return stocks.value[form.stockType] || []
})

const formatStockLabel = (item: any) => {
  const area = item.areaCn ? `${item.areaCn} (${item.area})` : item.area
  const region = item.regionCn ? `${item.regionCn} (${item.region})` : item.region
  return `${area} - ${region}`
}

const handleStockTypeChange = () => {
  const list = stocks.value[form.stockType] || []
  form.stockId = list.length > 0 ? list[0].id : undefined
}

const selectedStock = computed(() => {
  return currentStocks.value.find((s: any) => s.id === form.stockId) || null
})

const searchUsers = async (query: string) => {
  userLoading.value = true
  try {
    const params: any = {
      page: 1,
      size: 100000
    }
    if (query) {
      params.email = query
    }
    const res = await request.get('/account/list', { params })
    console.log('account/list response', res)
    const data = res?.data || {}
    userList.value = data.list || data.records || data.items || []
    console.log('userList length', userList.value.length)
  } catch (error) {
    console.error('Search user error', error)
  } finally {
    userLoading.value = false
  }
}

const fetchStocks = async () => {
  try {
    const res = await request.get('/static-proxy-order/stocks') as any
    if (res.code === 200) {
      stocks.value = res.data
      const initialList = stocks.value[form.stockType] || []
      if (initialList.length > 0 && !form.stockId) {
        form.stockId = initialList[0].id
      }
    }
  } catch (error) {
    console.error('Fetch stocks error', error)
  }
}

const handleSubmit = async () => {
  console.log('handleSubmit called')
  if (!formRef.value) {
    console.error('formRef is missing')
    return
  }
  await formRef.value.validate(async (valid, fields) => {
    console.log('Validation result:', valid, fields)
    if (valid) {
      submitting.value = true
      result.value = null
      try {
        console.log('Submitting purchase request', form)
        const res = await request.post('/static-proxy-order/purchase', form) as any
        console.log('Purchase response', res)
        if (res.code === 200) {
          ElMessage.success('提取成功')
          result.value = res.data
        } else {
          console.error('Purchase failed with code', res.code)
        }
      } catch (error) {
        console.error('Purchase error', error)
      } finally {
        submitting.value = false
      }
    } else {
      console.warn('Form validation failed', fields)
      ElMessage.warning('请检查表单填写是否完整')
    }
  })
}

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  form.dedicatedLine = false
  form.autoRenew = false
  result.value = null
}

const handleRefresh = async () => {
  await fetchStocks()
  await searchUsers('')
}

const goToOrderList = () => {
  router.push('/proxy/order')
}

onMounted(() => {
  fetchStocks()
  searchUsers('')
})

watch(() => form.protocol, (p) => {
  if (p !== 'vmess' && form.dedicatedLine) {
    form.dedicatedLine = false
  }
})

watch(currentStocks, (list) => {
  if (!form.stockId && list && list.length > 0) {
    form.stockId = list[0].id
  }
})
</script>

<style scoped>
.page-container {
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
}

.subtitle {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin: 0;
}

.refresh-btn {
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.main-card {
  border-radius: 8px;
  overflow: visible;
}

.card-header {
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.card-subtitle {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

/* Form Styles */
.purchase-form {
  padding: 8px 0;
}

.option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.option-sub {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.radio-icon {
  margin-right: 4px;
  vertical-align: text-bottom;
}

.full-width-radio {
  display: flex;
  width: 100%;
  flex-wrap: nowrap;
}

.full-width-radio :deep(.el-radio-button) {
  flex: 1 1 0;
  min-width: 0;
}

.full-width-radio :deep(.el-radio-button__inner) {
  width: 100%;
  padding: 0 16px;
  position: relative;
  overflow: hidden;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.radio-with-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
  padding-right: 32px;
  height: 40px;
}

.corner-badge {
  position: absolute;
  top: 2px;
  right: 6px;
  font-size: 11px;
  line-height: 1;
  padding: 2px 6px;
  border-radius: 10px;
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  white-space: nowrap;
  pointer-events: none;
}

.switch-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.transfer-inline {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bandwidth-inline {
  width: 180px;
}

.info-icon {
  color: var(--el-text-color-secondary);
  cursor: help;
}

.form-actions {
  display: flex;
  gap: 16px;
  margin-top: 24px;
}

.submit-btn {
  min-width: 120px;
}

/* Summary Card */
.summary-card {
  position: sticky;
  top: 24px;
  border-radius: 8px;
  background-color: var(--el-fill-color-light);
  border: none;
}

.summary-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.summary-item .label {
  color: var(--el-text-color-regular);
}

.summary-item .value {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.summary-item .value.highlight {
  color: var(--el-color-primary);
  font-weight: 600;
}

.user-value {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.success-text {
  color: var(--el-color-success);
  font-weight: 500;
}

/* Result Section */
.result-wrapper {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}

.result-card {
  width: 100%;
  max-width: 800px;
  border-radius: 8px;
}

.result-details {
  margin: 32px 0;
  width: 100%;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.price-text {
  color: var(--el-color-danger);
  font-weight: 600;
  font-size: 18px;
}

.discount-text {
  color: var(--el-color-success);
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.font-bold {
  font-weight: 700;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media screen and (max-width: 992px) {
  .summary-card {
    position: static;
    margin-top: 24px;
  }
}

@media screen and (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .header-right {
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }
  
  .full-width-radio {
    flex-wrap: nowrap;
  }
  
  .full-width-radio :deep(.el-radio-button) {
    flex: 1;
    width: auto;
  }
}
</style>
