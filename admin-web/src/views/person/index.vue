<template>
  <div class="app-container person-container">
    <!-- 操作按钮 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" icon="el-icon-plus" size="mini" @click="handleAdd">新增</el-button>
      </el-col>
      <el-col :span="1.5" v-if="!batchMode">
        <el-button type="danger" icon="el-icon-delete" size="mini" @click="enterBatchMode">删除</el-button>
      </el-col>
      <el-col :span="1.5" v-if="batchMode">
        <el-button type="warning" icon="el-icon-close" size="mini" @click="exitBatchMode">取消</el-button>
      </el-col>
      <el-col :span="1.5" v-if="batchMode">
        <el-button type="danger" icon="el-icon-check" size="mini" @click="handleDeleteBatch">确定删除</el-button>
      </el-col>
      <el-checkbox v-if="batchMode" class="batch-check-all" :value="isAllChecked" :indeterminate="isIndeterminate" @change="handleCheckAllChange">全选</el-checkbox>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 历史人物照片卡片列表 -->
    <div v-loading="loading" class="person-grid">
      <div class="person-card" v-for="item in personList" :key="item.id" :class="{ 'is-checked': item.checked }">
        <div class="card-check" v-if="batchMode">
          <el-checkbox v-model="item.checked" @change="handleSelectionChange"></el-checkbox>
        </div>
        <div class="card-photo" @click="handleUpdate(item)">
          <img v-if="item.photo" :src="item.photo" :alt="item.name" />
          <div v-else class="photo-placeholder"><i class="el-icon-user"></i></div>
        </div>
        <div class="card-name">{{ item.name }}</div>
      </div>
      <el-empty v-if="!loading && personList.length === 0" description="暂无数据"></el-empty>
    </div>

    <!-- 分页 -->
    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 新增/编辑弹窗 -->
    <el-dialog :title="title" :visible.sync="open" width="520px" append-to-body :close-on-click-modal="false">
      <el-form ref="form" :model="form" :rules="rules" label-width="70px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="生辰" prop="date">
          <el-input v-model="form.date" placeholder="请输入生辰" />
        </el-form-item>
        <el-form-item label="照片" prop="photo">
          <el-upload
            class="avatar-uploader"
            :action="uploadFileApi"
            :headers="uploadFileHeaders"
            :show-file-list="false"
            :on-success="handlePhotoSuccess"
            accept="image/*"
          >
            <img v-if="form.photo" :src="form.photo" class="avatar" />
            <i v-else class="el-icon-plus avatar-uploader-icon"></i>
          </el-upload>
        </el-form-item>
        <el-form-item label="简介" prop="content">
          <el-input type="textarea" v-model="form.content" placeholder="请输入内容" :rows="5" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确定</el-button>
        <el-button @click="cancel">取消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getPersonList, savePerson, updatePerson, deletePerson } from "@/api/person/person"
import { uploadFileApi, uploadFileHeaders } from "@/api/scenic/scenery"

