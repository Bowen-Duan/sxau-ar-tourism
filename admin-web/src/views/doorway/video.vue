<template>
  <div class="app-container">
    <!-- 面包屑 -->
    <el-breadcrumb separator="/" class="breadcrumb">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>热剧游</el-breadcrumb-item>
      <el-breadcrumb-item>宣传视频</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 搜索 -->
    <el-form :inline="true" :model="queryParams" class="search-form">
      <el-form-item label="视频名称">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入视频名称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" @click="handleQuery">查询</el-button>
      </el-form-item>
    </el-form>

    <!-- 新增按钮 -->
    <el-button type="primary" icon="el-icon-plus" class="add-btn" @click="handleAdd">新增视频</el-button>

    <!-- 表格 -->
    <el-table v-loading="loading" :data="list" border>
      <el-table-column label="序号" type="index" width="80" align="center" :index="indexMethod" />
      <el-table-column label="视频名称" prop="name" min-width="200" show-overflow-tooltip />
      <el-table-column label="排序" prop="inx" width="180" align="center">
        <template slot-scope="scope">
          <el-input-number
            v-model="scope.row.inx"
            :min="0"
            :max="999"
            size="small"
            controls-position="right"
            @change="handleSortChange(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="创建时间" prop="createTime" width="180" align="center" />
      <el-table-column label="操作" width="180" align="center">
        <template slot-scope="scope">
          <el-button size="mini" type="primary" @click="handleDetail(scope.row)">详情</el-button>
          <el-button size="mini" type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 新增/修改弹窗 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="600px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="封面" prop="cover">
          <el-upload
            class="cover-uploader"
            :action="uploadFileApi"
            :headers="uploadFileHeaders"
            :show-file-list="false"
            :on-success="handleCoverSuccess"
            :before-upload="beforeCoverUpload"
            accept="image/*"
          >
            <img v-if="form.cover" :src="form.cover" class="cover-img" />
            <div v-else class="cover-placeholder">
              <i class="el-icon-plus"></i>
            </div>
          </el-upload>
        </el-form-item>
        <el-form-item label="视频名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入视频名称" />
        </el-form-item>
        <el-form-item label="视频" prop="video">
          <el-upload
            class="video-uploader"
            :action="uploadFileApi"
            :headers="uploadFileHeaders"
            :show-file-list="false"
            :on-success="handleVideoSuccess"
            :before-upload="beforeVideoUpload"
            accept="video/*"
          >
            <el-button type="primary" icon="el-icon-upload2" :loading="videoUploading">点击上传</el-button>
          </el-upload>
          <div v-if="form.video" class="video-tip">
            <i class="el-icon-video-camera"></i> 已上传视频
            <el-button type="text" @click="previewVideo = form.video; videoDialogVisible = true">预览</el-button>
          </div>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.inx" :min="0" :max="999" controls-position="right" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm">提 交</el-button>
      </div>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog title="视频详情" :visible.sync="detailVisible" width="700px" append-to-body @close="stopAllVideos">
      <div v-if="detailData" class="detail-content">
        <div class="detail-cover">
          <img :src="detailData.cover" v-if="detailData.cover" />
        </div>
        <el-descriptions :column="2" border size="small" class="detail-desc">
          <el-descriptions-item label="视频名称">{{ detailData.name }}</el-descriptions-item>
          <el-descriptions-item label="排序">{{ detailData.inx }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ detailData.createTime }}</el-descriptions-item>
          <el-descriptions-item label="播放次数">{{ detailData.count || 0 }}</el-descriptions-item>
          <el-descriptions-item label="视频介绍" :span="2">{{ detailData.content || '无' }}</el-descriptions-item>
        </el-descriptions>
        <div class="detail-video" v-if="detailData.video">
          <video :src="detailData.video" controls style="width:100%;max-height:400px;"></video>
        </div>
      </div>
    </el-dialog>

    <!-- 视频预览弹窗 -->
    <el-dialog title="视频预览" :visible.sync="videoDialogVisible" width="700px" append-to-body @close="stopAllVideos">
      <video :src="previewVideo" controls style="width:100%;max-height:500px;"></video>
    </el-dialog>
  </div>
</template>

<script>
import { getTravelList, deleteTravelScenery, saveTravelScenery, updateTravelScenery } from '@/api/doorway/index'
import { uploadFileApi, uploadFileHeaders } from '@/api/view/view'

