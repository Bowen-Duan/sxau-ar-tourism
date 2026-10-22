package com.pz.travel.controller;

import com.pz.travel.common.CommonResult;
import com.pz.travel.domain.*;
import com.pz.travel.domain.vo.ScanthingVo;
import com.pz.travel.domain.vo.TravelScenicSpotCommentVo;
import com.pz.travel.service.*;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.page.PageDomain;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.core.page.TableSupport;
import com.ruoyi.common.exception.OssException;
import com.ruoyi.common.utils.SecurityUtils;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.Base64;

/**
 * 旅游业务接口(小程序调用)
 */
@RestController
@Api(tags ={"旅游业务接口(小程序调用)"})
@RequestMapping("/travel")
public class TravelController extends BaseController {
    @Autowired
    private TravelService travelService;
    @Autowired
    private TravelScenicSpotService travelScenicSpotService;
    @Autowired
    private TravelScenicSpotLikesService travelScenicSpotLikesService;

    @Autowired
    private TravelVideoService travelVideoService;


    //首页轮播图、拍照识别、关键字搜索获取景点名称列表、获取活动列表
    /**
     * 随机获取首页轮播图
     *
     * @return 轮播图信息
     */
    @GetMapping(value = "/slideshow/random")
    @ApiOperation(value = "轮播图信息")
    public CommonResult<TravelSlideshow> slideshowRandom() {
        return CommonResult.ok().setResult(travelService.slideshowRandom());
    }


    /**
     *
     */
    @GetMapping(value = "/near")
    @ApiOperation(value = "根据经纬度查询附近的景点")
    public TableDataInfo<TravelModuleDetail> selectNear(String longitude, String  latitude){


        PageDomain pageDomain = TableSupport.buildPageRequest();
        Integer pageNum = pageDomain.getPageNum();
        Integer pageSize = pageDomain.getPageSize();
        return travelService.getnear(longitude,latitude,pageNum,pageSize);
    }

    /**
     * 拍照识别
     *
     * @param file 图片内容
     * @param tag  标记，1:景点 2:文创
     * @return
     * @throws Exception
     */
    @PostMapping("/scanthing")
    @ResponseBody
    public CommonResult<ScanthingVo> scanthing(@RequestParam("file") MultipartFile file,
                                               @RequestParam(value = "tag", required = false) String tag,
                                               @RequestParam(value = "long", required = false, defaultValue = "") String longitude,
                                               @RequestParam(value = "lat", required = false, defaultValue = "") String latitude,
                                               @RequestParam(value = "source", required = false, defaultValue = "") String source,
                                               @RequestParam(value = "sourceDetail", required = false, defaultValue = "") String sourceDetail) throws Exception {
        if (file.isEmpty()) {
            throw new OssException("识别图片不能为空");
        }
        String fileName = file.getOriginalFilename();
        // String suffix = fileName.substring(fileName.lastIndexOf("."));
        ScanthingVo scanthingVo = travelService.scanthing(tag, fileName, file.getBytes(), longitude, latitude, source, sourceDetail);
        return CommonResult.ok().setResult(scanthingVo);
    }

    /**
     * base64 图片识别（小程序 wx.request 调用，绕过 uploadFile 限制）
     */
    @PostMapping("/scanthingBase64")
    @ResponseBody
    public CommonResult<ScanthingVo> scanthingBase64(@RequestBody Map<String, String> params) throws Exception {
        String base64 = params.get("image");
        if (base64 == null || base64.isEmpty()) {
            throw new OssException("识别图片不能为空");
        }
        if (base64.contains(",")) {
            base64 = base64.substring(base64.indexOf(",") + 1);
        }
        byte[] data = Base64.getDecoder().decode(base64);
        String tag = params.getOrDefault("tag", "");
        String fileName = params.getOrDefault("fileName", "base64_image.jpg");
        String longitude = params.getOrDefault("long", "");
        String latitude = params.getOrDefault("lat", "");
        String source = params.getOrDefault("source", "");
        String sourceDetail = params.getOrDefault("sourceDetail", "");
        ScanthingVo scanthingVo = travelService.scanthing(tag, fileName, data, longitude, latitude, source, sourceDetail);
        return CommonResult.ok().setResult(scanthingVo);
    }

    /**
     * 临时接口：把本地识别库未入百度图库的图片补传入库（用完可删除）
     */
    @GetMapping("/restorage/{tag}")
    @ResponseBody
    public CommonResult<Integer> reStorageRecognitionLibrary(@PathVariable("tag") String tag) {
        return CommonResult.ok().setResult(travelService.reStorageRecognitionLibrary(tag));
    }

    /**
     * 首页关键字搜索获取景点名称列表
     *
     * @param name 用户输入的关键字
     * @return 景点名称列表
     */
    @GetMapping("/list")
    @ApiOperation(value = "首页关键字搜索获取景点名称列表")
    public CommonResult<TravelModuleDetail> travelScenicSpotNameSearch(@RequestParam String name) {
        return CommonResult.ok().setResult(travelScenicSpotService.travelScenicSpotName(name));
    }

    /**
     * 获取活动列表
     *
     * @param travelModuleDetail
     * @return
     */
    @GetMapping("/getActivityList")
    @ApiOperation(value = "获取活动列表")
    public TableDataInfo<TravelModuleDetail> getActivityList(TravelModuleDetail travelModuleDetail) {
        startPage();
        List<TravelModuleDetail> list = travelScenicSpotService.getActivityList(travelModuleDetail);
        return getDataTable(list);
    }

    /**
     * 获取二级分类名
     * @param travelSubClassification
     * @return
     */
    @GetMapping("/getSubClassification")
    @ApiOperation(value = "获取二级分类名")
    public CommonResult<List<String>> getSubClassification(TravelSubClassification travelSubClassification){
        return CommonResult.ok().setResult(travelScenicSpotService.getSubClassification(travelSubClassification));
    }


