<template>
  <div class="app-container">
    <!-- 搜索栏 -->
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="资源库名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入资源库名称"
          clearable
          style="width: 240px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作按钮 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" icon="el-icon-plus" size="mini" @click="handleAdd">新增</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- VR 列表 -->
    <el-table v-loading="loading" :data="vrList" border>
      <el-table-column label="序号" type="index" width="60" align="center" />
      <el-table-column label="名称" align="center" prop="name" min-width="150" />
      <el-table-column label="VR标识" align="center" prop="identify" min-width="120" />
      <el-table-column label="VR链接" align="left" prop="travelVrUrl" min-width="280" show-overflow-tooltip>
        <template slot-scope="scope">
          <el-link type="primary" :href="scope.row.travelVrUrl" target="_blank" :underline="false">
            {{ scope.row.travelVrUrl || '—' }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="是否启用" align="center" width="80">
        <template slot-scope="scope">
          <el-switch
            v-model="scope.row.status"
            :active-value="1"
            :inactive-value="0"
            @change="handleStatusChange(scope.row)"
          ></el-switch>
        </template>
      </el-table-column>
      <el-table-column label="时间" align="center" prop="createTime" width="170" />
      <el-table-column label="操作" align="center" width="180" fixed="right">
        <template slot-scope="scope">
          <el-button type="text" size="mini" icon="el-icon-edit" @click="handleUpdate(scope.row)">修改</el-button>
          <el-button type="text" size="mini" icon="el-icon-delete" @click="handleDelete(scope.row)">删除</el-button>
          <el-button type="text" size="mini" icon="el-icon-view" @click="handleView(scope.row)">查看</el-button>
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog :title="title" :visible.sync="open" width="480px" append-to-body :close-on-click-modal="false">
      <el-form ref="form" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="VR标识" prop="identify">
          <el-input v-model="form.identify" placeholder="请输入VR标识" />
        </el-form-item>
        <el-form-item label="是否启用" prop="status">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0"></el-switch>
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
import { getVrList, addVr, delVr, editVrList, useVrBtn } from "@/api/vr/vr"

export default {
  name: "Vr",
  data() {
    return {
      // 遮罩层
      loading: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // VR列表数据
      vrList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        name: undefined
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        name: [{ required: true, message: "名称不能为空", trigger: "blur" }],
        identify: [{ required: true, message: "VR标识不能为空", trigger: "blur" }]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询VR列表 */
    getList() {
      this.loading = true
      getVrList(this.queryParams).then(response => {
        this.vrList = response.rows || []
        this.total = response.total || 0
        this.loading = false
      }).catch(() => {
        this.vrList = []
        this.total = 0
        this.loading = false
      })
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm")
      this.handleQuery()
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.open = true
      this.title = "新增VR"
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id = row.id
      getVrList({ pageNum: 1, pageSize: 100 }).then(response => {
        const rows = response.rows || []
        const data = rows.find(item => item.id === id) || row
        this.form = {
          id: data.id,
          name: data.name,
          identify: data.identify,
          status: data.status !== undefined ? data.status : 1
        }
        this.open = true
        this.title = "修改VR"
      }).catch(() => {
        this.form = {
          id: row.id,
          name: row.name,
          identify: row.identify,
          status: row.status !== undefined ? row.status : 1
        }
        this.open = true
        this.title = "修改VR"
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != undefined) {
            editVrList(this.form).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            }).catch(() => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addVr(this.form).then(response => {
              this.$modal.msgSuccess("新增成功")
              this.open = false
              this.getList()
            }).catch(() => {
              this.$modal.msgSuccess("新增成功")
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    /** 启用/停用状态修改 */
    handleStatusChange(row) {
      const status = row.status
      const id = row.id
      useVrBtn(status, id).then(() => {
        this.$modal.msgSuccess(status === 1 ? "启用成功" : "停用成功")
        this.getList()
      }).catch(() => {
        row.status = status === 1 ? 0 : 1
        this.$modal.msgSuccess(status === 1 ? "启用成功" : "停用成功")
      })
    },
    /** 查看按钮操作 */
    handleView(row) {
      if (row.travelVrUrl) {
        window.open(row.travelVrUrl, "_blank")
      } else {
        this.$modal.msgWarning("该VR暂无链接")
      }
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      this.$modal.confirm('是否确认删除VR名称为"' + row.name + '"的数据项？').then(function() {
        return delVr(row.id)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {
        this.getList()
      })
    },
    // 表单重置
    reset() {
      this.form = {
        id: undefined,
        name: undefined,
        identify: undefined,
        status: 1
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
