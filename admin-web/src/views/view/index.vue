<template>
  <div class="app-container">
    <!-- 面包屑 -->
    <el-breadcrumb separator="/" class="breadcrumb">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>启动页管理</el-breadcrumb-item>
      <el-breadcrumb-item>启动页管理</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 添加按钮 -->
    <el-button type="primary" icon="el-icon-plus" class="add-btn" @click="handleAdd">添加</el-button>

    <!-- 轮播图卡片网格 -->
    <div class="card-grid" v-loading="loading">
      <div class="pic-card" v-for="item in list" :key="item.id">
        <div class="pic-wrap">
          <img :src="item.pictureUrl" class="pic-img" @click="previewImage(item.pictureUrl)" />
        </div>
        <div class="pic-actions">
          <div class="switch-wrap">
            <span class="switch-label">启用</span>
            <el-switch
              v-model="item.status"
              active-color="#13ce66"
              inactive-color="#ff4949"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(item)"
            />
          </div>
          <el-button type="text" class="delete-btn" @click="handleDelete(item)">删除</el-button>
        </div>
      </div>
      <el-empty v-if="list.length === 0 && !loading" description="暂无轮播图" />
    </div>

    <!-- 添加/修改弹窗 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="图片" prop="pictureUrl">
          <el-upload
            class="avatar-uploader"
            :action="uploadFileApi"
            :headers="uploadFileHeaders"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :before-upload="beforeUpload"
            accept="image/*"
          >
            <img v-if="form.pictureUrl" :src="form.pictureUrl" class="avatar" />
            <i v-else class="el-icon-plus avatar-uploader-icon"></i>
          </el-upload>
          <div class="upload-tip">建议尺寸 1920×1080，支持 jpg/png</div>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
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
import { getView, addPicApi, deleteViewApi, uploadFileApi, uploadFileHeaders } from '@/api/view/view'

export default {
  name: 'Slideshow',
  data() {
    return {
      loading: false,
      list: [],
      dialogVisible: false,
      dialogTitle: '添加轮播图',
      form: {
        id: null,
        pictureUrl: '',
        status: 1
      },
      rules: {
        pictureUrl: [{ required: true, message: '请上传图片', trigger: 'change' }]
      },
      uploadFileApi,
      uploadFileHeaders,
      previewVisible: false,
      previewUrl: ''
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      getView().then(res => {
        this.list = res.rows || res.data || []
      }).finally(() => {
        this.loading = false
      })
    },
    handleAdd() {
      this.dialogTitle = '添加轮播图'
      this.form = { id: null, pictureUrl: '', status: 1 }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.form && this.$refs.form.clearValidate()
      })
    },
    handleStatusChange(item) {
      addPicApi({ id: item.id, status: item.status }).then(() => {
        this.$message.success('状态已更新')
      }).catch(() => {
        item.status = item.status === 1 ? 0 : 1
      })
    },
    handleDelete(item) {
      this.$confirm('确认删除该轮播图吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteViewApi(item.id).then(() => {
          this.$message.success('删除成功')
          this.getList()
        })
      }).catch(() => {})
    },
    beforeUpload(file) {
      const isImage = file.type.startsWith('image/')
      const isLt5M = file.size / 1024 / 1024 < 5
      if (!isImage) {
        this.$message.error('只能上传图片文件!')
        return false
      }
      if (!isLt5M) {
        this.$message.error('图片大小不能超过 5MB!')
        return false
      }
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
          addPicApi(this.form).then(() => {
            this.$message.success(this.form.id ? '修改成功' : '添加成功')
            this.dialogVisible = false
            this.getList()
          })
        }
      })
    },
    previewImage(url) {
      this.previewUrl = url
      this.previewVisible = true
    }
  }
}
</script>

<style lang="scss" scoped>
.breadcrumb {
  margin-bottom: 20px;
}
.add-btn {
  margin-bottom: 30px;
}
.card-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
}
.pic-card {
  width: 280px;
  background: #fff;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.pic-wrap {
  width: 100%;
  height: 180px;
  overflow: hidden;
  cursor: pointer;
}
.pic-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}
.pic-img:hover {
  transform: scale(1.05);
}
.pic-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
}
.switch-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.switch-label {
  font-size: 14px;
  color: #606266;
}
.delete-btn {
  color: #606266;
  font-size: 14px;
}
.delete-btn:hover {
  color: #f56c6c;
}
.avatar-uploader ::v-deep .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 200px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar-uploader ::v-deep .el-upload:hover {
  border-color: #409eff;
}
.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}
.avatar {
  width: 200px;
  height: 120px;
  object-fit: cover;
  display: block;
}
.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
}
</style>
