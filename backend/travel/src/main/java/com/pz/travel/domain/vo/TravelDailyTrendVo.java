package com.pz.travel.domain.vo;

import lombok.Data;

/**
 * 每日趋势统计：按天聚合建筑浏览 / 识别 / VR 查看次数，
 * 数据来源 travel_scenic_view（dates + event_type）。
 */
@Data
public class TravelDailyTrendVo {

    /**
     * 日期，格式 yyyy-MM-dd
     */
    private String date;

    /**
     * 建筑浏览次数（event_type = 1 或为空）
     */
    private Integer viewCount;

    /**
     * 建筑识别次数（event_type = 2）
     */
    private Integer recognitionCount;

    /**
     * VR 查看次数（event_type = 3）
     */
    private Integer vrCount;
}