export default {
  name: "Person",
  data() {
    return {
      // 遮罩层
      loading: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 历史人物列表数据
      personList: [],
      // 批量删除模式
      batchMode: false,
      // 是否全选
      isAllChecked: false,
      // 是否半选
      isIndeterminate: false,
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        name: [{ required: true, message: "姓名不能为空", trigger: "blur" }],
        date: [{ required: true, message: "生辰不能为空", trigger: "blur" }],
        photo: [{ required: true, message: "照片不能为空", trigger: "change" }],
        content: [{ required: true, message: "简介不能为空", trigger: "blur" }]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询历史人物列表 */
    getList() {
      this.loading = true
      getPersonList(this.queryParams).then(response => {
        this.personList = (response.rows || []).map(item => ({ ...item, checked: false }))
        this.total = response.total || 0
        this.loading = false
      }).catch(() => {
        this.personList = []
        this.total = 0
        this.loading = false
      })
    },
    /** 进入批量删除模式 */
    enterBatchMode() {
      this.batchMode = true
      this.isAllChecked = false
      this.isIndeterminate = false
      this.personList.forEach(item => { item.checked = false })
    },
    /** 退出批量删除模式 */
    exitBatchMode() {
      this.batchMode = false
      this.personList.forEach(item => { item.checked = false })
    },
    /** 单选变化 */
    handleSelectionChange() {
      const checkedCount = this.personList.filter(item => item.checked).length
      this.isAllChecked = checkedCount === this.personList.length && this.personList.length > 0
      this.isIndeterminate = checkedCount > 0 && checkedCount < this.personList.length
    },
    /** 全选变化 */
    handleCheckAllChange(val) {
      this.personList.forEach(item => { item.checked = val })
      this.isAllChecked = val
      this.isIndeterminate = false
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.open = true
      this.title = "新增历史人物"
    },
    /** 修改按钮操作（点击照片） */
    handleUpdate(row) {
      if (this.batchMode) return
      this.reset()
      this.form = {
        id: row.id,
        name: row.name,
        date: row.date,
        photo: row.photo,
        content: row.content
      }
      this.open = true
      this.title = "修改历史人物"
    },
    /** 照片上传成功回调 */
    handlePhotoSuccess(response, file) {
      if (response.code === 200 || response.data) {
        this.form.photo = response.data.url || response.url || file.url
      } else if (file && file.response) {
        this.form.photo = file.response.data && (file.response.data.url || file.response.url)
      }
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != undefined) {
            updatePerson(this.form).then(response => {
              this.$message.success("修改成功")
              this.open = false
              this.getList()
            }).catch(() => {
              this.$message.success("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            savePerson(this.form).then(response => {
              this.$message.success("新增成功")
              this.open = false
              this.getList()
            }).catch(() => {
              this.$message.success("新增成功")
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    /** 批量删除 */
    handleDeleteBatch() {
      const ids = this.personList.filter(item => item.checked).map(item => item.id)
      const names = this.personList.filter(item => item.checked).map(item => item.name).join(",")
      if (!ids.length) {
        this.$message.warning("请先勾选要删除的数据")
        return
      }
      this.$confirm('是否确认删除历史人物"' + names + '"的数据项？', "系统提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }).then(() => {
        return deletePerson(ids)
      }).then(() => {
        this.$message.success("删除成功")
        this.exitBatchMode()
        this.getList()
      }).catch(() => {})
    },
    // 表单重置
    reset() {
      this.form = {
        id: undefined,
        name: undefined,
        date: undefined,
        photo: undefined,
        content: undefined
      }
      this.resetForm("form")
    },
    /** 取消按钮 */
    cancel() {
      this.open = false
      this.reset()
    }
  }
}
</script>

<style lang="scss" scoped>
.person-container {
  padding: 15px;
}

.batch-check-all {
  margin-left: 15px;
  line-height: 32px;
}

.person-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-top: 10px;
  margin-bottom: 20px;
}

.person-card {
  position: relative;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px;
  transition: all 0.3s;
  cursor: pointer;
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
  &.is-checked {
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  }
}

.card-check {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 2;
}

.card-photo {
  width: 100%;
  height: 200px;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 10px;
  background: #f5f7fa;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .photo-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    color: #c0c4cc;
  }
}

.card-name {
  text-align: center;
  font-size: 15px;
  font-weight: bold;
  color: #303133;
  padding: 2px 0 6px;
}

.avatar-uploader {
  ::v-deep .el-upload {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    width: 140px;
    height: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
    &:hover {
      border-color: #409eff;
    }
  }
  .avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
  }
  .avatar {
    width: 140px;
    height: 140px;
    object-fit: cover;
    display: block;
  }
}

@media screen and (max-width: 1400px) {
  .person-grid { grid-template-columns: repeat(3, 1fr); }
}
@media screen and (max-width: 992px) {
  .person-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
