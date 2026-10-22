<template>
  <div class="dashboard-container">
    <!-- 基础数据统计 -->
    <div class="stat-section">
      <h3 class="section-title">基础数据统计</h3>
      <div class="stat-cards">
        <div
          v-for="item in baseList"
          :key="item.key"
          class="stat-card"
        >
          <div class="stat-icon" :style="{ backgroundColor: item.color + '1A' }">
            <i :class="item.icon" :style="{ color: item.color }"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value" :style="{ color: item.color }">{{ statData[item.key] || 0 }}</div>
            <div class="stat-name">{{ item.name }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 排行榜图表 -->
    <div class="chart-section">
      <div class="chart-row">
        <div class="chart-card">
          <h3 class="chart-title">建筑识别排行</h3>
          <div ref="recognitionChart" class="chart-container"></div>
        </div>
        <div class="chart-card">
          <h3 class="chart-title">建筑 VR 查看排行</h3>
          <div ref="vrViewChart" class="chart-container"></div>
        </div>
        <div class="chart-card">
          <h3 class="chart-title">热门建筑排行</h3>
          <div ref="hotChart" class="chart-container"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import echarts from 'echarts'
import { getBaseData, getRecognitionRank, getVrRank, getHotRank } from '@/api/wxdata'

export default {
  name: 'Dashboard',
  data() {
    return {
      // 基础统计项配置
      baseList: [
        { key: 'buildingCount', name: '建筑总数', icon: 'el-icon-office-building', color: '#409EFF' },
        { key: 'vrBuildingCount', name: 'VR建筑', icon: 'el-icon-view', color: '#67C23A' },
        { key: 'visitorCount', name: '访问用户', icon: 'el-icon-user', color: '#E6A23C' },
        { key: 'scenicViewCount', name: '建筑浏览', icon: 'el-icon-data-line', color: '#909399' },
        { key: 'recognitionCount', name: '建筑识别', icon: 'el-icon-aim', color: '#F56C6C' },
        { key: 'vrViewCount', name: 'VR查看', icon: 'el-icon-monitor', color: '#5DD5C8' },
        { key: 'likeCount', name: '点赞总数', icon: 'el-icon-star-on', color: '#F7BA2A' }
      ],
      // 统计数据
      statData: {
        buildingCount: 0,
        vrBuildingCount: 0,
        visitorCount: 0,
        scenicViewCount: 0,
        recognitionCount: 0,
        vrViewCount: 0,
        likeCount: 0
      },
      // 排行榜数据
      recognitionData: [],
      vrRankData: [],
      hotRankData: [],
      // 图表实例
      recognitionChart: null,
      vrViewChart: null,
      hotChart: null
    }
  },
  created() {
    this.loadAllData()
  },
  mounted() {
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    this.disposeCharts()
  },
  methods: {
    // 加载所有数据
    async loadAllData() {
      await Promise.all([
        this.loadBaseData(),
        this.loadRecognitionRank(),
        this.loadVrRank(),
        this.loadHotRank()
      ])
      // 数据加载完成后初始化图表
      this.$nextTick(() => {
        this.initCharts()
      })
    },
    // 加载基础数据统计
    async loadBaseData() {
      try {
        const res = await getBaseData()
        if (res.code === 200 && res.data) {
          this.statData = {
            buildingCount: res.data.buildingCount || 0,
            vrBuildingCount: res.data.vrBuildingCount || 0,
            visitorCount: res.data.visitorCount || 0,
            scenicViewCount: res.data.scenicViewCount || 0,
            recognitionCount: res.data.recognitionCount || 0,
            vrViewCount: res.data.vrViewCount || 0,
            likeCount: res.data.likeCount || 0
          }
        }
      } catch (error) {
        console.error('加载基础数据统计失败', error)
      }
    },
    // 加载建筑识别排行
    async loadRecognitionRank() {
      try {
        const res = await getRecognitionRank({ limit: 5 })
        if (res.code === 200 && res.data) {
          this.recognitionData = res.data
        }
      } catch (error) {
        console.error('加载建筑识别排行失败', error)
      }
    },
    // 加载建筑VR查看排行
    async loadVrRank() {
      try {
        const res = await getVrRank({ limit: 5 })
        if (res.code === 200 && res.data) {
          this.vrRankData = res.data
        }
      } catch (error) {
        console.error('加载VR查看排行失败', error)
      }
    },
    // 加载热门建筑排行
    async loadHotRank() {
      try {
        const res = await getHotRank({ limit: 5 })
        if (res.code === 200 && res.data) {
          this.hotRankData = res.data
        }
      } catch (error) {
        console.error('加载热门建筑排行失败', error)
      }
    },
    // 初始化所有图表
    initCharts() {
      this.initRecognitionChart()
      this.initVrViewChart()
      this.initHotChart()
    },
    // 建筑识别排行（蓝色）
    initRecognitionChart() {
      if (!this.$refs.recognitionChart) return
      this.recognitionChart = echarts.init(this.$refs.recognitionChart)
      const chartData = this.recognitionData.map(item => item.value || 0)
      const nameData = this.recognitionData.map(item => item.name || '')
      this.recognitionChart.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#409EFF',
          borderWidth: 1,
          padding: [12, 16],
          textStyle: {
            color: '#303133',
            fontSize: 13
          },
          formatter: function(params) {
            const index = params[0].dataIndex
            const name = nameData[index]
            const value = chartData[index]
            const rank = index + 1
            return '<div style="font-weight: 600; margin-bottom: 8px; font-size: 14px;">' + name + '</div>' +
                   '<div style="color: #909399; margin-bottom: 4px;">排名：<span style="color: #409EFF; font-weight: 600;">第' + rank + '名</span></div>' +
                   '<div style="color: #909399;">数量：<span style="color: #409EFF; font-weight: 600;">' + value + ' 次</span></div>'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        yAxis: {
          type: 'category',
          data: nameData,
          axisLine: {
            lineStyle: { color: '#ebeef5' }
          },
          axisTick: {
            lineStyle: { color: '#ebeef5' }
          },
          axisLabel: {
            interval: 0,
            fontSize: 11,
            color: '#606266'
          }
        },
        xAxis: {
          type: 'value',
          axisLine: {
            lineStyle: { color: '#ebeef5' }
          },
          axisTick: {
            lineStyle: { color: '#ebeef5' }
          },
          axisLabel: {
            color: '#c0c4cc'
          },
          splitLine: {
            lineStyle: { color: '#f2f6fc' }
          }
        },
        series: [
          {
            name: '识别次数',
            type: 'bar',
            barWidth: '35%',
            data: chartData,
            itemStyle: {
              color: '#409EFF'
            },
            label: {
              show: true,
              position: 'top',
              fontSize: 11,
              color: '#303133'
            }
          }
        ]
      })
    },
    // 建筑VR查看排行（青色）
    initVrViewChart() {
      if (!this.$refs.vrViewChart) return
      this.vrViewChart = echarts.init(this.$refs.vrViewChart)
      const chartData = this.vrRankData.map(item => item.value || 0)
      const nameData = this.vrRankData.map(item => item.name || '')
      this.vrViewChart.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#5DD5C8',
          borderWidth: 1,
          padding: [12, 16],
          textStyle: {
            color: '#303133',
            fontSize: 13
          },
          formatter: function(params) {
            const index = params[0].dataIndex
            const name = nameData[index]
            const value = chartData[index]
            const rank = index + 1
            return '<div style="font-weight: 600; margin-bottom: 8px; font-size: 14px;">' + name + '</div>' +
                   '<div style="color: #909399; margin-bottom: 4px;">排名：<span style="color: #5DD5C8; font-weight: 600;">第' + rank + '名</span></div>' +
                   '<div style="color: #909399;">数量：<span style="color: #5DD5C8; font-weight: 600;">' + value + ' 次</span></div>'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        yAxis: {
          type: 'category',
          data: nameData,
          axisLine: {
            lineStyle: { color: '#ebeef5' }
          },
          axisTick: {
            lineStyle: { color: '#ebeef5' }
          },
          axisLabel: {
            interval: 0,
            fontSize: 11,
            color: '#606266'
          }
        },
        xAxis: {
          type: 'value',
          axisLine: {
            lineStyle: { color: '#ebeef5' }
          },
          axisTick: {
            lineStyle: { color: '#ebeef5' }
          },
          axisLabel: {
            color: '#c0c4cc'
          },
          splitLine: {
            lineStyle: { color: '#f2f6fc' }
          }
        },
        series: [
          {
            name: 'VR查看次数',
            type: 'bar',
            barWidth: '35%',
            data: chartData,
            itemStyle: {
              color: '#5DD5C8'
            },
            label: {
              show: true,
              position: 'top',
              fontSize: 11,
              color: '#303133'
            }
          }
        ]
      })
    },
    // 热门建筑排行（橙色）
    initHotChart() {
      if (!this.$refs.hotChart) return
      this.hotChart = echarts.init(this.$refs.hotChart)
      const chartData = this.hotRankData.map(item => item.value || 0)
      const nameData = this.hotRankData.map(item => item.name || '')
      this.hotChart.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#F7BA2A',
          borderWidth: 1,
          padding: [12, 16],
          textStyle: {
            color: '#303133',
            fontSize: 13
          },
          formatter: function(params) {
            const index = params[0].dataIndex
            const name = nameData[index]
            const value = chartData[index]
            const rank = index + 1
            return '<div style="font-weight: 600; margin-bottom: 8px; font-size: 14px;">' + name + '</div>' +
                   '<div style="color: #909399; margin-bottom: 4px;">排名：<span style="color: #F7BA2A; font-weight: 600;">第' + rank + '名</span></div>' +
                   '<div style="color: #909399;">数量：<span style="color: #F7BA2A; font-weight: 600;">' + value + ' 次</span></div>'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        yAxis: {
          type: 'category',
          data: nameData,
          axisLine: {
            lineStyle: { color: '#ebeef5' }
          },
          axisTick: {
            lineStyle: { color: '#ebeef5' }
          },
          axisLabel: {
            interval: 0,
            fontSize: 11,
            color: '#606266'
          }
        },
        xAxis: {
          type: 'value',
          axisLine: {
            lineStyle: { color: '#ebeef5' }
          },
          axisTick: {
            lineStyle: { color: '#ebeef5' }
          },
          axisLabel: {
            color: '#c0c4cc'
          },
          splitLine: {
            lineStyle: { color: '#f2f6fc' }
          }
        },
        series: [
          {
            name: '浏览量',
            type: 'bar',
            barWidth: '35%',
            data: chartData,
            itemStyle: {
              color: '#F7BA2A'
            },
            label: {
              show: true,
              position: 'top',
              fontSize: 11,
              color: '#303133'
            }
          }
        ]
      })
    },
    // 窗口大小变化时重绘图表
    handleResize() {
      if (this.recognitionChart) this.recognitionChart.resize()
      if (this.vrViewChart) this.vrViewChart.resize()
      if (this.hotChart) this.hotChart.resize()
    },
    // 销毁图表
    disposeCharts() {
      if (this.recognitionChart) {
        this.recognitionChart.dispose()
        this.recognitionChart = null
      }
      if (this.vrViewChart) {
        this.vrViewChart.dispose()
        this.vrViewChart = null
      }
      if (this.hotChart) {
        this.hotChart.dispose()
        this.hotChart = null
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  min-height: calc(100vh - 84px);
}

/* 标题样式 */
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 18px 0;
  padding-left: 10px;
  border-left: 4px solid #409eff;
  letter-spacing: 0.5px;
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 15px 0;
  padding-left: 10px;
  border-left: 4px solid #409eff;
  letter-spacing: 0.5px;
}