export default {
  name: 'TravelVideo',
  data() {
    return {
      loading: false,
      total: 0,
      list: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        name: ''
      },
      dialogVisible: false,
      dialogTitle: '新增视频',
      form: {
        id: null,
        name: '',
        cover: '',
        video: '',
        inx: 0
      },
      rules: {
        name: [{ required: true, message: '请输入视频名称', trigger: 'blur' }],
        cover: [{ required: true, message: '请上传封面', trigger: 'change' }],
        video: [{ required: true, message: '请上传视频', trigger: 'change' }]
      },
      uploadFileApi,
      uploadFileHeaders,
      videoUploading: false,
      detailVisible: false,
      detailData: null,
      videoDialogVisible: false,
      previewVideo: ''
    }
  },
  created() {
    this.getList()
  },
  methods: {
    indexMethod(index) {
      return (this.queryParams.pageNum - 1) * this.queryParams.pageSize + index + 1
    },
    getList() {
      this.loading = true
      const params = {}
      if (this.queryParams.name) params.name = this.queryParams.name
      params.pageNum = this.queryParams.pageNum
      params.pageSize = this.queryParams.pageSize
      getTravelList(params).then(res => {
        this.list = res.rows || []
        this.total = res.total || 0
      }).finally(() => {
        this.loading = false
      })
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    handleAdd() {
      this.dialogTitle = '新增视频'
      this.form = { id: null, name: '', cover: '', video: '', inx: 0 }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.form && this.$refs.form.clearValidate()
      })
    },
    handleSortChange(row) {
      updateTravelScenery({ id: row.id, inx: row.inx }).then(() => {
        this.$message.success('排序已更新')
      }).catch(() => {
        this.getList()
      })
    },
    handleDelete(row) {
      this.$confirm('确认删除视频 "' + row.name + '" 吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteTravelScenery(row.id).then(() => {
          this.$message.success('删除成功')
          this.getList()
        })
      }).catch(() => {})
    },
    handleDetail(row) {
      this.detailData = row
      this.detailVisible = true
    },
    beforeCoverUpload(file) {
      const isImage = file.type.startsWith('image/')
      const isLt5M = file.size / 1024 / 1024 < 5
      if (!isImage) { this.$message.error('只能上传图片文件!'); return false }
      if (!isLt5M) { this.$message.error('图片大小不能超过 5MB!'); return false }
      return true
    },
    beforeVideoUpload(file) {
      const isVideo = file.type.startsWith('video/')
      const isLt100M = file.size / 1024 / 1024 < 100
      if (!isVideo) { this.$message.error('只能上传视频文件!'); return false }
      if (!isLt100M) { this.$message.error('视频大小不能超过 100MB!'); return false }
      this.videoUploading = true
      return true
    },
    handleCoverSuccess(res) {
      const url = (res.data && res.data.url) || res.url || (res.fileName ? process.env.VUE_APP_BASE_API + res.fileName : '')
      if (url) {
        this.form.cover = url
      } else {
        this.$message.error('封面上传失败')
      }
    },
    handleVideoSuccess(res) {
      this.videoUploading = false
      const url = (res.data && res.data.url) || res.url || (res.fileName ? process.env.VUE_APP_BASE_API + res.fileName : '')
      if (url) {
        this.form.video = url
      } else {
        this.$message.error('视频上传失败')
      }
    },
    submitForm() {
      this.$refs.form.validate(valid => {
        if (valid) {
          const api = this.form.id ? updateTravelScenery : saveTravelScenery
          api(this.form).then(() => {
            this.$message.success(this.form.id ? '修改成功' : '新增成功')
            this.dialogVisible = false
            this.getList()
          })
        }
      })
    },
    stopAllVideos() {
      document.querySelectorAll('video').forEach(v => {
        v.pause()
        v.src = ''
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.breadcrumb {
  margin-bottom: 20px;
}
.search-form {
  margin-bottom: 10px;
}
.add-btn {
  margin-bottom: 20px;
}
.cover-uploader ::v-deep .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.cover-uploader ::v-deep .el-upload:hover {
  border-color: #409eff;
}
.cover-img {
  width: 200px;
  height: 200px;
  object-fit: cover;
}
.cover-placeholder {
  font-size: 28px;
  color: #8c939d;
}
.video-tip {
  margin-top: 8px;
  font-size: 13px;
  color: #67c23a;
}
.detail-content {
  text-align: center;
}
.detail-cover img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 4px;
  margin-bottom: 16px;
}
.detail-desc {
  text-align: left;
  margin-bottom: 16px;
}
.detail-video {
  margin-top: 16px;
}
</style>
