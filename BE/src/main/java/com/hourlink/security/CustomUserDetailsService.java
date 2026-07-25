package com.hourlink.security;

import com.hourlink.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * CustomUserDetailsService — Kiểm tra user còn tồn tại và không bị khóa trong DB.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService {

    private final UserRepository userRepository;

    /**
     * Kiểm tra user tồn tại và không bị khóa.
     */
    public boolean isUserActive(String email) {
        return userRepository.findByEmail(email)
                .map(u -> !u.isLocked())
                .orElse(false);
    }
}
