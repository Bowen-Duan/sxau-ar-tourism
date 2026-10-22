package com.pz.travel.service;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.Date;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.github.pagehelper.PageInfo;
import com.ruoyi.common.utils.IdWorker;
import com.pz.travel.common.CommonConstant;
import com.pz.travel.constant.TravelStatsConstant;
import com.pz.travel.domain.TravelModuleDetail;
import com.pz.travel.domain.TravelRecognitionLibrary;
import com.pz.travel.domain.TravelSlideshow;
import com.pz.travel.domain.vo.ScanthingVo;
import com.pz.travel.framework.cloud.CloudStorageService;
import com.pz.travel.framework.cloud.OSSFactory;
import com.pz.travel.mapper.TravelRecognitionLibraryMapper;
import com.pz.travel.mapper.TravelScenicSpotMapper;
import com.pz.travel.mapper.TravelSlideshowMapper;
import com.ruoyi.common.constant.HttpStatus;
import com.ruoyi.common.core.page.TableDataInfo;
import com.ruoyi.common.utils.SecurityUtils;
import com.ruoyi.system.service.ISysConfigService;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.apache.commons.lang3.StringUtils;
import org.json.JSONArray;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.geo.*;
import org.springframework.data.redis.connection.RedisGeoCommands;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class TravelService {
    @Autowired
    private IdWorker idWorker;

    @Autowired
    private TravelSlideshowMapper travelSlideshowMapper;

    @Autowired
    private TravelScenicSpotMapper travelScenicSpotMapper;

    @Autowired
    private TravelRecognitionLibraryMapper travelRecognitionLibraryMapper;

    @Autowired
    private BaiduAIService baiduAIService;

    @Autowired
    private ISysConfigService configService;

    @Autowired
    private RedisTemplate redisTemplate;

    @Autowired
    private TravelScenicViewsService travelScenicViewsService;

    /**
     * 添加或更新首页轮播图
     * @param slideshow
     * @return
     */
    public TravelSlideshow addOrUpdateTravelSlideshow(TravelSlideshow slideshow){
        if(slideshow.getId() != null) {
            travelSlideshowMapper.updateByPrimaryKeySelective(slideshow);
        }else {
            slideshow.setId(idWorker.nextId());
            slideshow.setCreateBy(SecurityUtils.getLoginUser().getUser().getUserId().toString());
            slideshow.setCreateTime(new Date());
            travelSlideshowMapper.insertSelective(slideshow);
        }
        return slideshow;
    }

    /**
     * 删除首页轮播图
     * @param id
     * @return
     */
    public int deleteSlideshow(Long id){
        return travelSlideshowMapper.deleteSlideshow(id);
    }
    /**
     * 获取轮播图列表数据
     * @param slideshow
     * @return
     */
    public List<TravelSlideshow> selectTravelSlideshowList(TravelSlideshow slideshow){
        return travelSlideshowMapper.select(slideshow);
    }

    /**
     * 随机获取一条轮播图记录
     * @return
     */
    public TravelSlideshow slideshowRandom(){
        return travelSlideshowMapper.slideshowRandom();
    }


    public TableDataInfo<TravelModuleDetail> getnear(String longitude, String  latitude,int num, int size){
        Point center = new Point(Double.valueOf(longitude), Double.valueOf(latitude));
        Distance radius = new Distance(Double.valueOf(20), Metrics.KILOMETERS);
        TableDataInfo<TravelModuleDetail> rspData = new TableDataInfo();
        RedisGeoCommands.GeoRadiusCommandArgs args = RedisGeoCommands.GeoRadiusCommandArgs.newGeoRadiusArgs().includeDistance().limit(50).sortAscending();
        try{
            GeoResults<RedisGeoCommands.GeoLocation<String>> results = redisTemplate.opsForGeo().radius(CommonConstant.TRAVEL_GEO_KEY, new Circle(center, radius), args);
            List<GeoResult<RedisGeoCommands.GeoLocation<String>>> resultList = results.getContent();

            if(resultList!=null && !resultList.isEmpty()) {
                String[] ids= new String[resultList.size()];
                int  i=0;
                for (GeoResult<RedisGeoCommands.GeoLocation<String>> geoLocationGeoResult: resultList
                ) {

                    ids[i] = geoLocationGeoResult.getContent().getName();
                    i++;
                }
                int start = (num-1)*size;
                int end = start + size ;
                if(start > ids.length-1){
                    start = ids.length-1;
                }
                if(end > ids.length-1) {
                    end = ids.length-1;
                }
                String[] idsnew    = new String[size];
                 int j = 0 ;
                for(i=start; i<end; i++){

                    idsnew[j]  = ids[i];
                    j++;
                }

                List<TravelModuleDetail> travelScenicSpot = travelScenicSpotMapper.travelScenicSpotInformations(idsnew);



                for (TravelModuleDetail travel:travelScenicSpot
                     ) {

                    String[] strarray  = travel.getLongitude().split(",");
                    travel.setDistance(getDistance(longitude,latitude, strarray[1], strarray[0], travel));
                }
                travelScenicSpot = travelScenicSpot.stream().sorted(Comparator.comparingInt(TravelModuleDetail::getDistanceWithSort)).collect(Collectors.toList());


                rspData.setCode(HttpStatus.SUCCESS);
                rspData.setMsg("查询成功");
                rspData.setRows(travelScenicSpot);
                rspData.setTotal( ids.length);
                return rspData;

            }

        }catch (Exception e){

        }
        return rspData;
    }


    private static double EARTH_RADIUS = 6378.137;

    private static double rad(double d) {
        return d * Math.PI / 180.0;
    }


    public static String getDistance(String lat1Str, String lng1Str, String lat2Str, String lng2Str, TravelModuleDetail travelModuleDetail) {
        Double lat1 = Double.parseDouble(lat1Str);
        Double lng1 = Double.parseDouble(lng1Str);
        Double lat2 = Double.parseDouble(lat2Str);
        Double lng2 = Double.parseDouble(lng2Str);

        double radLat1 = rad(lat1);
        double radLat2 = rad(lat2);
        double difference = radLat1 - radLat2;
        double mdifference = rad(lng1) - rad(lng2);
        double distance = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(difference / 2), 2)
                + Math.cos(radLat1) * Math.cos(radLat2)
                * Math.pow(Math.sin(mdifference / 2), 2)));
        distance = distance * EARTH_RADIUS;

        String distanceStr;
        if (distance>1){
            distance = new BigDecimal(String.valueOf(distance)).setScale(3, BigDecimal.ROUND_HALF_DOWN).doubleValue();
             distanceStr = distance+"km";
        }

        else{
            distance = new BigDecimal(String.valueOf(distance)).setScale(3, BigDecimal.ROUND_HALF_DOWN).doubleValue()*1000;
             distanceStr = distance+"m";
        }
        if(travelModuleDetail != null) {
            travelModuleDetail.setDistanceWithSort(new Double(distance).intValue());
        }
        return distanceStr;
    }

  /**
   * 拍照识别
   *
   * @param tag 标记，1:景点 2:文创
   * @param fileName 图片名称
   * @param data 图片内容
   * @param latitude 纬度
   * @param longitude 经度
   * @return
   */
  public ScanthingVo scanthing(
      String tag, String fileName, byte[] data, String longitude, String latitude, String source, String sourceDetail) {
        ScanthingVo scanthingVo = new ScanthingVo();
        String[] tags = null;
        if(StringUtils.isNotBlank(tag)) {
            tags = new String[] { tag };
        }
        // 直接使用上传原图，不再二次压缩——避免建筑细节丢失导致百度识别准确率下降
        byte[] compressImage = data;
        log.info("图片大小:{}KB（直接使用原图，不压缩）", data.length/1024);
        JSONArray jsonArray = baiduAIService.imageSearch(tags, compressImage);
        if(jsonArray != null) {
            BigDecimal scoreThreshold = new BigDecimal(configService.selectConfigByKey(CommonConstant.TRAVEL_IMAGE_SEARCH_SCROE_KEY));
            // 百度结果已按相似度降序。遍历找到第一条“达阈值且本地识别库存在”的建筑；
            // 达阈值但本地库查不到的，是共享百度图库里其他环境上传的脏数据，异步删除，
            // 避免它以高分顶在最前面、导致本地建筑识别不出来
            TravelModuleDetail travelScenicSpot = null;
            BigDecimal score = null;
            // 遍历所有百度结果，只收集本地识别库存在的，取最高分；外部脏数据异步删除。
            // 不因为某条分数低于阈值就 break——脏数据可能以高分顶在前面，把本地库结果挤到后面。
            for(int i = 0; i < jsonArray.length(); i++) {
                org.json.JSONObject resultRow = jsonArray.getJSONObject(i);
                BigDecimal rowScore = resultRow.getBigDecimal("score");
                if(rowScore == null) continue;
                String briefStr = resultRow.optString("brief");
                if(briefStr == null || briefStr.isEmpty() || !briefStr.startsWith("{")) {
                    continue; // 百度诊断信息或非JSON，跳过
                }
                com.alibaba.fastjson.JSONObject brief;
                try {
                    brief = JSON.parseObject(briefStr);
                } catch (Exception e) {
                    log.warn("百度结果brief解析失败，跳过: {}", briefStr);
                    continue;
                }
                String id = brief.getString("id");
                if(id == null || id.startsWith("diag-")) {
                    continue; // 百度诊断信息，不是建筑图片
                }
                TravelModuleDetail matched = travelScenicSpotMapper.getTravelModuleDetailByRecognitionLibraryId(id);
                if(matched == null) {
                    String contSign = resultRow.optString("cont_sign");
                    log.warn("百度图库存在非本地识别库图片(brief.id={},score={})，异步删除 cont_sign:{}", id, rowScore, contSign);
                    new Thread(() -> {
                        try {
                            if(StringUtils.isNotBlank(contSign)) {
                                baiduAIService.imageDelete(contSign);
                            }
                        } catch (Exception ex) {
                            log.error("删除百度图库脏图失败 cont_sign:{}", contSign, ex);
                        }
                    }).start();
                    continue;
                }
                // 本地库存在，记录最高分
                if(score == null || rowScore.compareTo(score) > 0) {
                    travelScenicSpot = matched;
                    score = rowScore;
                }
            }
            // 遍历完后判断最高分是否达阈值
            if(travelScenicSpot != null && score.compareTo(scoreThreshold) < 0) {
                log.info("本地识别库最高分{}低于阈值{}，未识别", score, scoreThreshold);
                travelScenicSpot = null;
                score = null;
            }

            if(travelScenicSpot != null) {
                //识别出建筑物，返回准确建筑物
                final TravelModuleDetail matchedSpot = travelScenicSpot;
                //添加到识别库(用户库)
                if (travelScenicSpot.getIsUser() != null && travelScenicSpot.getIsUser() ==1 && score.compareTo(new BigDecimal("0.1")) >= 0) {
                    String userId = SecurityUtils.getLoginUser().getUser().getUserId().toString();
                    new Thread(()-> {
                        try {
                            String sTag = (847162 == matchedSpot.getModuleId() ? "1" : "2");
                            //上传图片到阿里云oss
                            String suffix = fileName.substring(fileName.lastIndexOf("."));
                            CloudStorageService storage = OSSFactory.build();
                            String url = storage.uploadSuffix(data, suffix);
                            //添加到识别库
                            TravelRecognitionLibrary travelRecognitionLibrary = new TravelRecognitionLibrary();
                            travelRecognitionLibrary.setFilename(fileName);
                            travelRecognitionLibrary.setUrl(url);
                            travelRecognitionLibrary.setTag(Integer.valueOf(sTag));
                            travelRecognitionLibrary.setModuleDetailId(Long.valueOf(matchedSpot.getId()));
                            travelRecognitionLibrary.setSource(1);
                            this.storageRecognitionLibrary(travelRecognitionLibrary, new String[]{sTag, sTag.concat("1")}, userId);
                        } catch (Exception e) {
                            log.error("", e);
                        }
                    }).start();
                }
                scanthingVo.setResultCode(1);
                travelScenicSpot.setContent(null);
                recordRecognitionEvent(travelScenicSpot.getId(), source, sourceDetail);
                scanthingVo.setTravelScenicSpot(travelScenicSpot);
            }else {
                if(StringUtils.isNotBlank(longitude) && StringUtils.isNotBlank(latitude)) {
                    log.info("建筑物识别---开始经纬度识别");
                    // order by 距离 limit 2, 同时返回距离中心点的距离
                    Point center = new Point(Double.valueOf(longitude), Double.valueOf(latitude));
                    Distance radius = new Distance(Double.valueOf(configService.selectConfigByKey(CommonConstant.TRAVEL_IMAGE_SEARCH_GEO_KEY)), Metrics.KILOMETERS);
                    RedisGeoCommands.GeoRadiusCommandArgs args = RedisGeoCommands.GeoRadiusCommandArgs.newGeoRadiusArgs().includeDistance().limit(2).sortAscending();
                    try{
                        GeoResults<RedisGeoCommands.GeoLocation<String>> results = redisTemplate.opsForGeo().radius(CommonConstant.TRAVEL_GEO_KEY, new Circle(center, radius), args);
                        List<GeoResult<RedisGeoCommands.GeoLocation<String>>> resultList = results.getContent();
                        log.info("建筑物识别---经纬度识别:{}", JSON.toJSONString(resultList));
                        if(resultList!=null && !resultList.isEmpty()) {
                            String id = resultList.get(0).getContent().getName();
                            log.info("建筑物识别，通过经纬度识别出建筑物，id:{}", id);
                            TravelModuleDetail geoSpot = travelScenicSpotMapper.travelScenicSpotInformation(Long.valueOf(id));
                            geoSpot.setContent(null);
                            scanthingVo.setResultCode(1);
                            recordRecognitionEvent(geoSpot.getId(), source, sourceDetail);
                            scanthingVo.setTravelScenicSpot(geoSpot);
                            return scanthingVo;
                        }
                    }catch (Exception e){
                        log.error("", e);
                    }
                }
                //未识别出建筑物、返回相似建筑物
                List<TravelModuleDetail> recommendTravelScenicSpots = getRecommendTravelScenicSpots(jsonArray);
                if(recommendTravelScenicSpots != null) {
                    scanthingVo.setResultCode(2);
                    scanthingVo.setRecommendTravelScenicSpots(recommendTravelScenicSpots);
                    recordRecognitionRecommendEvent(recommendTravelScenicSpots, source, sourceDetail);
                }
            }
        }
        //未找到建筑物，随机查询3条景点记录
        if(scanthingVo.getResultCode() == null){
            scanthingVo.setResultCode(2);
            List<TravelModuleDetail> recommendTravelScenicSpots = travelScenicSpotMapper.travelScenicSpotsRandom(null, 3);
            scanthingVo.setRecommendTravelScenicSpots(recommendTravelScenicSpots);
            recordRecognitionRecommendEvent(recommendTravelScenicSpots, source, sourceDetail);
        }
        return scanthingVo;
    }

    private void recordRecognitionEvent(Long scenicId, String source, String sourceDetail) {
        if (scenicId == null) {
            return;
        }
        try {
            travelScenicViewsService.insertScenicEvent(scenicId, TravelStatsConstant.RECOGNITION_EVENT, source, sourceDetail);
        } catch (Exception e) {
            log.warn("记录建筑识别埋点失败，scenicId:{}", scenicId, e);
        }
    }

    private void recordRecognitionRecommendEvent(List<TravelModuleDetail> recommendTravelScenicSpots, String source, String sourceDetail) {
        if(recommendTravelScenicSpots == null || recommendTravelScenicSpots.isEmpty()) {
            return;
        }
        TravelModuleDetail firstRecommend = recommendTravelScenicSpots.get(0);
        if(firstRecommend == null || firstRecommend.getId() == null) {
            return;
        }
        recordRecognitionEvent(firstRecommend.getId(), source, sourceDetail);
    }

    private List<TravelModuleDetail> getRecommendTravelScenicSpots(JSONArray resultJSONArray) {
        Set<String> ids = new LinkedHashSet<>();
        com.alibaba.fastjson.JSONObject briefObject;
        for(int i = 0; i < resultJSONArray.length(); i++) {
            briefObject = JSON.parseObject(resultJSONArray.getJSONObject(i).getString("brief"));
            ids.add(briefObject.getString("id"));
        }
        if(!ids.isEmpty()){
            List<String> idList = new ArrayList<>();
            int count = 0;
            for (String id:ids){
                if(count > 2){
                    break;
                }
                count++;
                idList.add(id);
            }
            List<TravelModuleDetail> travelScenicSpots = travelScenicSpotMapper.getTravelScenicSpotsByRecognitionLibraryIds(idList.toArray(new String[idList.size()]));
            List<String> addedIdList = travelScenicSpots.stream().map(travelModuleDetail -> String.valueOf(travelModuleDetail.getId())).collect(Collectors.toList());
            if(travelScenicSpots.size() < 3){
                travelScenicSpots.addAll(travelScenicSpotMapper.travelScenicSpotsRandom(addedIdList.toArray(new String[addedIdList.size()]), 3 - travelScenicSpots.size()));
            }
            travelScenicSpots.forEach(travelModuleDetail -> travelModuleDetail.setContent(null));
            return travelScenicSpots;
        }
        return null;
    }

    /**
     * 获取识别库图片列表
     * @param recognitionLibrary
     * @return
     */
    public List<TravelRecognitionLibrary> selectRecognitionLibraryList(TravelRecognitionLibrary recognitionLibrary) {
        return travelRecognitionLibraryMapper.select(recognitionLibrary);
    }

    /**
     * 识别库添加图片
     * @param travelRecognitionLibrary
     */
    @Transactional(rollbackFor = Throwable.class)
    public Boolean storageRecognitionLibrary(TravelRecognitionLibrary travelRecognitionLibrary, String[] tags, String userId) throws Exception {
        Long id = idWorker.nextId();
        //添加到百度识别库
        String contSign = baiduAIService.imageAdd(tags, "", String.valueOf(id), travelRecognitionLibrary.getUrl());
        try{
            if(StringUtils.isBlank(contSign)) {
                return false;
            }
            //删除已经存在的contSign
            TravelRecognitionLibrary recognitionLibraryForDelete = new TravelRecognitionLibrary();
            recognitionLibraryForDelete.setContSign(contSign);
            travelRecognitionLibraryMapper.delete(recognitionLibraryForDelete);

            travelRecognitionLibrary.setId(id);
            travelRecognitionLibrary.setIsStorage(1);
            travelRecognitionLibrary.setStorageTime(new Date());
            travelRecognitionLibrary.setContSign(contSign);
            travelRecognitionLibrary.setCreateBy(userId);
            travelRecognitionLibrary.setCreateTime(new Date());
            travelRecognitionLibraryMapper.insertSelective(travelRecognitionLibrary);
            return true;
        }catch (Exception e){
            new Thread(() -> {
                try {
                    //百度图片库，添加后立即调用删除接口，图片不会删除，需要延迟几秒后再调用删除接口
                    Thread.sleep(5000L);
                } catch (InterruptedException ex) {
                    log.error("", ex);
                }
                baiduAIService.imageDelete(contSign);
            }).start();
            throw e;
        }
    }

    /**
     * 补传：把本地识别库中尚未入百度图库(is_storage=0 或 cont_sign 为空)的图片，
     * 以本地识别库现有主键作为 brief.id 重新入库，保证拍照识别时能关联回对应建筑。
     * @param tag 1:景点 2:文创，为空则全部补传
     * @return 成功补传条数
     */
    public int reStorageRecognitionLibrary(String tag) {
        TravelRecognitionLibrary query = new TravelRecognitionLibrary();
        if(StringUtils.isNotBlank(tag)) {
            query.setTag(Integer.valueOf(tag));
        }
        List<TravelRecognitionLibrary> list = travelRecognitionLibraryMapper.select(query);
        int success = 0;
        int total = list == null ? 0 : list.size();
        for(TravelRecognitionLibrary lib : list) {
            // 强制重新入库：不跳过已入库记录，避免百度图库中图片被误删后本地仍标记已入库
            try {
                // brief.id 必须使用本地识别库现有主键，识别时才能关联回对应建筑
                String libTag = String.valueOf(lib.getTag());
                String[] sTags = new String[]{libTag, libTag.concat("1")};
                byte[] imageBytes = downloadBytes(lib.getUrl());
                String contSign = imageBytes == null ? ""
                        : baiduAIService.imageAddForce(sTags, String.valueOf(lib.getId()), lib.getUrl(), imageBytes);
                if(StringUtils.isNotBlank(contSign)) {
                    lib.setContSign(contSign);
                    lib.setIsStorage(1);
                    lib.setStorageTime(new Date());
                    travelRecognitionLibraryMapper.updateByPrimaryKeySelective(lib);
                    success++;
                    log.info("识别库图片补传成功 id:{} 建筑id:{} cont_sign:{}", lib.getId(), lib.getModuleDetailId(), contSign);
                }
                // 百度限流约 0.7 次/秒，加间隔避免触发频控
                Thread.sleep(1500L);
            } catch (Exception e) {
                log.error("识别库图片补传失败 id:{} url:{}", lib.getId(), lib.getUrl(), e);
            }
        }
        log.info("识别库补传完成，成功{}条/总计{}条", success, total);
        return success;
    }

    /**
     * 从公网 URL 下载图片字节，用于百度图库“已存在”图片的搜索替换
     */
    private byte[] downloadBytes(String url) {
        try (java.io.InputStream is = new java.net.URL(url).openStream();
             java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream()) {
            byte[] buf = new byte[4096];
            int n;
            while((n = is.read(buf)) != -1) {
                bos.write(buf, 0, n);
            }
            return bos.toByteArray();
        } catch (Exception e) {
            log.error("下载识别库图片失败 url:{}", url, e);
            return null;
        }
    }

    /**
     * 删除识别库中图片
     * @param recognitionLibraryIds
     * @return
     */
    public int deleteRecognitionLibrary(Long[] recognitionLibraryIds) {
        TravelRecognitionLibrary recognitionLibrary;
        List<Long> recognitionLibraryIdsForDelete = new ArrayList<>();
        for (Long recognitionLibraryId: recognitionLibraryIds) {
            recognitionLibrary  = travelRecognitionLibraryMapper.selectByPrimaryKey(recognitionLibraryId);
            if(recognitionLibrary != null && StringUtils.isNotBlank(recognitionLibrary.getContSign())) {
                //删除百度识别库中图片
                try{
                    if(baiduAIService.imageDelete(recognitionLibrary.getContSign())) {
                        recognitionLibraryIdsForDelete.add(recognitionLibraryId);
                    }
                }catch (Exception e){
                    log.error("删除识别库中图片出错，contSign:" + recognitionLibrary.getContSign(), e);
                }
            }
        }
        //删除记录
        int result = 0;
        if(!recognitionLibraryIdsForDelete.isEmpty()){
            result = travelRecognitionLibraryMapper.deleteTravelRecognitionLibraryByIds(recognitionLibraryIdsForDelete.toArray(new Long[recognitionLibraryIdsForDelete.size()]));
        }
        return result;
    }


}
