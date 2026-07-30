package com.hourlink.aimatching.service;

import com.hourlink.aimatching.dto.request.PredictCategoryRequest;
import com.hourlink.aimatching.dto.request.RecommendRequest;
import com.hourlink.aimatching.dto.response.AiRecommendationResponse;
import com.hourlink.aimatching.dto.response.PredictCategoryResponse;
import com.hourlink.aimatching.dto.response.RecommendResponse;
import com.hourlink.helprequest.entity.HelpRequest;
import com.hourlink.helprequest.repository.HelpRequestRepository;
import com.hourlink.skill.dto.response.SkillResponse;
import com.hourlink.skill.entity.Skill;
import com.hourlink.skill.repository.SkillRepository;
import com.hourlink.user.dto.PublicProfileResponse;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.boot.web.client.RestTemplateBuilder;
import jakarta.annotation.PostConstruct;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AimatchingService {

    private final HelpRequestRepository helpRequestRepository;
    private final SkillRepository skillRepository;
    private final UserRepository userRepository;
    private final RestTemplateBuilder restTemplateBuilder;
    private RestTemplate restTemplate;

    @Value("${ai.service.url:http://127.0.0.1:8000}")
    private String aiServiceUrl;

    @PostConstruct
    public void init() {
        this.restTemplate = restTemplateBuilder.build();
    }

    public PredictCategoryResponse predictCategory(PredictCategoryRequest request) {
        String url = aiServiceUrl + "/api/ai/predict-category";
        try {
            return restTemplate.postForObject(url, request, PredictCategoryResponse.class);
        } catch (Exception e) {
            log.error("Lỗi khi gọi AI service predict category", e);
            throw new RuntimeException("Không thể gọi AI Service. Hãy chắc chắn server Python đang chạy.");
        }
    }

    public List<AiRecommendationResponse> recommendHelpers(UUID helpRequestId) {
        HelpRequest helpRequest = helpRequestRepository.findById(helpRequestId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy HelpRequest"));

        // Nếu Request chưa có category thì tạm thời lấy tất cả hoặc một số, ở đây ta lấy theo category
        List<Skill> relevantSkills = new ArrayList<>();
        if (helpRequest.getCategory() != null) {
            relevantSkills = skillRepository.findAllByCategory_Id(helpRequest.getCategory().getId());
        } else {
            // Nếu không có category, ta lấy 100 skill ngẫu nhiên để AI tự rank
            relevantSkills = skillRepository.findAll().stream().limit(100).collect(Collectors.toList());
        }

        List<RecommendRequest.HelperSkill> helperSkills = relevantSkills.stream().map(skill -> 
            RecommendRequest.HelperSkill.builder()
                .user_id(skill.getUser().getId())
                .skill_id(skill.getId())
                .skill_name(skill.getName())
                .skill_description(skill.getDescription())
                .free_time(skill.getFreeTime())
                .reputation_score(skill.getUser().getReputationScore())
                .build()
        ).collect(Collectors.toList());

        RecommendRequest pythonRequest = RecommendRequest.builder()
                .help_request_id(helpRequestId)
                .description(helpRequest.getDescription())
                .desired_time(helpRequest.getDesiredTime())
                .helpers(helperSkills)
                .build();

        String url = aiServiceUrl + "/api/ai/recommend";
        RecommendResponse pythonResponse;
        try {
            pythonResponse = restTemplate.postForObject(url, pythonRequest, RecommendResponse.class);
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            log.error("Lỗi 422/400 từ AI service: {}", e.getResponseBodyAsString());
            throw new RuntimeException("Lỗi dữ liệu khi gọi AI Service.");
        } catch (Exception e) {
            log.error("Lỗi khi gọi AI service recommend", e);
            throw new RuntimeException("Không thể gọi AI Service. Hãy chắc chắn server Python đang chạy.");
        }

        if (pythonResponse == null || pythonResponse.getRecommendations() == null) {
            return new ArrayList<>();
        }

        return pythonResponse.getRecommendations().stream().map(rec -> {
            User user = userRepository.findById(rec.getUser_id()).orElse(null);
            Skill skill = skillRepository.findById(rec.getSkill_id()).orElse(null);
            
            PublicProfileResponse userProfile = user != null ? PublicProfileResponse.builder()
                    .id(user.getId())
                    .fullName(user.getFullName())
                    .avatarUrl(user.getAvatarUrl())
                    .reputationScore(user.getReputationScore())
                    .build() : null;

            SkillResponse skillResponse = skill != null ? SkillResponse.builder()
                    .id(skill.getId())
                    .name(skill.getName())
                    .build() : null;

            return AiRecommendationResponse.builder()
                    .helper(userProfile)
                    .skill(skillResponse)
                    .matchPercentage(rec.getMatch_percentage())
                    .reasons(rec.getReasons())
                    .build();
        }).collect(Collectors.toList());
    }
}
