<template>
  <div class="app-container statistics-page">
    <!-- 概览卡片 -->
    <el-row :gutter="20">
      <el-col :span="6" v-for="card in cards" :key="card.label">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ card.value }}</div>
          <div class="stat-label">{{ card.label }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 每日趋势 -->
    <el-card shadow="never" class="chart-card">
      <div slot="header" class="chart-header">
        <span>每日趋势（最近 {{ trendDays }} 天）</span>
        <el-radio-group v-model="trendDays" size="mini" @change="loadTrend">
          <el-radio-button :label="7">7 天</el-radio-button>
          <el-radio-button :label="14">14 天</el-radio-button>
          <el-radio-button :label="30">30 天</el-radio-button>
        </el-radio-group>
      </div>
      <div ref="trendChart" class="chart-box" />
    </el-card>

    <el-row :gutter="20">
      <!-- 点赞排行 -->
      <el-col :span="12">
        <el-card shadow="never" class="chart-card">
          <div slot="header"><span>建筑点赞排行 Top 10</span></div>
          <div ref="likeChart" class="chart-box" />
        </el-card>
      </el-col>
      <!-- 识别排行 -->
      <el-col :span="12">
        <el-card shadow="never" class="chart-card">
          <div slot="header"><span>建筑识别排行 Top 10</span></div>
          <div ref="recognitionChart" class="chart-box" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import echarts from 'echarts'
require('echarts/theme/macarons')
import { getBaseData, getDailyTrend, getLikeRank, getRecognitionRank } from '@/api/wxdata'

export default {
  name: 'Statistics',
  data() {
    return {
      base: {},
      trendDays: 14,
      charts: []
    }
  },
  computed: {
    cards() {
      return [
        { label: '建筑总数', value: this.base.buildingCount || 0 },
        { label: '访问用户数', value: this.base.visitorCount || 0 },
        { label: '建筑浏览次数', value: this.base.scenicViewCount || 0 },
        { label: '点赞总数', value: this.base.likeCount || 0 }
      ]
    }
  },
  mounted() {
    this.loadBase()
    this.loadTrend()
    this.loadRanks()
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    this.charts.forEach(c => c.dispose())
    this.charts = []
  },
  methods: {
    handleResize() {
      this.charts.forEach(c => c.resize())
    },
    async loadBase() {
      try {
        const res = await getBaseData()
        if (res.code === 200 && res.data) {
          this.base = res.data
        }
      } catch (e) { /* 接口异常时保持 0 值展示 */ }
    },
    async loadTrend() {
      try {
        const res = await getDailyTrend({ days: this.trendDays })
        if (res.code === 200 && res.data) {
          this.renderTrend(res.data)
        }
      } catch (e) { /* 接口异常时不渲染 */ }
    },
    async loadRanks() {
      try {
        const likeRes = await getLikeRank({ limit: 10 })
        if (likeRes.code === 200 && likeRes.data) {
          this.renderBar(this.$refs.likeChart, likeRes.data, '点赞数')
        }
        const recRes = await getRecognitionRank({ limit: 10 })
        if (recRes.code === 200 && recRes.data) {
          this.renderBar(this.$refs.recognitionChart, recRes.data, '识别次数')
        }
      } catch (e) { /* 接口异常时不渲染 */ }
    },
    renderTrend(rows) {
      if (!this.$refs.trendChart) return
      const chart = echarts.init(this.$refs.trendChart, 'macarons')
      chart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['建筑浏览', '建筑识别', 'VR 查看'] },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: rows.map(r => r.date) },
        yAxis: { type: 'value', minInterval: 1 },
        series: [
          { name: '建筑浏览', type: 'line', smooth: true, data: rows.map(r => r.viewCount || 0) },
          { name: '建筑识别', type: 'line', smooth: true, data: rows.map(r => r.recognitionCount || 0) },
          { name: 'VR 查看', type: 'line', smooth: true, data: rows.map(r => r.vrCount || 0) }
        ]
      })
      this.charts.push(chart)
    },
    renderBar(el, rows, seriesName) {
      if (!el) return
      // 排行接口按值降序返回；横向条形图需翻转使第一名在顶部
      const data = [...rows].reverse()
      const chart = echarts.init(el, 'macarons')
      chart.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'value', minInterval: 1 },
        yAxis: { type: 'category', data: data.map(r => r.name) },
        series: [{ name: seriesName, type: 'bar', data: data.map(r => r.value) }]
      })
      this.charts.push(chart)
    }
  }
}
</script>

<style scoped>
.statistics-page .stat-card {
  text-align: center;
  margin-bottom: 20px;
}
.statistics-page .stat-value {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.4;
}
.statistics-page .stat-label {
  color: #909399;
  font-size: 13px;
}
.statistics-page .chart-card {
  margin-bottom: 20px;
}
.statistics-page .chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.statistics-page .chart-box {
  height: 340px;
}
</style>
