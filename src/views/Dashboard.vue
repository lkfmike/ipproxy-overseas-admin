<template>
  <div class="dashboard-container">
    <!-- Top Stats Cards -->
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :md="6" v-for="(stat, index) in stats" :key="index">
        <el-card shadow="hover" class="stat-card" :body-style="{ padding: '20px' }">
          <div class="stat-icon" :style="{ backgroundColor: stat.color + '15', color: stat.color }">
            <el-icon><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-value">
              <span class="number">{{ stat.value }}</span>
              <span class="unit" v-if="stat.unit">{{ stat.unit }}</span>
            </div>
            <div class="stat-trend">
              <span :class="stat.trend >= 0 ? 'up' : 'down'">
                <el-icon v-if="stat.trend >= 0"><CaretTop /></el-icon>
                <el-icon v-else><CaretBottom /></el-icon>
                {{ Math.abs(stat.trend) }}%
              </span>
              <span class="trend-label">较上周</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts Section (Mocked with Progress Bars/Structure) -->
    <el-row :gutter="20" class="mt-4">
      <el-col :xs="24" :lg="16">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="title">流量使用趋势 (近7天)</span>
              <el-radio-group v-model="trafficPeriod" size="small">
                <el-radio-button label="week">本周</el-radio-button>
                <el-radio-button label="month">本月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-placeholder">
            <!-- Mock Chart Visualization using Bars -->
            <div class="bar-chart">
              <div class="bar-item" v-for="i in 7" :key="i">
                <div class="bar-fill" :style="{ height: Math.random() * 80 + 20 + '%' }"></div>
                <div class="bar-label">{{ '11-' + (20 + i) }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="title">资源状态分布</span>
            </div>
          </template>
          <div class="pie-chart-mock">
            <div class="pie-circle">
              <div class="inner-text">
                <div class="value">98.5%</div>
                <div class="label">可用率</div>
              </div>
            </div>
            <div class="legend-list">
              <div class="legend-item">
                <span class="dot success"></span>
                <span class="name">在线</span>
                <span class="val">8,542</span>
              </div>
              <div class="legend-item">
                <span class="dot warning"></span>
                <span class="name">高延迟</span>
                <span class="val">320</span>
              </div>
              <div class="legend-item">
                <span class="dot danger"></span>
                <span class="name">离线</span>
                <span class="val">15</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Recent Orders -->
    <el-card shadow="hover" class="mt-4">
      <template #header>
        <div class="card-header">
          <span class="title">最新动态</span>
          <el-button text type="primary">查看更多</el-button>
        </div>
      </template>
      <el-table :data="recentActivities" style="width: 100%" :header-cell-style="{ background: '#f7f8fa' }">
        <el-table-column prop="time" label="时间" width="180" />
        <el-table-column prop="user" label="用户" width="180" />
        <el-table-column prop="action" label="操作" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.statusType" size="small" effect="plain">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Monitor, User, Connection, DataLine, CaretTop, CaretBottom } from '@element-plus/icons-vue'

const trafficPeriod = ref('week')

const stats = reactive([
  { label: '总用户数', value: '1,286', unit: '', icon: User, color: '#165dff', trend: 12.5 },
  { label: '活跃代理IP', value: '8,542', unit: '个', icon: Connection, color: '#00b42a', trend: 5.2 },
  { label: '今日请求数', value: '1.2', unit: '亿次', icon: Monitor, color: '#722ed1', trend: -2.4 },
  { label: '总带宽消耗', value: '45.8', unit: 'TB', icon: DataLine, color: '#ff7d00', trend: 8.9 }
])

const recentActivities = reactive([
  { time: '2026-01-27 10:23:45', user: 'user_8832', action: '购买了 动态住宅套餐 (10GB)', status: '成功', statusType: 'success' },
  { time: '2026-01-27 10:15:20', user: 'admin', action: '系统配置更新: 静态网关节点扩容', status: '完成', statusType: 'info' },
  { time: '2026-01-27 09:58:12', user: 'test_account', action: 'API 请求频率超限警告', status: '警告', statusType: 'warning' },
  { time: '2026-01-27 09:30:00', user: 'system', action: '每日自动备份', status: '成功', statusType: 'success' },
  { time: '2026-01-27 08:45:11', user: 'user_1102', action: '充值余额 $500.00', status: '成功', statusType: 'success' }
])
</script>

<style scoped lang="scss">
.dashboard-container {
  /* Padding is handled by main layout */
}

.mt-4 {
  margin-top: 16px;
}

.stat-card {
  border: none;
  transition: all 0.3s;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    float: left;
    margin-right: 16px;
  }

  .stat-info {
    overflow: hidden;

    .stat-label {
      color: #86909c;
      font-size: 14px;
      margin-bottom: 4px;
    }

    .stat-value {
      display: flex;
      align-items: baseline;
      margin-bottom: 8px;
      
      .number {
        font-size: 24px;
        font-weight: 600;
        color: #1d2129;
        font-family: 'Roboto', sans-serif;
      }
      
      .unit {
        font-size: 14px;
        color: #86909c;
        margin-left: 4px;
      }
    }

    .stat-trend {
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 4px;

      .up {
        color: #00b42a;
        display: flex;
        align-items: center;
      }

      .down {
        color: #f53f3f;
        display: flex;
        align-items: center;
      }

      .trend-label {
        color: #86909c;
      }
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .title {
    font-size: 16px;
    font-weight: 600;
    color: #1d2129;
    border-left: 3px solid #165dff;
    padding-left: 12px;
  }
}

.chart-placeholder {
  height: 240px;
  display: flex;
  align-items: flex-end;
  padding: 20px 0;
}

.bar-chart {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-around;
  align-items: flex-end;

  .bar-item {
    width: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;

    .bar-fill {
      width: 100%;
      background: linear-gradient(180deg, #4080ff 0%, #165dff 100%);
      border-radius: 4px 4px 0 0;
      transition: height 0.6s ease;
      position: relative;
      
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255,255,255,0.1);
        opacity: 0;
        transition: opacity 0.3s;
      }

      &:hover::after {
        opacity: 1;
      }
    }

    .bar-label {
      font-size: 12px;
      color: #86909c;
    }
  }
}

.pie-chart-mock {
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;

  .pie-circle {
    width: 160px;
    height: 160px;
    border-radius: 50%;
    background: conic-gradient(#00b42a 0% 98.5%, #ff7d00 98.5% 99.5%, #f53f3f 99.5% 100%);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;

    &::after {
      content: '';
      position: absolute;
      width: 120px;
      height: 120px;
      background: #fff;
      border-radius: 50%;
    }

    .inner-text {
      position: relative;
      z-index: 1;
      text-align: center;

      .value {
        font-size: 24px;
        font-weight: bold;
        color: #1d2129;
      }
      
      .label {
        font-size: 12px;
        color: #86909c;
      }
    }
  }

  .legend-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        
        &.success { background-color: #00b42a; }
        &.warning { background-color: #ff7d00; }
        &.danger { background-color: #f53f3f; }
      }

      .name {
        color: #4e5969;
      }

      .val {
        color: #1d2129;
        font-weight: 500;
        margin-left: auto;
      }
    }
  }
}

@media screen and (max-width: 768px) {
  .stat-card {
    margin-bottom: 16px;
  }
  
  .pie-chart-mock {
    flex-direction: column;
    height: auto;
    padding: 20px 0;
  }
}
</style>
