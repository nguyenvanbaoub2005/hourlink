package com.hourlink.admin.service;

import com.hourlink.admin.dto.request.AdminNoteUpdateRequest;
import com.hourlink.admin.dto.request.UserActionRequest;
import com.hourlink.admin.dto.response.AdminUserDetailResponse;
import com.hourlink.admin.dto.response.AdminUserResponse;
import com.hourlink.admin.entity.UserAdminAction;
import com.hourlink.admin.repository.UserAdminActionRepository;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import com.hourlink.appointment.repository.AppointmentRepository;
import com.hourlink.helprequest.repository.HelpRequestRepository;
import com.hourlink.common.service.EmailService;
import com.hourlink.common.service.CloudinaryService;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.security.SecureRandom;
import java.util.Map;
import com.hourlink.admin.dto.request.AdminCreateUserRequest;
import com.hourlink.admin.dto.request.AdminUpdateUserRequest;
import com.hourlink.user.entity.Role;
import com.hourlink.user.entity.UserRole;
import com.hourlink.user.repository.RoleRepository;
import com.hourlink.user.repository.UserRoleRepository;
import com.hourlink.wallet.service.WalletService;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.hourlink.appointment.enums.AppointmentStatus;
import com.hourlink.helprequest.enums.RequestStatus;
import com.hourlink.common.exception.BadRequestException;
import java.util.Arrays;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private static final String ROLE_USER = "ROLE_USER";
    private static final String ROLE_ORGANIZATION = "ROLE_ORGANIZATION";
    private static final String ROLE_ADMIN = "ROLE_ADMIN";
    private static final Set<String> BUSINESS_ROLES = Set.of(ROLE_USER, ROLE_ORGANIZATION);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final UserAdminActionRepository userAdminActionRepository;
    private final AppointmentRepository appointmentRepository;
    private final HelpRequestRepository helpRequestRepository;
    private final EmailService emailService;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final CloudinaryService cloudinaryService;
    private final WalletService walletService;

    @Transactional(readOnly = true)
    public Page<AdminUserResponse> getUsers(String name, String email, String phone, String userType, Boolean locked, Boolean verified, Pageable pageable) {
        Specification<User> spec = Specification.where((root, query, cb) -> {
            Subquery<UUID> subquery = query.subquery(UUID.class);
            Root<UserRole> subRoot = subquery.from(UserRole.class);
            Join<UserRole, Role> roleJoin = subRoot.join("role", JoinType.INNER);
            subquery.select(subRoot.get("user").get("id"))
                    .where(cb.equal(roleJoin.get("roleCode"), "ROLE_ADMIN"));
            return cb.not(root.get("id").in(subquery));
        });

        if (name != null && !name.trim().isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("fullName")), "%" + name.toLowerCase().trim() + "%"));
        }
        if (email != null && !email.trim().isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("email")), "%" + email.toLowerCase().trim() + "%"));
        }
        if (phone != null && !phone.trim().isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("phone")), "%" + phone.toLowerCase().trim() + "%"));
        }
        if (userType != null && !userType.trim().isEmpty()) {
            try {
                com.hourlink.user.enums.UserType type = com.hourlink.user.enums.UserType.valueOf(userType.toLowerCase());
                spec = spec.and((root, query, cb) -> cb.equal(root.get("userType"), type));
            } catch (IllegalArgumentException e) {
                // Ignore invalid userType
            }
        }
        if (locked != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("isLocked"), locked));
        }
        if (verified != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("isVerified"), verified));
        }
        
        // Exclude soft-deleted users from main list unless specified
        spec = spec.and((root, query, cb) -> cb.isFalse(root.get("isDeleted")));

        return userRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public AdminUserDetailResponse getUserDetail(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<UserAdminAction> actions = userAdminActionRepository.findByUserIdOrderByCreatedAtDesc(id);

        List<AdminUserDetailResponse.UserAdminActionDto> actionDtos = actions.stream()
                .map(a -> AdminUserDetailResponse.UserAdminActionDto.builder()
                        .actionType(a.getActionType())
                        .reason(a.getReason())
                        .adminName(a.getAdmin().getFullName())
                        .createdAt(a.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return AdminUserDetailResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .userType(user.getUserType())
                .region(user.getRegion())
                .occupation(user.getOccupation())
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .isVerified(user.isVerified())
                .isLocked(user.isLocked())
                .isDeleted(user.isDeleted())
                .reputationScore(user.getReputationScore())
                .completedSessions(user.getCompletedSessions())
                .cancelRate(user.getCancelRate())
                .adminNotes(user.getAdminNotes())
                .warningCount(user.getWarningCount())
                .createdAt(user.getCreatedAt())
                .adminActions(actionDtos)
                .build();
    }

    @Transactional
    public void updateUserNotes(UUID id, AdminNoteUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setAdminNotes(request.getAdminNotes());
        userRepository.save(user);
    }

    @Transactional
    public void performAction(UUID id, UserActionRequest request, String adminEmail) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (userRoleRepository.existsByUser_IdAndRole_RoleCode(id, ROLE_ADMIN)) {
            throw new BadRequestException("Không thể cảnh cáo, khóa hoặc xóa tài khoản quản trị viên");
        }
        
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        switch (request.getActionType().toUpperCase()) {
            case "WARN":
                user.setWarningCount(user.getWarningCount() + 1);
                emailService.sendWarningEmail(user.getEmail(), user.getFullName(), user.getWarningCount(), request.getReason());
                break;
            case "LOCK":
                user.setLocked(true);
                break;
            case "UNLOCK":
                user.setLocked(false);
                break;
            case "SOFT_DELETE":
                boolean hasActiveAppointments = appointmentRepository.hasActiveAppointments(user.getId(), Arrays.asList(
                        AppointmentStatus.PENDING,
                        AppointmentStatus.CONFIRMED,
                        AppointmentStatus.UPCOMING,
                        AppointmentStatus.IN_PROGRESS,
                        AppointmentStatus.DISPUTED,
                        AppointmentStatus.RESCHEDULED
                ));
                if (hasActiveAppointments) {
                    throw new BadRequestException("Không thể xoá tài khoản vì người dùng đang có lịch hẹn chưa hoàn tất hoặc đang tranh chấp.");
                }

                boolean hasActiveRequests = helpRequestRepository.hasActiveRequests(user.getId(), Arrays.asList(
                        RequestStatus.SEARCHING,
                        RequestStatus.ASSIGNED
                ));
                if (hasActiveRequests) {
                    throw new BadRequestException("Không thể xoá tài khoản vì người dùng đang có yêu cầu hỗ trợ chưa hoàn tất.");
                }

                user.setDeleted(true);
                break;
            default:
                throw new IllegalArgumentException("Unknown action type");
        }

        userRepository.save(user);

        UserAdminAction action = UserAdminAction.builder()
                .user(user)
                .admin(admin)
                .actionType(request.getActionType().toUpperCase())
                .reason(request.getReason())
                .build();
        userAdminActionRepository.save(action);
    }

    @Transactional
    public void createUser(AdminCreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email đã được sử dụng");
        }
        if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
            if (userRepository.existsByPhone(request.getPhone())) {
                throw new BadRequestException("Số điện thoại đã được sử dụng");
            }
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .userType(request.getUserType())
                .region(request.getRegion())
                .occupation(request.getOccupation())
                .avatarUrl(request.getAvatarUrl())
                .bio(request.getBio())
                .isVerified(true) // Admin creates, so it's verified
                .build();

        user = userRepository.save(user);

        synchronizeBusinessRole(user, request.getUserType());
        walletService.initWallet(user);
    }

    @Transactional
    public void updateUser(UUID id, AdminUpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (userRoleRepository.existsByUser_IdAndRole_RoleCode(id, ROLE_ADMIN)) {
            throw new BadRequestException("Không thể thay đổi loại tài khoản quản trị viên tại màn người dùng");
        }

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new BadRequestException("Email đã được sử dụng");
            }
            user.setEmail(request.getEmail());
        }

        user.setFullName(request.getFullName());

        if (request.getPhone() != null && !request.getPhone().equals(user.getPhone())) {
            if (userRepository.existsByPhone(request.getPhone())) {
                throw new BadRequestException("Số điện thoại đã được sử dụng");
            }
            user.setPhone(request.getPhone());
        }
        user.setUserType(request.getUserType());
        user.setRegion(request.getRegion());
        user.setOccupation(request.getOccupation());
        user.setAvatarUrl(request.getAvatarUrl());
        user.setBio(request.getBio());
        
        if (request.getIsVerified() != null) {
            user.setVerified(request.getIsVerified());
        }

        user = userRepository.save(user);
        synchronizeBusinessRole(user, request.getUserType());
    }

    public String uploadAvatar(MultipartFile file) {
        try {
            Map<String, Object> uploadResult = cloudinaryService.uploadFile(file, "avatars");
            return (String) uploadResult.get("secure_url");
        } catch (IOException e) {
            throw new RuntimeException("Lỗi upload file: " + e.getMessage());
        }
    }

    @Transactional
    public void resetPassword(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (userRoleRepository.existsByUser_IdAndRole_RoleCode(userId, ROLE_ADMIN)) {
            throw new BadRequestException("Không thể đặt lại mật khẩu tài khoản quản trị viên");
        }

        // Generate a secure random password: 2 uppercase + 2 digits + 4 lowercase + 1 special
        String newPassword = generateRandomPassword();

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Send email async
        emailService.sendResetPasswordEmail(user.getEmail(), user.getFullName(), newPassword);
    }

    private String generateRandomPassword() {
        String upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        String lower = "abcdefghjkmnpqrstuvwxyz";
        String digits = "23456789";
        String special = "@#$%&*";

        StringBuilder sb = new StringBuilder();
        // 2 uppercase
        for (int i = 0; i < 2; i++) sb.append(upper.charAt(SECURE_RANDOM.nextInt(upper.length())));
        // 2 digits
        for (int i = 0; i < 2; i++) sb.append(digits.charAt(SECURE_RANDOM.nextInt(digits.length())));
        // 4 lowercase
        for (int i = 0; i < 4; i++) sb.append(lower.charAt(SECURE_RANDOM.nextInt(lower.length())));
        // 1 special
        sb.append(special.charAt(SECURE_RANDOM.nextInt(special.length())));

        // Fisher-Yates shuffle using the same cryptographically secure source.
        char[] chars = sb.toString().toCharArray();
        for (int i = chars.length - 1; i > 0; i--) {
            int j = SECURE_RANDOM.nextInt(i + 1);
            char current = chars[i];
            chars[i] = chars[j];
            chars[j] = current;
        }
        return new String(chars);
    }

    /** Đồng bộ loại tài khoản nghiệp vụ với authority mà Backend thực sự kiểm tra. */
    private void synchronizeBusinessRole(User user, com.hourlink.user.enums.UserType userType) {
        String targetRoleCode = userType == com.hourlink.user.enums.UserType.organization
                ? ROLE_ORGANIZATION
                : ROLE_USER;
        Role targetRole = roleRepository.findByRoleCode(targetRoleCode)
                .orElseThrow(() -> new BadRequestException("Hệ thống chưa khởi tạo quyền " + targetRoleCode));

        userRoleRepository.deleteByUserIdAndRoleCodes(user.getId(), BUSINESS_ROLES);
        userRoleRepository.save(UserRole.builder()
                .user(user)
                .role(targetRole)
                .build());
    }

    private AdminUserResponse mapToResponse(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .userType(user.getUserType())
                .isVerified(user.isVerified())
                .isLocked(user.isLocked())
                .isDeleted(user.isDeleted())
                .reputationScore(user.getReputationScore())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
