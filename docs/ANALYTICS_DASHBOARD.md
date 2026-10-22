# 数据统计看板（Analytics Dashboard）

在已有统计能力（`/wxdata/base` 基础计数、识别/VR/热度排行、来源统计，均由小程序首页使用）之上，
新增「每日趋势 + 点赞排行 + 管理后台统计页」，补上此前缺失的时间维度分析。

## 新增接口（后端 travel 模块）

| 接口 | 说明 |
|---|---|
| `GET /wxdata/trend?days=14` | 最近 N 天每日趋势：建筑浏览（event_type=1/空）、建筑识别（=2）、VR 查看（=3），数据来自 `travel_scenic_view.dates` 按天聚合 |
| `GET /wxdata/likeRank?limit=10` | 建筑点赞排行：`travel_module_detail.likes` 降序（此前只有全局点赞总数，没有排行） |

## 改动文件

- `backend/travel/.../domain/vo/TravelDailyTrendVo.java`（新增 VO）
- `backend/travel/.../mapper/WxDataMapper.java` + `resources/mapper/travel/WxDataMapper.xml`（新增 `selectDailyTrend`、`selectLikeRank`）
- `backend/travel/.../controller/WxDataController.java`（新增 `/trend`、`/likeRank` 端点，风格与既有端点一致）
- `admin-web/src/api/wxdata.js`（新增 `getDailyTrend`、`getLikeRank`）
- `admin-web/src/views/statistics/index.vue`（新增统计页：概览卡片 + 趋势折线（7/14/30 天切换）+ 点赞/识别双排行条形图，ECharts macarons 主题）

## 启用管理后台菜单

统计页已就绪，需在若依菜单中挂载后才能从后台进入（系统管理 → 菜单管理 → 新增），或执行：

```sql
insert into sys_menu
  (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time)
values
  ('数据统计', 0, 5, 'statistics', 'statistics/index', 1, 0, 'C', '0', '0', '', 'chart', 'admin', sysdate());
```

（parent_id 按需调整：放顶级菜单为 0，或改到某个目录菜单下；之后给相应角色授权。）

## 验证状态

代码按本仓库既有模式编写（CommonResult 返回、XML mapper、ECharts 用法均与现有代码一致，mapper XML 已通过良构校验）。
**尚未在本机编译/运行验证**（此环境无 JDK 与前端构建链）——首次使用前请在本地以 IDEA/Trae 打开后端编译一次、
并启动 admin-web 打开统计页确认图表渲染；如有报错把信息发回即可快速修正。
