package com.hourlink.aimatching.dto.response;

import com.hourlink.skill.dto.response.SkillResponse;
import com.hourlink.user.dto.PublicProfileResponse;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.util.List;

import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AiRecommendationResponse {
    PublicProfileResponse helper;
    SkillResponse skill;
    Integer matchPercentage;
    List<String> reasons;
}
