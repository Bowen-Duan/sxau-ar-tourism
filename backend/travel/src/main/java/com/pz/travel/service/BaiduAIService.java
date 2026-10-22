package com.pz.travel.service;

import com.alibaba.fastjson.JSON;
import com.baidu.aip.imagesearch.AipImageSearch;
import com.google.common.util.concurrent.RateLimiter;
import com.pz.travel.config.properties.BaiduProperties;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.HashMap;

@Service
@Slf4j
public class BaiduAIService {
    final RateLimiter rateLimiter = RateLimiter.create(0.7);

    @Autowired
    private BaiduProperties baiduProperties;

    private AipImageSearch client;

    @PostConstruct
    public void init(){
        client = new AipImageSearch(baiduProperties.getAppId(), baiduProperties.getApiKey(), baiduProperties.getSecretKey());
        //设置网络连接参数
        client.setConnectionTimeoutInMillis(5000);
        client.setSocketTimeoutInMillis(30000);
    }

    /**
     * 相似图片入库
     * @throws Exception
     */
    public String imageAdd(String[] tags, String name, String id, String url) throws Exception {
        // 传入可选参数调用接口
        HashMap<String, String> options = new HashMap<>();
        if(tags!=null && tags.length > 0){
            options.put("tags", StringUtils.join(tags, ','));
        }
        com.alibaba.fastjson.JSONObject jsonObject = new com.alibaba.fastjson.JSONObject();
        jsonObject.put("name", name);
        jsonObject.put("id", id);
        jsonObject.put("url", url);
        rateLimiter.acquire();
        JSONObject res = client.similarAddUrl(url, JSON.toJSONString(jsonObject), options);
        log.info("相似图片入库，响应内容:{}", res.toString(2));
        if(res.has("error_msg")) {
            String errorMsg = res.getString("error_msg");
            log.error("相似图片入库失败id:{},name:{},url:{},{}", id, name, url, errorMsg);
            if(StringUtils.isNotBlank(errorMsg)) {
                return "";
            }
        }
        return res.getString("cont_sign");
    }

    /**
     * 相似图片入库（强制绑定本地id）：
     * 若百度图库已存在相同图片(item has existed, error_code=216681)，
     * 则按图搜索出旧图签名 -> 删除旧图 -> 延迟 -> 用本地id重新入库，
     * 解决共享百度图库中同一张图被其他环境以别的 brief.id 占用、导致本地识别不出来的问题。
     */
    public String imageAddForce(String[] tags, String id, String url, byte[] bytes) throws Exception {
        HashMap<String, String> options = new HashMap<>();
        if(tags != null && tags.length > 0){
            options.put("tags", StringUtils.join(tags, ','));
        }
        com.alibaba.fastjson.JSONObject brief = new com.alibaba.fastjson.JSONObject();
        brief.put("name", "");
        brief.put("id", id);
        brief.put("url", url);
        rateLimiter.acquire();
        JSONObject res = client.similarAddUrl(url, JSON.toJSONString(brief), options);
        log.info("相似图片入库(force) id:{} 响应:{}", id, res.toString(2));
        if(!res.has("error_code")) {
            return res.optString("cont_sign");
        }
        int errorCode = res.optInt("error_code", -1);
        if(errorCode == 216681) {
            log.warn("图片已存在于百度图库，开始替换为本地id:{}", id);
            // 用图片内容在全库搜索旧图（不限 tag）
            JSONArray searchRes = this.imageSearch(null, bytes);
            if(searchRes != null && searchRes.length() > 0) {
                JSONObject top = searchRes.getJSONObject(0);
                double topScore = top.optDouble("score", 0);
                String oldSign = top.optString("cont_sign");
                log.info("替换：旧图 cont_sign:{} score:{}", oldSign, topScore);
                // score 足够高才认定是同一张图，避免误删
                if(topScore >= 0.9d && StringUtils.isNotBlank(oldSign)) {
                    this.imageDelete(oldSign);
                    // 百度删除有延迟，等待后再添加
                    Thread.sleep(3000L);
                    rateLimiter.acquire();
                    JSONObject res2 = client.similarAddUrl(url, JSON.toJSONString(brief), options);
                    log.info("删除旧图后重新入库 id:{} 响应:{}", id, res2.toString(2));
                    if(!res2.has("error_code")) {
                        return res2.optString("cont_sign");
                    }
                }
            }
            return "";
        }
        log.error("相似图片入库失败 id:{}, error_code:{}, error_msg:{}", id, errorCode, res.optString("error_msg"));
        return "";
    }

    /**
     * 相似图片搜索
     */
    public JSONArray imageSearch(String[] tags, byte[] file){
        // 传入可选参数调用接口
        HashMap<String, String> options = new HashMap<>();
        if(tags!=null && tags.length > 0){
            options.put("tags", StringUtils.join(tags, ','));
            options.put("tag_logic", "0");
        }
        options.put("pn", "0");
        options.put("rn", "100");

        JSONObject res = client.similarSearch(file, options);
        log.info("相似图片搜索，响应内容:{}", res.toString(2));
        // 百度返回错误（如 SDK108 超时、鉴权失败等）时，记录日志并返回 null，
        // 由上层走"随机推荐建筑"兜底，避免 JSONObject["result_num"] not found 崩溃
        if (res.has("error_code")) {
            log.error("相似图片搜索失败 error_code:{}, error_msg:{}",
                    res.optString("error_code"), res.optString("error_msg"));
            return null;
        }
        if (res.has("result_num") && res.getInt("result_num") > 0) {
            return res.getJSONArray("result");
        }
        return null;
    }

    /**
     * 相似图片删除
     * @param contSign
     */
    public Boolean imageDelete(String contSign) {
        // 传入可选参数调用接口
        HashMap<String, String> options = new HashMap<>();
        // 删除相似图，传入参数为图片签名
        rateLimiter.acquire();
        JSONObject res = client.similarDeleteBySign(contSign, options);
        log.info("相似图片删除，contSign:{},响应内容:{}", contSign, res.toString(2));
        if(res.has("error_msg")) {
            String errorMsg = res.getString("error_msg");
            log.error("相似图片删除失败contSign:{},{}", contSign, errorMsg);
        }
        return !res.has("error_code");
    }
}
