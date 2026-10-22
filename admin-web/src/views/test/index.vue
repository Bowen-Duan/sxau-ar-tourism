<template>
  <div>
    <div class="app-container">这是一个test页面</div>
    <el-select v-model="currentStatus" placeholder="景点状态" clearable size="small" style="width: 240px">
      <el-option v-for="dict in statusList" :key="dict.dictValue" :label="dict.dictLabel" :value="dict.dictValue" />
    </el-select>
  </div>
</template>

<script>
export default {
  data() {
    return {
      statusList: [],
      currentStatus: '1'
    }
  },
  created() {
    this.getDicts("build_status").then(response => {
      this.statusList = response.data
      console.log(response.data)
    });
  }
}
</script>