package com.hourlink.user.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    // TODO: inject UserRepository, BadgeRepository, UserBadgeRepository, OrgProfileRepository
}
