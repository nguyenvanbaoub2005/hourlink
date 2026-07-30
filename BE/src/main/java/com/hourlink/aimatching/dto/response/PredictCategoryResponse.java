package com.hourlink.aimatching.dto.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PredictCategoryResponse {
    Integer category_id;   // AI trả về int, không phải UUID
    String category_name;
    Double confidence;
    String suggested_title;
    String suggested_level;
    String suggested_format;
    String suggested_time;
}
