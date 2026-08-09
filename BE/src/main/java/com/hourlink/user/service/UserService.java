package com.hourlink.user.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import java.io.IOException;
import java.util.Map;

/**
 * UserService — TODO: implement CRUD người dùng, hồ sơ cá nhân, huy hiệu.
 *
 * Các method cần implement:
 *  - getUserById(UUID)
 *  - getMyProfile()
 *  - updateMyProfile(ProfileUpdateRequest)
 *  - changePassword(ChangePasswordRequest)
 *  - getUsers(page, size, search...)     [ADMIN]
 *  - lockUser(UUID) / unlockUser(UUID)   [ADMIN]
 *  - getOrganizationProfile(UUID)
 *  - getUserBadges(UUID)
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {
    private final com.hourlink.user.repository.UserRepository userRepository;
    private final Cloudinary cloudinary;
    private final com.hourlink.skill.service.SkillService skillService;
    private final com.hourlink.rating.service.RatingService ratingService;

    /**
     * Hồ sơ công khai của một người dùng khác — dùng khi xem thông tin người
     * đang trò chuyện hoặc người hỗ trợ tiềm năng (chức năng 9.3 + 9.10).
     *
     * <p>Không trả về email / số điện thoại / ngày sinh theo yêu cầu bảo mật
     * ở mục 14.</p>
     */
    public com.hourlink.user.dto.PublicProfileResponse getPublicProfile(java.util.UUID userId) {
        com.hourlink.user.entity.User user = userRepository.findById(userId)
                .orElseThrow(() -> new com.hourlink.common.exception.AppException(
                        com.hourlink.common.exception.ErrorCode.USER_NOT_FOUND));

        return com.hourlink.user.dto.PublicProfileResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .region(user.getRegion())
                .occupation(user.getOccupation())
                .languages(user.getLanguages())
                .userType(user.getUserType())
                .isVerified(user.isVerified())
                .reputationScore(user.getReputationScore())
                .completedSessions(user.getCompletedSessions())
                .cancelRate(user.getCancelRate())
                .joinedAt(user.getCreatedAt())
                .skills(skillService.getVisibleSkillsOfUser(userId))
                .badges(ratingService.getUserBadges(userId))
                .build();
    }

    public com.hourlink.user.dto.UserDto getMyProfile() {
        String email = com.hourlink.common.util.SecurityUtil.getCurrentUserEmail();
        com.hourlink.user.entity.User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new com.hourlink.common.exception.AppException(com.hourlink.common.exception.ErrorCode.USER_NOT_FOUND));
        return mapToDto(user);
    }

    @Transactional
    public com.hourlink.user.dto.UserDto updateMyProfile(com.hourlink.user.dto.ProfileUpdateRequest request) {
        String email = com.hourlink.common.util.SecurityUtil.getCurrentUserEmail();
        com.hourlink.user.entity.User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new com.hourlink.common.exception.AppException(com.hourlink.common.exception.ErrorCode.USER_NOT_FOUND));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName());
        }
        user.setBio(request.getBio());
        user.setRegion(request.getRegion());
        user.setOccupation(request.getOccupation());
        user.setLanguages(request.getLanguages());
        
        if (request.getAvatarUrl() != null && !request.getAvatarUrl().isBlank()) {
            if (request.getAvatarUrl().startsWith("data:image")) {
                try {
                    Map<?, ?> uploadResult = cloudinary.uploader().upload(request.getAvatarUrl(), ObjectUtils.emptyMap());
                    user.setAvatarUrl(uploadResult.get("url").toString());
                } catch (IOException e) {
                    log.error("Lỗi upload avatar: ", e);
                    throw new com.hourlink.common.exception.AppException(com.hourlink.common.exception.ErrorCode.UPLOAD_FAILED);
                }
            } else {
                user.setAvatarUrl(request.getAvatarUrl());
            }
        }
        
        if (request.getDob() != null) {
            user.setDob(request.getDob());
        }
        
        // phone and email updates might require separate verification logic, but updating directly for now
        if (request.getPhone() != null && !request.getPhone().isBlank() && !request.getPhone().equals(user.getPhone())) {
             if (userRepository.existsByPhone(request.getPhone())) {
                 throw new com.hourlink.common.exception.AppException(com.hourlink.common.exception.ErrorCode.PHONE_ALREADY_EXISTS);
             }
             user.setPhone(request.getPhone());
        }

        user = userRepository.save(user);
        return mapToDto(user);
    }

    private com.hourlink.user.dto.UserDto mapToDto(com.hourlink.user.entity.User user) {
        return com.hourlink.user.dto.UserDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .dob(user.getDob())
                .region(user.getRegion())
                .occupation(user.getOccupation())
                .userType(user.getUserType())
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .languages(user.getLanguages())
                .isVerified(user.isVerified())
                .isLocked(user.isLocked())
                .reputationScore(user.getReputationScore())
                .completedSessions(user.getCompletedSessions())
                .cancelRate(user.getCancelRate())
                .build();
    }
}
