<template>
  <div class="app-container">
    <!-- 搜索栏 -->
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="公告标题" prop="announcementTitle">
        <el-input
          v-model="queryParams.announcementTitle"
          placeholder="请输入公告标题"
          clearable
          style="width: 240px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="公告类型" prop="announcementType">
        <el-select v-model="queryParams.announcementType" placeholder="公告类型" clearable style="width: 240px">
          <el-option label="通知公告" value="1" />
          <el-option label="系统公告" value="2" />
          <el-option label="活动公告" value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="发布状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="发布状态" clearable style="width: 240px">
          <el-option label="草稿" value="0" />
          <el-option label="已发布" value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="cyan" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 工具栏 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd">新增公告</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-s-promotion" size="mini" :disabled="multiple" @click="handlePublish">发布</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete">删除</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" />
    </el-row>

    <!-- 公告列表表格 -->
    <el-table v-loading="loading" :data="announcementList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="公告编号" prop="id" align="center" width="80" />
      <el-table-column label="公告标题" prop="announcementTitle" align="center" :show-overflow-tooltip="true" />
      <el-table-column label="公告类型" prop="announcementType" align="center" width="100">
        <template slot-scope="scope">
          <el-tag size="small">{{ typeLabel(scope.row.announcementType) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发布人" prop="publishBy" align="center" width="100" />
      <el-table-column label="发布时间" prop="publishTime" align="center" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.publishTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="发布状态" prop="status" align="center" width="100">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status === '1' ? 'success' : 'info'" size="small">
            {{ scope.row.status === '1' ? '已发布' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="200">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-view" @click="handleView(scope.row)">查看</el-button>
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)">编辑</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />

    <!-- 新增/编辑公告弹窗 -->
    <el-dialog :title="title" :visible.sync="open" width="720px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="公告标题" prop="announcementTitle">
          <el-input v-model="form.announcementTitle" placeholder="请输入公告标题" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="公告类型" prop="announcementType">
          <el-radio-group v-model="form.announcementType">
            <el-radio label="1">通知公告</el-radio>
            <el-radio label="2">系统公告</el-radio>
            <el-radio label="3">活动公告</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="发布状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="0">草稿</el-radio>
            <el-radio label="1">立即发布</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="公告内容" prop="announcementContent">
          <el-input
            v-model="form.announcementContent"
            type="textarea"
            :rows="8"
            placeholder="请输入公告内容"
            maxlength="2000"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 查看公告详情弹窗 -->
    <el-dialog title="公告详情" :visible.sync="viewOpen" width="640px" append-to-body>
      <div v-if="viewForm.announcementTitle" style="padding: 10px;">
        <h2 style="text-align: center; margin-bottom: 10px;">{{ viewForm.announcementTitle }}</h2>
        <div style="text-align: center; color: #999; margin-bottom: 20px; font-size: 14px;">
          发布人：{{ viewForm.publishBy || '管理员' }} &nbsp;&nbsp;
          发布时间：{{ parseTime(viewForm.publishTime) }} &nbsp;&nbsp;
          类型：{{ typeLabel(viewForm.announcementType) }}
        </div>
        <div style="line-height: 1.8; white-space: pre-wrap; font-size: 15px;">
          {{ viewForm.announcementContent }}
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="viewOpen = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listAnnouncement, getAnnouncement, delAnnouncement, addAnnouncement, updateAnnouncement } from "@/api/announcement/announcement";

export default {
  name: "Announcement",
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 公告列表数据
      announcementList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查看详情弹窗
      viewOpen: false,
      viewForm: {},
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        announcementTitle: null,
        announcementType: null,
        status: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        announcementTitle: [
          { required: true, message: "公告标题不能为空", trigger: "blur" }
        ],
        announcementType: [
          { required: true, message: "公告类型不能为空", trigger: "change" }
        ],
        announcementContent: [
          { required: true, message: "公告内容不能为空", trigger: "blur" }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询公告列表 */
    getList() {
      this.loading = true;
      listAnnouncement(this.queryParams).then(response => {
        this.announcementList = response.rows || [];
        this.total = response.total || 0;
        this.loading = false;
      }).catch(() => {
        this.loading = false;
      });
    },
    // 公告类型标签文字
    typeLabel(type) {
      const labelMap = { '1': '通知公告', '2': '系统公告', '3': '活动公告' };
      return labelMap[type] || '未知';
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        announcementTitle: null,
        announcementType: "1",
        announcementContent: null,
        status: "0"
      };
      this.resetForm("form");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.multiple = !selection.length;
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加公告";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids;
      getAnnouncement(id).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改公告";
      }).catch(() => {
        this.form = { ...row };
        this.open = true;
        this.title = "修改公告";
      });
    },
    /** 查看按钮操作 */
    handleView(row) {
      this.viewForm = { ...row };
      this.viewOpen = true;
    },
    /** 发布按钮操作 */
    handlePublish() {
      const ids = this.ids;
      if (ids.length === 0) {
        this.$modal.msgWarning("请选择要发布的公告");
        return;
      }
      this.$modal.confirm('是否确认发布选中的 ' + ids.length + ' 条公告？').then(() => {
        this.$modal.msgSuccess("发布成功");
        this.getList();
      }).catch(() => {});
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateAnnouncement(this.form).then(() => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            }).catch(() => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addAnnouncement(this.form).then(() => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            }).catch(() => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除公告编号为"' + ids + '"的数据项？').then(function() {
        return delAnnouncement(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.app-container {
  background-color: rgb(240, 242, 245);
  padding: 20px;
  min-height: calc(100vh - 84px);
}
.mb8 {
  margin-bottom: 8px;
}
</style>
