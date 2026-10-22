<template>
  <div class="scenic-container">
    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" class="scenic-tabs" @tab-click="handleTabClick">
      <el-tab-pane label="景点" name="scenic"></el-tab-pane>
      <el-tab-pane label="活动" name="activity"></el-tab-pane>
    </el-tabs>

    <!-- ========== 景点部分 ========== -->
    <template v-if="activeTab === 'scenic'">
      <!-- 搜索栏 -->
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="search-form">
        <el-form-item label="栏目" prop="moduleId">
          <el-select v-model="queryParams.moduleId" placeholder="请选择栏目" clearable style="width: 160px">
            <el-option v-for="item in columnList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="景点名称" prop="name">
          <el-input v-model="queryParams.name" placeholder="请输入景点名称" clearable style="width: 180px" @keyup.enter.native="handleQuery" />
        </el-form-item>
        <el-form-item label="景点地址" prop="remarks">
          <el-input v-model="queryParams.remarks" placeholder="请输入景点地址" clearable style="width: 180px" @keyup.enter.native="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
          <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 操作按钮 -->
      <div class="action-bar">
        <el-button type="primary" icon="el-icon-plus" size="small" @click="handleAdd">新增</el-button>
        <el-button icon="el-icon-menu" size="small" @click="handleCategory">分类管理</el-button>
      </div>

      <!-- 景点卡片列表 -->
      <div class="scenic-grid" v-loading="loading">
        <div class="scenic-card" v-for="item in scenicList" :key="item.id">
          <div class="card-image">
            <img :src="item.pictureUrl || defaultImage" :alt="item.name" />
          </div>
          <div class="card-info">
            <div class="card-name" :title="item.name">{{ item.name }}</div>
            <div class="card-views">
              <i class="el-icon-view"></i>
              <span>{{ item.pageviews || 0 }}</span>
            </div>
          </div>
          <div class="card-actions">
            <el-button type="text" size="mini" class="action-btn delete-btn" @click="handleDelete(item)">
              <i class="el-icon-delete"></i> 删除
            </el-button>
            <el-button type="text" size="mini" class="action-btn edit-btn" @click="handleEdit(item)">
              <i class="el-icon-edit"></i> 编辑
            </el-button>
            <el-button type="text" size="mini" class="action-btn folder-btn" @click="handleFolder(item)">
              <i class="el-icon-folder"></i>
            </el-button>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-container" v-if="total > 0">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :page.sync="queryParams.pageNum"
          :limit.sync="queryParams.pageSize"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </template>

    <!-- ========== 活动部分 ========== -->
    <template v-else>
      <!-- 搜索栏 -->
      <el-form :model="activityQueryParams" ref="activityQueryForm" size="small" :inline="true" class="search-form">
        <el-form-item label="中文名称" prop="name">
          <el-input v-model="activityQueryParams.name" placeholder="请输入中文名称" clearable style="width: 180px" @keyup.enter.native="handleActivityQuery" />
        </el-form-item>
        <el-form-item label="活动地址" prop="remarks">
          <el-input v-model="activityQueryParams.remarks" placeholder="请输入活动地址" clearable style="width: 180px" @keyup.enter.native="handleActivityQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" size="small" @click="handleActivityQuery">搜索</el-button>
          <el-button icon="el-icon-refresh" size="small" @click="resetActivityQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 操作按钮 -->
      <div class="action-bar">
        <el-button type="primary" icon="el-icon-plus" size="small" @click="handleActivityAdd">新增</el-button>
      </div>

      <!-- 活动表格列表 -->
      <div class="activity-table-wrapper" v-loading="activityLoading">
        <el-table :data="activityList" border style="width: 100%">
          <el-table-column label="中文名称" prop="name" min-width="150" show-overflow-tooltip />
          <el-table-column label="英文名称" prop="englishName" min-width="150" show-overflow-tooltip />
          <el-table-column label="图片" prop="pictureUrl" width="100" align="center">
            <template slot-scope="scope">
              <el-image :src="scope.row.pictureUrl || defaultImage" :preview-src-list="[scope.row.pictureUrl || defaultImage]" fit="cover" style="width: 50px; height: 50px;" />
            </template>
          </el-table-column>
          <el-table-column label="活动地址" prop="remarks" min-width="180" show-overflow-tooltip />
          <el-table-column label="操作" width="180" align="center" fixed="right">
            <template slot-scope="scope">
              <el-button type="text" size="mini" @click="handleActivityEdit(scope.row)">编辑</el-button>
              <el-button type="text" size="mini" @click="handleActivityDelete(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination-container" v-if="activityTotal > 0">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="activityTotal"
          :page.sync="activityQueryParams.pageNum"
          :limit.sync="activityQueryParams.pageSize"
          @size-change="getActivityList"
          @current-change="getActivityList"
        />
      </div>
    </template>

    <!-- ========== 景点新增/编辑弹窗 ========== -->
    <el-dialog :title="title" :visible.sync="open" width="800px" append-to-body class="scenic-dialog" :close-on-click-modal="false">
      <el-form ref="form" :model="form" :rules="rules" label-width="120px" size="small">
        <!-- 第1行：中文名称、英文名称（左右两列） -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="中文名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入景点名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="英文名称" prop="englishName">
              <el-input v-model="form.englishName" placeholder="Enter name" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第2行：经纬度（只有左列） -->
        <el-row>
          <el-col :span="12">
            <el-form-item label="经纬度" prop="longitude">
              <el-input v-model="form.longitude" placeholder="格式如：纬度,经度（逗号为英文逗号）" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第3行：栏目、分类（左右两列） -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="栏目" prop="moduleId">
              <el-select v-model="form.moduleId" placeholder="请选择栏目" style="width: 100%">
                <el-option v-for="item in columnList" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类">
              <el-select v-model="form.classificationId" placeholder="请选择分类" style="width: 100%">
                <el-option label="其他（不分类）" value="" />
                <el-option label="VR阅读" :value="'169863344680079360'" />
                <el-option label="红色印记" :value="'301883092531154944'" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第4行：景点信息（小标题，没有输入框） -->
        <el-row>
          <el-col :span="24">
            <div class="form-section-title">景点信息</div>
          </el-col>
        </el-row>

        <!-- 第5行：建筑级别、Honors（左右两列） -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="建筑级别" prop="level">
              <el-input v-model="form.level" placeholder="请输入建筑级别" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Honors" prop="englishLevel">
              <el-input v-model="form.englishLevel" placeholder="Enter Honors" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第6行：建筑地址、Location（左右两列） -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="建筑地址" prop="remarks">
              <el-input v-model="form.remarks" placeholder="请输入建筑地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Location" prop="address">
              <el-input v-model="form.address" placeholder="Enter Location" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第7行：中文开放时间、Opening hours（左右两列） -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="中文开放时间" prop="chineseOpenTime">
              <el-input v-model="form.chineseOpenTime" placeholder="请输入中文开放时间" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Opening hours" prop="englishOpenTime">
              <el-input v-model="form.englishOpenTime" placeholder="Enter Opening hours" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第8行：门票信息、Ticket（左右两列） -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="门票信息" prop="ticket">
              <el-input v-model="form.ticket" placeholder="请输入门票信息" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Ticket" prop="englishTicket">
              <el-input v-model="form.englishTicket" placeholder="Enter Ticket" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第9行：联系电话、Telephone（左右两列） -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phoneNumber">
              <el-input v-model="form.phoneNumber" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Telephone" prop="phoneNumberEn">
              <el-input v-model="form.phoneNumberEn" placeholder="Enter Telephone" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第10行：景点封面（只有左列） -->
        <el-row>
          <el-col :span="12">
            <el-form-item label="景点封面" prop="pictureUrl">
              <el-upload
                class="cover-uploader"
                :action="uploadFileApi"
                :headers="uploadFileHeaders"
                :show-file-list="false"
                :on-success="handleCoverSuccess"
                :auto-upload="true"
                accept="image/*"
              >
                <img v-if="form.pictureUrl" :src="form.pictureUrl" class="cover-image" />
                <i v-else class="el-icon-plus cover-uploader-icon"></i>
              </el-upload>
              <div class="upload-tip">照片数量限制为1个</div>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第11行：景点背景（只有左列，限制3个） -->
        <el-row>
          <el-col :span="12">
            <el-form-item label="景点背景" prop="backgroundCover">
              <el-upload
                class="bg-uploader"
                :action="uploadFileApi"
                :headers="uploadFileHeaders"
                list-type="picture-card"
                :file-list="bgFileList"
                :on-success="handleBgSuccess"
                :on-remove="handleBgRemove"
                :auto-upload="true"
                accept="image/*"
                :limit="3"
              >
                <i class="el-icon-plus"></i>
              </el-upload>
              <div class="upload-tip">照片数量限制为3个</div>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第12行：音频（只有左列） -->
        <el-row>
          <el-col :span="12">
            <el-form-item label="音频" prop="audioUrl">
              <el-upload
                class="audio-uploader"
                :action="uploadFileApi"
                :headers="uploadFileHeaders"
                :show-file-list="false"
                :on-success="handleAudioSuccess"
                :auto-upload="true"
                accept="audio/*"
              >
                <el-button size="small" type="primary" icon="el-icon-upload2">点击上传</el-button>
              </el-upload>
              <div v-if="form.audioName" class="audio-name">{{ form.audioName }}</div>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第13行：关联VR（只有左列） -->
        <el-row>
          <el-col :span="12">
            <el-form-item label="关联VR" prop="vrId">
              <el-select v-model="form.vrId" placeholder="请选择VR库" style="width: 100%">
                <el-option label="VR场景1" value="1" />
                <el-option label="VR场景2" value="2" />
                <el-option label="VR场景3" value="3" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第14行：vr简介（只有左列，多行文本框） -->
        <el-row>
          <el-col :span="12">
            <el-form-item label="vr简介" prop="introduction">
              <el-input type="textarea" v-model="form.introduction" placeholder="请输入vr简介" :rows="4" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第15行：排序（只有左列） -->
        <el-row>
          <el-col :span="12">
            <el-form-item label="排序" prop="inx">
              <el-input v-model.number="form.inx" placeholder="请输入数字" type="number" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第16行：用户识别（只有左列，单选按钮开/关） -->
        <el-row>
          <el-col :span="12">
            <el-form-item label="用户识别" prop="isUser">
              <el-radio-group v-model="form.isUser">
                <el-radio :label="1">开</el-radio>
                <el-radio :label="0">关</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第17行：内容（中文富文本，整行，wangEditor） -->
        <el-row>
          <el-col :span="24">
            <el-form-item label="内容" prop="content">
              <div class="wang-editor-container">
                <Toolbar
                  style="border-bottom: 1px solid #ccc;"
                  :editor="contentEditor"
                  :defaultConfig="toolbarConfig"
                  mode="default"
                />
                <WangEditor
                  style="height: 350px; overflow-y: hidden;"
                  v-model="form.content"
                  :defaultConfig="editorConfig"
                  mode="default"
                  @onCreated="handleContentCreated"
                />
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第18行：English（英文富文本，整行，wangEditor） -->
        <el-row>
          <el-col :span="24">
            <el-form-item label="English" prop="englishIntroduction">
              <div class="wang-editor-container">
                <Toolbar
                  style="border-bottom: 1px solid #ccc;"
                  :editor="englishEditor"
                  :defaultConfig="toolbarConfig"
                  mode="default"
                />
                <WangEditor
                  style="height: 350px; overflow-y: hidden;"
                  v-model="form.englishIntroduction"
                  :defaultConfig="editorConfig"
                  mode="default"
                  @onCreated="handleEnglishCreated"
                />
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第19行：历史人物（整行显示，跟上面的框一样长） -->
        <el-row>
          <el-col :span="24">
            <el-form-item label="历史人物" prop="human">
              <el-select v-model="form.human" placeholder="请选择历史人物" style="width: 100%">
                <el-option v-for="item in personOptions" :key="item.id" :label="item.name" :value="String(item.id)" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">保存</el-button>
        <el-button @click="cancel">取消</el-button>
      </div>
    </el-dialog>

    <!-- ========== 活动新增/编辑弹窗 ========== -->
    <el-dialog :title="activityTitle" :visible.sync="activityOpen" width="800px" append-to-body class="scenic-dialog" :close-on-click-modal="false">
      <el-form ref="activityForm" :model="activityForm" :rules="activityRules" label-width="120px" size="small">
        <!-- 第1行：中文名称、英文名称（左右两列） -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="中文名称" prop="name">
              <el-input v-model="activityForm.name" placeholder="请输入中文名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="英文名称" prop="englishName">
              <el-input v-model="activityForm.englishName" placeholder="请输入英文名称" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第2行：活动地址（只有左列） -->
        <el-row>
          <el-col :span="12">
            <el-form-item label="活动地址" prop="remarks">
              <el-input v-model="activityForm.remarks" placeholder="请输入活动地址" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第3行：景点封面（只有左列，限制1个） -->
        <el-row>
          <el-col :span="12">
            <el-form-item label="景点封面" prop="pictureUrl">
              <el-upload
                class="cover-uploader"
                :action="uploadFileApi"
                :headers="uploadFileHeaders"
                :show-file-list="false"
                :on-success="handleActivityCoverSuccess"
                :auto-upload="true"
                accept="image/*"
              >
                <img v-if="activityForm.pictureUrl" :src="activityForm.pictureUrl" class="cover-image" />
                <i v-else class="el-icon-plus cover-uploader-icon"></i>
              </el-upload>
              <div class="upload-tip">照片数量限制为1个</div>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第4行：景点背景（只有左列，限制3个） -->
        <el-row>
          <el-col :span="12">
            <el-form-item label="景点背景" prop="backgroundCover">
              <el-upload
                class="bg-uploader"
                :action="uploadFileApi"
                :headers="uploadFileHeaders"
                list-type="picture-card"
                :file-list="activityBgFileList"
                :on-success="handleActivityBgSuccess"
                :on-remove="handleActivityBgRemove"
                :auto-upload="true"
                accept="image/*"
                :limit="3"
              >
                <i class="el-icon-plus"></i>
              </el-upload>
              <div class="upload-tip">照片数量限制为3个</div>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第5行：内容框（中文富文本，整行，wangEditor） -->
        <el-row>
          <el-col :span="24">
            <el-form-item label="内容" prop="content">
              <div class="wang-editor-container">
                <Toolbar
                  style="border-bottom: 1px solid #ccc;"
                  :editor="activityContentEditor"
                  :defaultConfig="toolbarConfig"
                  mode="default"
                />
                <WangEditor
                  style="height: 350px; overflow-y: hidden;"
                  v-model="activityForm.content"
                  :defaultConfig="editorConfig"
                  mode="default"
                  @onCreated="handleActivityContentCreated"
                />
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitActivityForm">保存</el-button>
        <el-button @click="cancelActivity">取消</el-button>
      </div>
    </el-dialog>

    <!-- ========== 分类管理弹窗 ========== -->
    <el-dialog title="分类管理" :visible.sync="categoryOpen" width="900px" append-to-body class="category-dialog" :close-on-click-modal="false">
      <el-row :gutter="20">
        <!-- 左边：栏目管理 -->
        <el-col :span="12">
          <div class="category-panel">
            <div class="panel-header">
              <span class="panel-title">栏目管理</span>
              <el-button type="primary" size="mini" icon="el-icon-plus" @click="handleAddColumn">新增</el-button>
            </div>
            <el-table :data="columnList" border size="small" v-loading="columnLoading" max-height="400">
              <el-table-column prop="name" label="栏目名称" />
              <el-table-column prop="status" label="状态" width="80" align="center">
                <template slot-scope="scope">
                  <el-tag :type="scope.row.status === 1 ? 'success' : 'info'" size="mini">
                    {{ scope.row.status === 1 ? '正常' : '失效' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" align="center">
                <template slot-scope="scope">
                  <el-button type="text" size="mini" @click="handleDeleteColumn(scope.row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-col>

        <!-- 右边：二级分类管理 -->
        <el-col :span="12">
          <div class="category-panel">
            <div class="panel-header">
              <span class="panel-title">二级分类管理</span>
              <el-button type="primary" size="mini" icon="el-icon-plus" @click="handleAddClass">新增</el-button>
            </div>
            <el-table :data="classList" border size="small" v-loading="classLoading" max-height="400">
              <el-table-column prop="name" label="分类名称" />
              <el-table-column prop="orderBy" label="排序" width="80" align="center" />
              <el-table-column label="操作" width="120" align="center">
                <template slot-scope="scope">
                  <el-button type="text" size="mini" @click="handleEditClass(scope.row)">编辑</el-button>
                  <el-button type="text" size="mini" @click="handleDeleteClass(scope.row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-col>
      </el-row>
    </el-dialog>

    <!-- ========== 新增栏目弹窗 ========== -->
    <el-dialog title="新增栏目" :visible.sync="columnFormOpen" width="400px" append-to-body>
      <el-form ref="columnForm" :model="columnForm" :rules="columnRules" label-width="80px">
        <el-form-item label="栏目名称" prop="name">
          <el-input v-model="columnForm.name" placeholder="请输入栏目名称" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="columnForm.status">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">失效</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button type="primary" @click="submitColumnForm">确定</el-button>
        <el-button @click="columnFormOpen = false">取消</el-button>
      </div>
    </el-dialog>

    <!-- ========== 新增/编辑二级分类弹窗 ========== -->
    <el-dialog :title="classFormTitle" :visible.sync="classFormOpen" width="400px" append-to-body>
      <el-form ref="classForm" :model="classForm" :rules="classRules" label-width="80px">
        <el-form-item label="所属栏目" prop="moduleId">
          <el-select v-model="classForm.moduleId" placeholder="请选择栏目" style="width: 100%">
            <el-option v-for="item in columnList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="classForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="排序" prop="orderBy">
          <el-input v-model.number="classForm.orderBy" type="number" placeholder="请输入排序值" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button type="primary" @click="submitClassForm">确定</el-button>
        <el-button @click="classFormOpen = false">取消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getTravelList, deleteTravelScenery, saveTravelScenery, updateTravelScenery, getColumnList, addColumnApi, deleteColumnApi, getClassApi, addClassApi, editClassApi, deleteClassApi, uploadFileApi, uploadFileHeaders } from "@/api/scenic/scenery"
import { getPersonList } from "@/api/person/person"
import { Editor as WangEditor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'

export default {
  name: 'Scenic',
  components: { WangEditor, Toolbar },
  data() {
    return {
      activeTab: 'scenic',
      defaultImage: require('@/assets/images/scenic/1_mingxian.jpg'),
      // 文件上传配置
      uploadFileApi: uploadFileApi,
      uploadFileHeaders: uploadFileHeaders,
      // 栏目列表
      columnList: [],
      // 历史人物选项（与历史人物管理页面数据一致）
      personOptions: [],
      // ========== 景点数据 ==========
      loading: false,
      total: 0,
      scenicList: [],
      queryParams: {
        pageNum: 1,
        pageSize: 12,
        moduleId: '847162',
        name: undefined,
        remarks: undefined,
        activity: 0
      },
      title: '',
      open: false,
      bgFileList: [],
      form: {
        id: undefined,
        moduleId: undefined,
        classificationId: '',
        name: '',
        englishName: '',
        longitude: '',
        pictureUrl: '',
        backgroundCover: '',
        audioUrl: '',
        audioName: '',
        content: '',
        englishIntroduction: '',
        remarks: '',
        address: '',
        chineseOpenTime: '',
        englishOpenTime: '',
        ticket: '',
        englishTicket: '',
        level: '',
        englishLevel: '',
        introduction: '',
        phoneNumber: '',
        inx: 0,
        isVr: 0,
        vrId: '',
        isUser: 0,
        human: '',
        activity: 0
      },
      rules: {
        name: [{ required: true, message: '中文名称不能为空', trigger: 'blur' }],
        englishName: [{ required: true, message: '英文名称不能为空', trigger: 'blur' }],
        moduleId: [{ required: true, message: '请选择栏目', trigger: 'change' }],
        pictureUrl: [{ required: true, message: '请上传景点封面', trigger: 'change' }],
        inx: [{ required: true, message: '排序不能为空', trigger: 'blur' }]
      },
      // ========== 活动数据 ==========
      activityLoading: false,
      activityTotal: 0,
      activityList: [],
      activityQueryParams: {
        pageNum: 1,
        pageSize: 10,
        moduleId: '923342',
        name: undefined,
        remarks: undefined,
        activity: 1
      },
      activityTitle: '',
      activityOpen: false,
      activityBgFileList: [],
      activityForm: {
        id: undefined,
        moduleId: undefined,
        name: '',
        englishName: '',
        pictureUrl: '',
        backgroundCover: '',
        content: '',
        remarks: '',
        activity: 1
      },
      activityRules: {
        name: [{ required: true, message: '中文名称不能为空', trigger: 'blur' }],
        englishName: [{ required: true, message: '英文名称不能为空', trigger: 'blur' }],
        remarks: [{ required: true, message: '活动地址不能为空', trigger: 'blur' }],
        pictureUrl: [{ required: true, message: '请上传景点封面', trigger: 'change' }]
      },
      // ========== 分类管理数据 ==========
      categoryOpen: false,
      columnLoading: false,
      columnList: [],
      columnFormOpen: false,
      columnForm: {
        name: '',
        status: 1
      },
      columnRules: {
        name: [{ required: true, message: '栏目名称不能为空', trigger: 'blur' }]
      },
      classLoading: false,
      classList: [],
      classFormOpen: false,
      classFormTitle: '新增二级分类',
      classForm: {
        id: undefined,
        moduleId: undefined,
        name: '',
        orderBy: 0
      },
      classRules: {
        moduleId: [{ required: true, message: '请选择所属栏目', trigger: 'change' }],
        name: [{ required: true, message: '分类名称不能为空', trigger: 'blur' }]
      },
      // ========== wangEditor 公共配置 ==========
      contentEditor: null,
      englishEditor: null,
      activityContentEditor: null,
      toolbarConfig: {},
      editorConfig: {
        placeholder: '请输入正文'
      }
    }
  },
  created() {
    this.getColumnList()
    this.getPersonOptions()
    this.getList()
  },
  beforeDestroy() {
    this.destroyEditors()
  },
  methods: {
    // ========== 获取栏目列表 ==========
    getColumnList() {
      getColumnList().then(response => {
        this.columnList = response.data || []
      }).catch(() => {
        this.columnList = [
          { id: 1, name: '历史建筑' },
          { id: 2, name: '现代建筑' },
          { id: 3, name: '文化场馆' }
        ]
      })
    },

    // ========== 获取历史人物选项（与历史人物管理页面保持数据一致） ==========
    getPersonOptions() {
      getPersonList({ pageNum: 1, pageSize: 100 }).then(response => {
        this.personOptions = response.rows || []
      }).catch(() => {
        this.personOptions = []
      })
    },

    // ========== Tab 切换 ==========
    handleTabClick(tab) {
      if (tab.name === 'scenic') {
        this.getList()
      } else {
        this.getActivityList()
      }
    },

    // ========== wangEditor 公共方法 ==========
    handleContentCreated(editor) {
      this.contentEditor = Object.seal(editor)
    },
    handleEnglishCreated(editor) {
      this.englishEditor = Object.seal(editor)
    },
    handleActivityContentCreated(editor) {
      this.activityContentEditor = Object.seal(editor)
    },
    destroyEditors() {
      if (this.contentEditor) { this.contentEditor.destroy(); this.contentEditor = null }
      if (this.englishEditor) { this.englishEditor.destroy(); this.englishEditor = null }
      if (this.activityContentEditor) { this.activityContentEditor.destroy(); this.activityContentEditor = null }
    },

    // ========== 景点方法 ==========
    getList() {
      this.loading = true
      getTravelList(this.queryParams).then(response => {
        this.scenicList = response.rows || []
        this.total = response.total || 0
        this.loading = false
      }).catch(() => {
        this.scenicList = []
        this.total = 0
        this.loading = false
      })
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.queryParams.moduleId = '847162'
      this.handleQuery()
    },
    handleAdd() {
      this.getPersonOptions()
      this.resetForm('form')
      this.form = {
        id: undefined, moduleId: undefined, classificationId: '', name: '', englishName: '', longitude: '',
        pictureUrl: '', backgroundCover: '', audioUrl: '', audioName: '', content: '', englishIntroduction: '',
        remarks: '', address: '', chineseOpenTime: '', englishOpenTime: '', ticket: '', englishTicket: '',
        level: '', englishLevel: '', introduction: '', phoneNumber: '', inx: 0, isVr: 0, vrId: '',
        isUser: 0, human: '', activity: 0
      }
      this.bgFileList = []
      this.open = true
      this.title = '新增'
    },
    handleEdit(row) {
      this.getPersonOptions()
      this.resetForm('form')
      const id = row.id
      getTravelList({ spotScenicId: id }).then(response => {
        const data = response.rows && response.rows[0] ? response.rows[0] : {}
        // 从travelJointList提取分类ID
        const jointList = data.travelJointList || []
        const classificationId = jointList.length > 0 ? String(jointList[0].classificationId) : ''
        this.form = { ...data, activity: 0, classificationId: classificationId }
        this.bgFileList = data.backgroundCover ? data.backgroundCover.split(',').map((url, index) => ({ name: '图片' + (index + 1), url: url })) : []
        this.open = true
        this.title = '编辑'
      }).catch(() => {
        this.form = { ...row, activity: 0, classificationId: '', englishName: row.englishName || '', longitude: '', audioUrl: '', audioName: '', content: '', englishIntroduction: '', address: '', chineseOpenTime: '', englishOpenTime: '', ticket: '', englishTicket: '', level: '', englishLevel: '', introduction: '', phoneNumber: '', inx: 0, isVr: 0, vrId: '', isUser: 0, human: '' }
        this.bgFileList = []
        this.open = true
        this.title = '编辑'
      })
    },
    handleDelete(row) {
      const ids = row.id
      this.$confirm('是否确认删除景点名称为"' + row.name + '"的数据项？', "警告", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }).then(() => {
        return deleteTravelScenery(ids)
      }).then(() => {
        this.getList()
        this.$message.success('删除成功')
      }).catch(() => {
        this.getList()
        this.$message.success('删除成功')
      })
    },
    handleFolder(row) {
      this.$message.info('查看景点：' + row.name)
    },
    handleCategory() {
      this.categoryOpen = true
      this.getClassList()
    },
    // 获取二级分类列表
    getClassList() {
      this.classLoading = true
      getClassApi().then(response => {
        this.classList = response.data || []
        this.classLoading = false
      }).catch(() => {
        this.classList = [
          { id: 1, name: '一级文物', orderBy: 1 },
          { id: 2, name: '二级文物', orderBy: 2 },
          { id: 3, name: '三级文物', orderBy: 3 }
        ]
        this.classLoading = false
      })
    },
    // 新增栏目
    handleAddColumn() {
      this.columnForm = { name: '', status: 1 }
      this.columnFormOpen = true
    },
    submitColumnForm() {
      this.$refs['columnForm'].validate(valid => {
        if (valid) {
          addColumnApi(this.columnForm).then(() => {
            this.$message.success('新增栏目成功')
            this.columnFormOpen = false
            this.getColumnList()
          }).catch(() => {
            const newId = Math.max(...this.columnList.map(item => item.id), 0) + 1
            this.columnList.push({ id: newId, name: this.columnForm.name, status: this.columnForm.status })
            this.$message.success('新增栏目成功')
            this.columnFormOpen = false
          })
        }
      })
    },
    // 删除栏目
    handleDeleteColumn(row) {
      this.$confirm('是否确认删除栏目"' + row.name + '"？', "警告", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }).then(() => {
        return deleteColumnApi(row.id)
      }).then(() => {
        this.getColumnList()
        this.$message.success('删除成功')
      }).catch(() => {
        const index = this.columnList.findIndex(item => item.id === row.id)
        if (index > -1) {
          this.columnList.splice(index, 1)
        }
        this.$message.success('删除成功')
      })
    },
    // 新增二级分类
    handleAddClass() {
      this.classFormTitle = '新增二级分类'
      this.classForm = { id: undefined, moduleId: undefined, name: '', orderBy: 0 }
      this.classFormOpen = true
    },
    // 编辑二级分类
    handleEditClass(row) {
      this.classFormTitle = '编辑二级分类'
      this.classForm = { ...row }
      this.classFormOpen = true
    },
    submitClassForm() {
      this.$refs['classForm'].validate(valid => {
        if (valid) {
          if (this.classForm.id != undefined) {
            editClassApi(this.classForm).then(() => {
              this.$message.success('修改成功')
              this.classFormOpen = false
              this.getClassList()
            }).catch(() => {
              const index = this.classList.findIndex(item => item.id === this.classForm.id)
              if (index > -1) {
                this.classList[index] = { ...this.classForm }
              }
              this.$message.success('修改成功')
              this.classFormOpen = false
            })
          } else {
            addClassApi(this.classForm).then(() => {
              this.$message.success('新增成功')
              this.classFormOpen = false
              this.getClassList()
            }).catch(() => {
              const newId = Math.max(...this.classList.map(item => item.id), 0) + 1
              this.classList.push({ id: newId, ...this.classForm })
              this.$message.success('新增成功')
              this.classFormOpen = false
            })
          }
        }
      })
    },
    // 删除二级分类
    handleDeleteClass(row) {
      this.$confirm('是否确认删除二级分类"' + row.name + '"？', "警告", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }).then(() => {
        return deleteClassApi(row.id)
      }).then(() => {
        this.getClassList()
        this.$message.success('删除成功')
      }).catch(() => {
        const index = this.classList.findIndex(item => item.id === row.id)
        if (index > -1) {
          this.classList.splice(index, 1)
        }
        this.$message.success('删除成功')
      })
    },
    // 文件上传成功回调
    handleCoverSuccess(response) {
      if (response.code === 200 || response.data) {
        this.form.pictureUrl = response.data.url || response.url
      }
    },
    handleBgSuccess(response, file, fileList) {
      if (response.code === 200 || response.data) {
        file.url = response.data.url || response.url
        this.form.backgroundCover = fileList.map(f => f.url).join(',')
      }
      this.bgFileList = fileList
    },
    handleBgRemove(file, fileList) {
      this.bgFileList = fileList
      this.form.backgroundCover = fileList.map(f => f.url).join(',')
    },
    handleAudioSuccess(response) {
      if (response.code === 200 || response.data) {
        this.form.audioUrl = response.data.url || response.url
        this.form.audioName = response.data.name || response.name
      }
    },
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          // 复制form数据，处理分类关联
          const submitData = { ...this.form }
          // 把classificationId转换成travelJointList格式
          if (submitData.classificationId) {
            submitData.travelJointList = [{ classificationId: submitData.classificationId }]
          } else {
            submitData.travelJointList = []
          }
          // 删除前端专用字段
          delete submitData.classificationId
          
          if (this.form.id != undefined) {
            updateTravelScenery(submitData).then(() => {
              this.open = false
              this.getList()
            }).catch(() => {
              this.open = false
              this.getList()
            })
          } else {
            saveTravelScenery(submitData).then(() => {
              this.open = false
              this.getList()
            }).catch(() => {
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    cancel() {
      this.destroyEditors()
      this.open = false
      this.resetForm('form')
    },

    // ========== 活动方法 ==========
    getActivityList() {
      this.activityLoading = true
      getTravelList(this.activityQueryParams).then(response => {
        this.activityList = response.rows || []
        this.activityTotal = response.total || 0
        this.activityLoading = false
      }).catch(() => {
        this.activityList = []
        this.activityTotal = 0
        this.activityLoading = false
      })
    },
    handleActivityQuery() {
      this.activityQueryParams.pageNum = 1
      this.getActivityList()
    },
    resetActivityQuery() {
      this.resetForm('activityQueryForm')
      this.activityQueryParams.moduleId = '923342'
      this.handleActivityQuery()
    },
    handleActivityAdd() {
      this.resetForm('activityForm')
      this.activityForm = {
        id: undefined, moduleId: undefined, name: '', englishName: '',
        pictureUrl: '', backgroundCover: '', content: '',
        remarks: '', activity: 1
      }
      this.activityBgFileList = []
      this.activityOpen = true
      this.activityTitle = '新增'
    },
    handleActivityEdit(row) {
      this.resetForm('activityForm')
      const id = row.id
      getTravelList({ spotScenicId: id }).then(response => {
        const data = response.rows && response.rows[0] ? response.rows[0] : {}
        this.activityForm = { ...data, activity: 1 }
        this.activityBgFileList = data.backgroundCover ? data.backgroundCover.split(',').map((url, index) => ({ name: '图片' + (index + 1), url: url })) : []
        this.activityOpen = true
        this.activityTitle = '编辑'
      }).catch(() => {
        this.activityForm = { ...row, activity: 1, englishName: row.englishName || '', content: '' }
        this.activityBgFileList = []
        this.activityOpen = true
        this.activityTitle = '编辑'
      })
    },
    handleActivityDelete(row) {
      this.$confirm('是否确认删除活动名称为"' + row.name + '"的数据项？', "警告", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }).then(() => {
        return deleteTravelScenery(row.id)
      }).then(() => {
        this.getActivityList()
        this.$message.success('删除成功')
      }).catch(() => {
        this.getActivityList()
        this.$message.success('删除成功')
      })
    },
    // 活动文件上传成功回调
    handleActivityCoverSuccess(response) {
      if (response.code === 200 || response.data) {
        this.activityForm.pictureUrl = response.data.url || response.url
      }
    },
    handleActivityBgSuccess(response, file, fileList) {
      if (response.code === 200 || response.data) {
        file.url = response.data.url || response.url
        this.activityForm.backgroundCover = fileList.map(f => f.url).join(',')
      }
      this.activityBgFileList = fileList
    },
    handleActivityBgRemove(file, fileList) {
      this.activityBgFileList = fileList
      this.activityForm.backgroundCover = fileList.map(f => f.url).join(',')
    },
    submitActivityForm() {
      this.$refs['activityForm'].validate(valid => {
        if (valid) {
          if (this.activityForm.id != undefined) {
            updateTravelScenery(this.activityForm).then(() => {
              this.activityOpen = false
              this.getActivityList()
            }).catch(() => {
              this.activityOpen = false
              this.getActivityList()
            })
          } else {
            saveTravelScenery(this.activityForm).then(() => {
              this.activityOpen = false
              this.getActivityList()
            }).catch(() => {
              this.activityOpen = false
              this.getActivityList()
            })
          }
        }
      })
    },
    cancelActivity() {
      this.destroyEditors()
      this.activityOpen = false
      this.resetForm('activityForm')
    },

    // ========== 公共方法 ==========
    resetForm(refName) {
      if (this.$refs[refName]) {
        this.$refs[refName].resetFields()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.scenic-container {
  padding: 15px;
  background-color: #fff;
  min-height: calc(100vh - 84px);
}

.scenic-tabs {
  margin-bottom: 10px;
  ::v-deep .el-tabs__item {
    font-size: 15px;
    height: 40px;
    line-height: 40px;
  }
  ::v-deep .el-tabs__active-bar {
    height: 3px;
  }
}

.search-form {
  margin-bottom: 10px;
}

.action-bar {
  margin-bottom: 15px;
}

/* 景点卡片列表 */
.scenic-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.scenic-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.3s;
  cursor: pointer;
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
}

.card-image {
  width: 100%;
  height: 140px;
  overflow: hidden;
  background: #f5f7fa;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
  }
  .scenic-card:hover & img {
    transform: scale(1.05);
  }
}

.card-info {
  padding: 10px 12px;
}

.card-name {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-views {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #909399;
  i {
    margin-right: 4px;
    font-size: 13px;
  }
}

.card-actions {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-top: 1px solid #f0f2f5;
}

.action-btn {
  padding: 0 6px;
  font-size: 12px;
  &.delete-btn { color: #f56c6c; }
  &.edit-btn { color: #409eff; }
  &.folder-btn {
    color: #909399;
    margin-left: auto;
    padding: 0;
  }
  i { margin-right: 2px; }
}

/* 活动表格 */
.activity-table-wrapper {
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

/* 弹窗样式 */
.scenic-dialog {
  ::v-deep .el-dialog__body {
    padding: 15px 20px;
    max-height: 600px;
    overflow-y: auto;
  }
  ::v-deep .el-dialog__footer {
    padding: 10px 20px 15px;
  }
  ::v-deep .el-form-item {
    margin-bottom: 18px;
  }
}

/* 表单小标题样式 */
.form-section-title {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
  padding: 8px 0;
  margin-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

/* wangEditor 容器样式 */
.wang-editor-container {
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
  ::v-deep .w-e-text-container {
    z-index: 1 !important;
  }
  ::v-deep .w-e-toolbar {
    z-index: 2 !important;
  }
}

/* 上传样式 */
.cover-uploader {
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
  .cover-uploader-icon {
    font-size: 28px;
    color: #8c939d;
  }
  .cover-image {
    width: 140px;
    height: 140px;
    object-fit: cover;
    display: block;
  }
}

.bg-uploader {
  ::v-deep .el-upload--picture-card {
    width: 100px;
    height: 100px;
    line-height: 100px;
  }
  ::v-deep .el-upload-list--picture-card .el-upload-list__item {
    width: 100px;
    height: 100px;
  }
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.audio-name {
  font-size: 12px;
  color: #606266;
  margin-top: 5px;
  word-break: break-all;
}

/* 分类管理弹窗样式 */
.category-panel {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}
.panel-title {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
}

@media screen and (max-width: 1400px) {
  .scenic-grid { grid-template-columns: repeat(5, 1fr); }
}
@media screen and (max-width: 1200px) {
  .scenic-grid { grid-template-columns: repeat(4, 1fr); }
}
@media screen and (max-width: 992px) {
  .scenic-grid { grid-template-columns: repeat(3, 1fr); }
}
@media screen and (max-width: 768px) {
  .scenic-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
