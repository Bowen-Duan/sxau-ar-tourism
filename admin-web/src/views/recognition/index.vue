<template>
  <div class="recognition-page">
    <el-breadcrumb separator="/" class="breadcrumb">
      <el-breadcrumb-item :to="{ path: '/index' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>识别库管理</el-breadcrumb-item>
      <el-breadcrumb-item>识别库管理</el-breadcrumb-item>
    </el-breadcrumb>

    <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="recognition-tabs">
      <el-tab-pane label="官方识别库" name="official"></el-tab-pane>
      <el-tab-pane label="用户识别库" name="user"></el-tab-pane>
    </el-tabs>

    <div class="action-bar">
      <el-button @click="goBack">返回</el-button>
      <el-button type="primary" icon="el-icon-plus" @click="handleAdd">新增</el-button>
      <el-button type="danger" icon="el-icon-delete" :disabled="selectedIds.length === 0" @click="handleBatchDelete">删除</el-button>
    </div>

    <div class="img-grid" v-loading="loading">
      <div class="img-card" v-for="item in list" :key="item.id" @click="toggleSelect(item.id)" :class="{ selected: selectedIds.includes(item.id) }">
        <img :src="item.url" class="recognition-img" />
        <div class="img-name">{{ item.filename }}</div>
        <div class="select-mask" v-if="selectedIds.includes(item.id)">
          <i class="el-icon-check"></i>
        </div>
      </div>
      <el-empty v-if="list.length === 0 && !loading" description="暂无图片" />
    </div>

    <!-- 新增弹窗 -->
    <el-dialog title="新增识别库图片（将保存到用户识别库）" :visible.sync="dialogVisible" width="500px" append-to-body>
      <el-form :model="form" :rules="rules" ref="form" label-width="100px">
        <el-form-item label="图片" prop="url">
          <el-upload
            :action="uploadFileApi"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :before-upload="beforeUpload"
          >
            <img v-if="form.url" :src="form.url" class="upload-preview" />
            <div v-else class="upload-placeholder">
              <i class="el-icon-plus"></i>
            </div>
          </el-upload>
        </el-form-item>
        <el-form-item label="文件名" prop="filename">
          <el-input v-model="form.filename" placeholder="请输入文件名" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getRecognitionList, addRecognition, deleteRecognition, uploadFileApi } from '@/api/recognition/index'

export default {
  name: 'Recognition',
  data() {
    return {
      loading: false,
      activeTab: 'official',
      list: [],
      selectedIds: [],
      dialogVisible: false,
      form: { url: '', filename: '', source: 1, tag: 1, moduleDetailId: 819723818527625216 },
      rules: {
        url: [{ required: true, message: '请上传图片', trigger: 'change' }],
        filename: [{ required: true, message: '请输入文件名', trigger: 'blur' }]
      },
      uploadFileApi
    }
  },
  computed: {
    uploadHeaders() {
      return {
        Authorization: 'Bearer ' + (this.$store.getters.token || '')
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      this.selectedIds = []
      const source = this.activeTab === 'official' ? 1 : 2
      getRecognitionList({ source: source, pageNum: 1, pageSize: 100 }).then(res => {
        this.list = res.rows || res.data || []
      }).catch(() => {
        this.list = []
      }).finally(() => {
        this.loading = false
      })
    },
    handleTabClick() {
      this.getList()
    },
    goBack() {
      this.$router.back()
    },
    toggleSelect(id) {
      const index = this.selectedIds.indexOf(id)
      if (index > -1) {
        this.selectedIds.splice(index, 1)
      } else {
        this.selectedIds.push(id)
      }
    },
    handleAdd() {
      this.form = { url: '', filename: '', source: this.activeTab === 'official' ? 1 : 2, tag: 1, moduleDetailId: 819723818527625216 }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.form && this.$refs.form.clearValidate()
      })
    },
    handleBatchDelete() {
      if (this.selectedIds.length === 0) {
        this.$message.warning('请先选择要删除的图片')
        return
      }
      this.$confirm(`确认删除选中的 ${this.selectedIds.length} 张图片？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteRecognition(this.selectedIds).then(() => {
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
      console.log('上传返回:', JSON.stringify(res))
      let url = ''
      if (res && res.data && res.data.url) {
        url = res.data.url
      } else if (res && res.url) {
        url = res.url
      } else if (res && res.data && typeof res.data === 'string') {
        url = res.data
      }
      if (url && url.startsWith('/')) {
        url = 'http://localhost:8020' + url
      }
      if (url) {
        this.form.url = url
        if (!this.form.filename) {
          this.form.filename = '识别图片_' + Date.now()
        }
        this.$message.success('上传成功，URL: ' + url.substring(0, 50) + '...')
      } else {
        this.$message.error('上传失败，返回: ' + JSON.stringify(res).substring(0, 100))
      }
    },
    submitForm() {
      this.$refs.form.validate(valid => {
        if (valid) {
          const payload = {
            filename: this.form.filename,
            url: this.form.url,
            source: this.form.source,
            tag: this.form.tag,
            moduleDetailId: this.form.moduleDetailId
          }
          console.log('提交payload:', JSON.stringify(payload))
          if (!payload.url) {
            this.$message.error('图片URL为空，请先上传图片')
            return
          }
          addRecognition(this.form.tag, payload).then(() => {
            this.$message.success('新增成功，图片已保存到用户识别库')
            this.dialogVisible = false
            // 后端硬编码source=2，新增后自动切换到用户识别库Tab
            this.activeTab = 'user'
            this.$nextTick(() => {
              this.getList()
            })
          }).catch(err => {
            this.$message.error('新增失败: ' + (err.message || '未知错误'))
          })
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.recognition-page {
  padding: 20px;
}
.breadcrumb {
  margin-bottom: 20px;
}
.recognition-tabs {
  margin-bottom: 20px;
}
.action-bar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}
.img-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.img-card {
  width: 200px;
  cursor: pointer;
  position: relative;
  border: 2px solid transparent;
  border-radius: 4px;
  transition: border-color 0.2s;
}
.img-card.selected {
  border-color: #409eff;
}
.recognition-img {
  width: 200px;
  height: 150px;
  object-fit: cover;
  border-radius: 4px;
  display: block;
}
.img-name {
  font-size: 12px;
  color: #606266;
  margin-top: 6px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.select-mask {
  position: absolute;
  top: 0;
  right: 0;
  width: 24px;
  height: 24px;
  background: #409eff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0 4px 0 4px;
  font-size: 16px;
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
</style>