    /**
     * 获取景点信息列表
     *
     * @param subClassificationId,支持分页，pageNum，pageSize
     * @return 景点信息列表
     */
    @GetMapping("/scenicspot/list")
    @ApiOperation(value = "获取景点信息列表")
    public TableDataInfo<TravelModuleDetail> travelScenicSpotList(Long subClassificationId,String blockId) {
        startPage();
        List<TravelModuleDetail> list = travelScenicSpotService.travelScenicSpotList(subClassificationId,blockId);
        return getDataTable(list);
    }

    /**
     * 获取景点详情信息
     *
     * @param id 景点id
     * @return 景点详情信息
     */
    @GetMapping("/scenicspot/{id}")
    @ApiOperation(value = "获取景点详情信息")
    public CommonResult<TravelModuleDetail> travelScenicSpotInformation(@PathVariable Long id) {
        return CommonResult.ok().setResult(travelScenicSpotService.travelScenicInformation(id));
    }

    /**
     * 根据vrType获取景点详情信息
     *
     * @param type vr Type
     * @return 景点详情信息
     */
    @GetMapping("/scenicspot/vrType/{type}")
    @ApiOperation(value = "根据vrType获取景点详情信息")
    public CommonResult<TravelModuleDetail> travelScenicSpotInformationByVrType(@PathVariable String type) {
        return CommonResult.ok().setResult(travelScenicSpotService.travelScenicInformationByVrType(type));
    }

    /**
     * 查询景点评论列表
     *
     * @param scenicspotId 景点id,支持分页，pageNum，pageSize
     * @return
     */
    @GetMapping("/scenicspot/comments/{scenicspotId}")
    @ApiOperation(value = "查询景点评论列表")
    public TableDataInfo<TravelScenicSpotCommentVo> list(@PathVariable Long scenicspotId) {
        startPage();
        List<TravelScenicSpotCommentVo> list = travelScenicSpotService.selectTravelScenicSpotCommentList(scenicspotId);
        return getDataTable(list);
    }

    /**
     * 获取VR列表
     *
     * @param travelModuleDetail
     * @return
     */
    @GetMapping("/getVrList")
    @ApiOperation(value = "获取VR列表")
    public TableDataInfo<TravelModuleDetail> getVrList(TravelModuleDetail travelModuleDetail) {
        startPage();
        List<TravelModuleDetail> list = travelScenicSpotService.getVrList(travelModuleDetail);
        return getDataTable(list);
    }

    //点赞

    /**
     * 根据景点ID获取浏览量和点赞量
     *
     * @param scenicspotId
     * @return
     */
    @GetMapping("/selectLikesNums/{scenicspotId}")
    @ApiOperation(value = "根据景点ID获取浏览量和点赞量")
    public CommonResult<TravelModuleDetail> getPageviewsAndLikes(@PathVariable Long scenicspotId) {
        int likesNum = travelScenicSpotLikesService.isLikes(scenicspotId);
        if(likesNum>0){
            return CommonResult.ok().setResult(travelScenicSpotService.getPageviewsAndLikes(scenicspotId),"0");
        }else {
            return CommonResult.ok().setResult(travelScenicSpotService.getPageviewsAndLikes(scenicspotId),"1");
        }
    }

    /**
     * 用户点赞
     * @param scenicSpotId 景点id
     * @param travelScenicSpotLikes
     * @return
     */
    @RequestMapping("/insertLikesORdeletelLikes/{scenicSpotId}")
    @ApiOperation(value = "用户点赞")
    public CommonResult<TravelScenicSpotLikes> modifyLikes(TravelScenicSpotLikes travelScenicSpotLikes,
                                                           @PathVariable Long scenicSpotId) {
        int likesNum = travelScenicSpotLikesService.isLikes(scenicSpotId);
        if (likesNum > 0) {
            //取消点赞,点赞表删除记录
            travelScenicSpotLikesService.deletelLikes(scenicSpotId);
            //景点表点赞量更新
            travelScenicSpotService.cancelLikes(scenicSpotId);
            return CommonResult.ok().setResult("0");
        } else { //点赞
            //景点表点赞量更新
            travelScenicSpotService.updateLikes(scenicSpotId);
            //点赞表增加记录
            travelScenicSpotLikesService.insertLikes(travelScenicSpotLikes);
            return CommonResult.ok().setResult("1");

        }
    }


    //景点浏览量

    /**
     * 更新浏览量(加一)
     *
     * @param id
     * @return
     */
    @PutMapping ("/updatePageViews/{id}")
    @ApiOperation("更新浏览量(加一)")
    public CommonResult<TravelModuleDetail> updatePageViews(@PathVariable Long id) {
        return CommonResult.ok().setResult(travelScenicSpotService.updatePageViews(id));
    }




    @GetMapping("/selectMap")
    @ApiOperation("获取地图")
    public CommonResult<TravelModuleDetail> getMap(){

        return CommonResult.ok().setResult(travelScenicSpotService.selectMap());
    }


    @ApiOperation("/微课点击详情")
    @GetMapping("/detail")
    public CommonResult<TravelVideo> detail(Long  id){

        return CommonResult.success().setResult(travelVideoService.detail(id));
    }

    /**
     * 查询
     * @return
     */
    @ApiOperation("/微课列表 类型 0:微创 1:宣传视频2:手册")
    @GetMapping("/VideoList")
    public TableDataInfo<TravelVideo> list(TravelVideo travelVideo){
        startPage();
        List<TravelVideo> travelVideos = travelVideoService.list(travelVideo);
        return getDataTable(travelVideos);
    }
}