/* 统计卡片 - 横向紧凑布局 */
.stat-section {
  margin-bottom: 25px;
}

.stat-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.stat-card {
  flex: 1;
  min-width: 130px;
  display: flex;
  align-items: center;
  padding: 16px 18px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 20px 0 rgba(0, 0, 0, 0.12);
  }
}

.stat-icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-right: 12px;
  flex-shrink: 0;
  transition: transform 0.3s ease;

  .stat-card:hover & {
    transform: scale(1.1);
  }
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 4px;
  font-family: 'DIN Alternate', 'Helvetica Neue', Arial, sans-serif;
}

.stat-name {
  font-size: 12px;
  color: #909399;
  letter-spacing: 0.3px;
}

/* 图表区域 */
.chart-section {
  margin-top: 10px;
}

.chart-row {
  display: flex;
  gap: 18px;
}

.chart-card {
  flex: 1;
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 6px 20px 0 rgba(0, 0, 0, 0.1);
  }
}

.chart-container {
  width: 100%;
  height: 280px;
}

/* 响应式 */
@media screen and (max-width: 1200px) {
  .stat-card {
    min-width: calc(33.333% - 8px);
  }

  .chart-row {
    flex-direction: column;
  }
}

@media screen and (max-width: 768px) {
  .stat-card {
    min-width: calc(50% - 6px);
  }

  .dashboard-container {
    padding: 12px;
  }
}
</style>
