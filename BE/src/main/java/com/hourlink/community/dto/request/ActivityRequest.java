package com.hourlink.community.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ActivityRequest {
    
    @NotBlank(message = "Tiêu đề không được để trống")
    String title;
    
    @NotBlank(message = "Mô tả không được để trống")
    String description;
    
    @NotBlank(message = "Địa điểm/Link không được để trống")
    String location;
    
    @NotNull(message = "Thời gian bắt đầu không được để trống")
    @Future(message = "Thời gian bắt đầu phải ở tương lai")
    Instant startTime;
    
    @NotNull(message = "Thời gian kết thúc không được để trống")
    @Future(message = "Thời gian kết thúc phải ở tương lai")
    Instant endTime;
    
    @Min(value = 0, message = "Time Credit thưởng không được âm")
    int creditReward;
    
    @Min(value = 0, message = "Số lượng người tham gia tối đa không được âm (0 = không giới hạn)")
    int maxParticipants;
}
