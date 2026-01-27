<template>
  <div class="dashboard-container" v-loading="loading">
    <!-- Top Stats Cards -->
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :md="6" v-for="(stat, index) in stats" :key="index">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" :style="{ backgroundColor: stat.color + '15', color: stat.color }">
            <el-icon><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-value">
              <span class="number">{{ stat.value }}</span>
              <span class="unit" v-if="stat.unit">{{ stat.unit }}</span>
            </div>
            <div class="stat-trend" v-if="stat.subLabel">
              <span :class="stat.isWarning ? 'down' : 'up'">
                {{ stat.subLabel }}
              </span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts Row 1: Trend & Distribution -->
    <el-row :gutter="20" class="mt-4">
      <el-col :xs="24" :lg="16">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="title">静态IP过期趋势 (未来7天)</span>
              <el-radio-group v-model="trendRange" size="small">
                <el-radio-button label="7d">7天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-wrapper">
             <v-chart class="chart" :option="lineChartOption" autoresize />
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="title">动态流量分布</span>
            </div>
          </template>
          <div class="chart-wrapper">
            <v-chart class="chart" :option="pieChartOption" autoresize />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts Row 2: Top Customers -->
    <el-row :gutter="20" class="mt-4">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="title">静态IP使用量 Top 10</span>
              <el-tag size="small" effect="plain">客户排行</el-tag>
            </div>
          </template>
          <div class="chart-wrapper">
             <v-chart class="chart" :option="barChartStaticOption" autoresize />
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
           <template #header>
            <div class="card-header">
              <span class="title">动态流量购买 Top 10</span>
              <el-tag size="small" type="warning" effect="plain">客户排行</el-tag>
            </div>
          </template>
          <div class="chart-wrapper">
             <v-chart class="chart" :option="barChartDynamicOption" autoresize />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { Monitor, User, Connection, DataLine } from '@element-plus/icons-vue'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

// ECharts
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  DataZoomComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  DataZoomComponent
])

const loading = ref(false)
const trendRange = ref('7d')

// Stats Data
const stats = reactive([
  { label: '静态IP已售总数', value: '0', unit: '个', icon: Connection, color: '#165dff', subLabel: '', isWarning: false },
  { label: '即将过期IP (7天内)', value: '0', unit: '个', icon: User, color: '#f53f3f', subLabel: '', isWarning: true },
  { label: '动态流量已售总量', value: '0', unit: 'GB', icon: DataLine, color: '#722ed1', subLabel: '', isWarning: false },
  { label: '剩余可用流量', value: '0', unit: 'GB', icon: Monitor, color: '#00b42a', subLabel: '', isWarning: false }
])

// Chart Data Refs
const staticTrendData = ref<{date: string, count: number}[]>([])
const dynamicDistributionData = ref<{name: string, value: number}[]>([])
const topStaticCustomers = ref<{username: string, ipCount: number}[]>([])
const topDynamicCustomers = ref<{username: string, totalPurchased: number}[]>([])

// Chart Options
const lineChartOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  toolbox: { feature: { saveAsImage: {} } },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: staticTrendData.value.map(item => item.date)
  },
  yAxis: { type: 'value' },
  series: [
    {
      name: '过期数量',
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.3 },
      itemStyle: { color: '#f53f3f' },
      data: staticTrendData.value.map(item => item.count)
    }
  ]
}))

const pieChartOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: '0%', left: 'center' },
  series: [
    {
      name: '流量分布',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: { show: false, position: 'center' },
      emphasis: {
        label: { show: true, fontSize: '16', fontWeight: 'bold' }
      },
      data: dynamicDistributionData.value
    }
  ]
}))

const barChartStaticOption = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'value', boundaryGap: [0, 0.01] },
  yAxis: {
    type: 'category',
    data: topStaticCustomers.value.map(item => item.username).reverse() // Reverse to show top at top
  },
  series: [
    {
      name: 'IP数量',
      type: 'bar',
      data: topStaticCustomers.value.map(item => item.ipCount).reverse(),
      itemStyle: { color: '#165dff' }
    }
  ]
}))

