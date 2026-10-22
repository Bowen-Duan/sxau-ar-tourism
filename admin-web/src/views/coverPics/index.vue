<template>
  <div class="app-container">
    <!-- 面包屑 -->
    <el-breadcrumb separator="/" class="breadcrumb">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>封面图管理</el-breadcrumb-item>
      <el-breadcrumb-item>封面图管理</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 两列封面 -->
    <div class="cover-wrap">
      <!-- 拍照识别封面 -->
      <div class="cover-item">
        <el-button type="primary" icon="el-icon-edit" @click="handleEdit(0)">修改拍照封面</el-button>
        <div class="cover-img-wrap" v-loading="loading[0]">
          <img v-if="coverUrl[0]" :src="coverUrl[0]" class="cover-img" @click="preview(0)" />
          <el-empty v-else description="暂无封面" :image-size="80" />
        </div>
      </div>

      <!-- 建筑可阅读封面 -->
      <div class="cover-item">
        <el-button type="primary" icon="el-icon-edit" @click="handleEdit(1)">修改阅读封面</el-button>
        <div class="cover-img-wrap" v-loading="loading[1]">
          <img v-if="coverUrl[1]" :src="coverUrl[1]" class="cover-img" @click="preview(1)" />
          <el-empty v-else description="暂无封面" :image-size="80" />
        </div>
      </div>
    </div>

    <!-- 修改封面弹窗 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="封面图" prop="pictureUrl">
          <el-upload
            class="cover-uploader"
            :action="uploadFileApi"
            :headers="uploadFileHeaders"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :before-upload="beforeUpload"
            accept="image/*"
          >
            <img v-if="form.pictureUrl" :src="form.pictureUrl" class="upload-img" />
            <div v-else class="upload-placeholder">
              <i class="el-icon-plus"></i>
              <p>点击上传封面图</p>
            </div>
          </el-upload>
          <div class="upload-tip">建议尺寸 1920×1080，支持 jpg/png，大小不超过 5MB</div>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 图片预览 -->
    <el-image-viewer
      v-if="previewVisible"
      :url-list="[previewUrl]"
      @close="previewVisible = false"
    />
  </div>
</template>

<script>
import { getCoverApi, editCoverApi, uploadFileApi, uploadFileHeaders } from '@/api/view/view'

export default {
  name: 'CoverPics',
  data() {
    return {
      coverUrl: ['', ''],
      loading: [false, false],
      dialogVisible: false,
      dialogTitle: '修改封面',
      currentIdentity: 0,
      form: {
        pictureUrl: '',
        identity: 0
      },
      rules: {
        pictureUrl: [{ required: true, message: '请上传封面图', trigger: 'change' }]
      },
      uploadFileApi,
      uploadFileHeaders,
      previewVisible: false,
      previewUrl: ''
    }
  },
  created() {
    this.loadCover(0)
    this.loadCover(1)
  },
  methods: {
    loadCover(identity) {
      this.$set(this.loading, identity, true)
      getCoverApi(identity).then(res => {
        const url = (res && res.data) || (res && res.url) || ''
        this.$set(this.coverUrl, identity, url)
      }).catch(() => {
        this.$set(this.coverUrl, identity, '')
      }).finally(() => {
        this.$set(this.loading, identity, false)
      })
    },
    handleEdit(identity) {
      this.currentIdentity = identity
      this.dialogTitle = identity === 0 ? '修改拍照封面' : '修改阅读封面'
      this.form = { pictureUrl: this.coverUrl[identity] || '', identity }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.form && this.$refs.form.clearValidate()
      })
    },
    beforeUpload(file) {
      const isImage = file.type.startsWith('image/')
      const isLt5M = file.size / 1024 / 1024 < 5
      if (!isImage) { this.$message.error('只能上传图片文件!'); return false }
      if (!isLt5M) { this.$message.error('图片大小不能超过 5MB!'); return false }
      return true
    },
    handleUploadSuccess(res) {
      const url = (res.data && res.data.url) || res.url || (res.fileName ? process.env.VUE_APP_BASE_API + res.fileName : '')
      if (url) {
        this.form.pictureUrl = url
      } else {
        this.$message.error('上传失败')
      }
    },
    submitForm() {
      this.$refs.form.validate(valid => {
        if (valid) {
          editCoverApi(this.form).then(() => {
            this.$message.success('修改成功')
            this.dialogVisible = false
            this.$set(this.coverUrl, this.currentIdentity, this.form.pictureUrl)
          })
        }
      })
    },
    preview(identity) {
      if (this.coverUrl[identity]) {
        this.previewUrl = this.coverUrl[identity]
        this.previewVisible = true
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.breadcrumb {
  margin-bottom: 30px;
}
.cover-wrap {
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
}
.cover-item {
  flex: 1;
  min-width: 400px;
}
.cover-img-wrap {
  margin-top: 20px;
  width: 100%;
  height: 400px;
  background: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.cover-img {
  width: 100%;
  height: 400px;
  object-fit: cover;
  cursor: pointer;
  border-radius: 4px;
}
.cover-uploader ::v-deep .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  width: 100%;
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.cover-uploader ::v-deep .el-upload:hover {
  border-color: #409eff;
}
.upload-img {
  width: 100%;
  height: 250px;
  object-fit: contain;
}
.upload-placeholder {
  text-align: center;
  color: #8c939d;
}
.upload-placeholder i {
  font-size: 32px;
}
.upload-placeholder p {
  margin: 8px 0 0;
  font-size: 13px;
}
.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}
</style>
