package com.hourlink.aimatching.dto.request;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RecommendRequest {
    UUID help_request_id;
    String description;
    String desired_time;
    List<HelperSkill> helpers;

    @Data
    @Builder
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class HelperSkill {
        UUID user_id;
        UUID skill_id;
        String skill_name;
        String skill_description;
        String free_time;
        Double reputation_score;
    }
}