const barChartDynamicOption = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'value', boundaryGap: [0, 0.01] },
  yAxis: {
    type: 'category',
    data: topDynamicCustomers.value.map(item => item.username).reverse()
  },
  series: [
    {
      name: '购买总量(GB)',
      type: 'bar',
      data: topDynamicCustomers.value.map(item => item.totalPurchased).reverse(),
      itemStyle: { color: '#722ed1' }
    }
  ]
}))

const fetchData = async () => {
  loading.value = true
  try {
    // 1. Static IP Stats
    const staticStatsRes: any = await request.get('/web/dashboard/staticIpStats')
    if (staticStatsRes.code === 200) {
      const data = staticStatsRes.data
      stats[0].value = data.total
      stats[1].value = data.expiring
      stats[1].subLabel = `正常: ${data.normal}`
    }

    // 2. Dynamic Traffic Stats
    const dynamicStatsRes: any = await request.get('/web/dashboard/dynamicTrafficStats')
    if (dynamicStatsRes.code === 200) {
      const data = dynamicStatsRes.data
      stats[2].value = data.total
      stats[3].value = data.remaining
      stats[3].subLabel = `已用: ${data.used}`

      // Prepare Pie Chart Data
      dynamicDistributionData.value = [
        { value: data.used, name: '已用流量', itemStyle: { color: '#165dff' } },
        { value: data.remaining, name: '剩余流量', itemStyle: { color: '#00b42a' } },
        { value: data.expired, name: '过期流量', itemStyle: { color: '#86909c' } }
      ]
    }

    // 3. Top Static Customers
    const topStaticRes: any = await request.get('/web/dashboard/topStaticIpCustomers')
    if (topStaticRes.code === 200) {
      topStaticCustomers.value = topStaticRes.data
    }

    // 4. Top Dynamic Customers
    const topDynamicRes: any = await request.get('/web/dashboard/topDynamicTrafficCustomers')
    if (topDynamicRes.code === 200) {
      topDynamicCustomers.value = topDynamicRes.data
    }

    // 5. Static IP Trend
    const trendRes: any = await request.get('/web/dashboard/staticIpExpireTrend')
    if (trendRes.code === 200) {
      staticTrendData.value = trendRes.data
    }

  } catch (error) {
    console.error('Fetch dashboard data error', error)
    ElMessage.error('加载仪表盘数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
@use '../styles/variables.scss' as *;

.dashboard-container {
  /* Padding is handled by main layout */
}

.mt-4 {
  margin-top: 16px;
}

.stat-card {
  border: none;
  transition: all $transition-smooth;
  border-radius: $border-radius-lg;
  margin-bottom: 16px;
  height: 100%;

  :deep(.el-card__body) {
    display: flex;
    align-items: center;
    height: 100%;
    box-sizing: border-box;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: $shadow-float;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: $border-radius-md;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
    margin-right: 16px;
  }

  .stat-info {
    flex-grow: 1;

    .stat-label {
      color: $text-secondary;
      font-size: $font-size-sm;
      margin-bottom: 4px;
    }

    .stat-value {
      display: flex;
      align-items: baseline;
      margin-bottom: 4px;
      
      .number {
        font-size: 24px;
        font-weight: $font-weight-bold;
        color: $text-primary;
        font-family: $font-family-mono;
      }
      
      .unit {
        font-size: $font-size-sm;
        color: $text-secondary;
        margin-left: 4px;
      }
    }

    .stat-trend {
      font-size: 12px;
      height: 20px;
      display: flex;
      align-items: center;
    }
  }
}

.chart-card {
  border: none;
  border-radius: $border-radius-lg;
  margin-bottom: 16px;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .title {
      font-size: 16px;
      font-weight: 600;
      color: $text-primary;
    }
  }

  .chart-wrapper {
    height: 350px;
    width: 100%;
    
    .chart {
      height: 100%;
      width: 100%;
    }
  }
}
</style>