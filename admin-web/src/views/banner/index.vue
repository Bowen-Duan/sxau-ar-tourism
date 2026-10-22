<template>
  <div class="banner-page">
    <el-breadcrumb separator="/" class="breadcrumb">
      <el-breadcrumb-item :to="{ path: '/index' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>banner</el-breadcrumb-item>
      <el-breadcrumb-item>banner</el-breadcrumb-item>
    </el-breadcrumb>

    <div class="action-bar">
      <el-button type="primary" icon="el-icon-plus" @click="handleAdd">新增</el-button>
    </div>

    <div class="banner-grid" v-loading="loading">
      <div class="banner-card" v-for="item in list" :key="item.id">
        <div class="banner-img-wrap">
          <img :src="item.pictureUrl" class="banner-img" @click="previewImg = item.pictureUrl; previewVisible = true" />
        </div>
        <div class="banner-actions">
          <el-button type="primary" size="small" @click="handleEdit(item)">修改</el-button>
          <el-button size="small" @click="handleDelete(item)">删除</el-button>
        </div>
      </div>
      <el-empty v-if="list.length === 0 && !loading" description="暂无banner" />
    </div>

    <!-- 新增/修改弹窗 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="500px" append-to-body>
      <el-form :model="form" :rules="rules" ref="form" label-width="100px">
        <el-form-item label="banner封面" prop="pictureUrl">
          <el-upload
            :action="uploadFileApi"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :before-upload="beforeUpload"
            class="banner-upload"
          >
            <img v-if="form.pictureUrl" :src="form.pictureUrl" class="upload-preview" />
            <div v-else class="upload-placeholder">
              <i class="el-icon-plus"></i>
            </div>
          </el-upload>
          <div class="upload-tip">照片数量限制为1个</div>
        </el-form-item>
        <el-form-item label="banner地址" prop="sortOrder">
          <el-input v-model="form.sortOrder" placeholder="请输入排序号" />
        </el-form-item>
        <el-form-item label="是否启用">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">是</el-radio>
            <el-radio :label="0">否</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">{{ isEdit ? '立即修改' : '立即新增' }}</el-button>
      </div>
    </el-dialog>

    <!-- 图片预览 -->
    <el-dialog title="图片预览" :visible.sync="previewVisible" width="700px" append-to-body>
      <img :src="previewImg" style="width:100%;" />
    </el-dialog>
  </div>
</template>

<script>
import { getView, addPicApi, deleteViewApi, uploadFileApi, uploadFileHeaders } from '@/api/view/view'

export default {
  name: 'Banner',
  data() {
    return {
      loading: false,
      list: [],
      dialogVisible: false,
      dialogTitle: '新增banner',
      isEdit: false,
      form: { id: null, pictureUrl: '', sortOrder: '', status: 1 },
      rules: {
        pictureUrl: [{ required: true, message: '请上传banner封面', trigger: 'change' }]
      },
      uploadFileApi,
      uploadHeaders: uploadFileHeaders,
      previewVisible: false,
      previewImg: ''
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
      this.isEdit = false
      this.dialogTitle = '新增banner'
      this.form = { id: null, pictureUrl: '', sortOrder: '', status: 1 }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.form && this.$refs.form.clearValidate()
      })
    },
    handleEdit(item) {
      this.isEdit = true
      this.dialogTitle = '修改banner'
      this.form = { id: item.id, pictureUrl: item.pictureUrl, sortOrder: item.id || '', status: item.status }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.form && this.$refs.form.clearValidate()
      })
    },
    handleDelete(item) {
      this.$confirm('确认删除该banner？', '提示', {
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
      if (!isImage) {
        this.$message.error('只能上传图片文件')
        return false
      }
      return true
    },
    handleUploadSuccess(res) {
      const url = (res && res.data && res.data.url) || (res && res.url) || (res && res.data)
      if (url) {
        this.form.pictureUrl = url
        this.$message.success('上传成功')
      } else {
        this.$message.error('上传失败')
      }
    },
    submitForm() {
      this.$refs.form.validate(valid => {
        if (valid) {
          const payload = { pictureUrl: this.form.pictureUrl, status: this.form.status }
          if (this.isEdit) payload.id = this.form.id
          addPicApi(payload).then(() => {
            this.$message.success(this.isEdit ? '修改成功' : '新增成功')
            this.dialogVisible = false
            this.getList()
          })
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.banner-page {
  padding: 20px;
}
.breadcrumb {
  margin-bottom: 20px;
}
.action-bar {
  margin-bottom: 20px;
}
.banner-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}
.banner-card {
  width: calc(33.333% - 14px);
  min-width: 280px;
}
.banner-img-wrap {
  width: 100%;
  height: 200px;
  background: #f5f7fa;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}
.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
}
.banner-actions {
  display: flex;
  gap: 10px;
}
.banner-upload {
  display: inline-block;
}
.upload-preview {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}
.upload-placeholder {
  width: 120px;
  height: 120px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #8c939d;
  cursor: pointer;
}
.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}
</style>
