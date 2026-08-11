package com.hourlink.rating.service;

import com.hourlink.user.entity.Badge;
import com.hourlink.user.repository.BadgeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class BadgeDataSeeder implements CommandLineRunner {

    private final BadgeRepository badgeRepository;
    private final RatingService ratingService;

    @Override
    public void run(String... args) throws Exception {
        log.info("Checking and seeding Badge data...");

        List<Badge> defaultBadges = Arrays.asList(
            createBadge("SESSION_1", "Khởi đầu", "Đã hoàn thành 1 buổi hỗ trợ", "🌱", "SESSION_COUNT", 1),
            createBadge("SESSION_5", "Năng nổ", "Đã hoàn thành 5 buổi hỗ trợ", "🥉", "SESSION_COUNT", 2),
            createBadge("SESSION_10", "Gắn bó", "Đã hoàn thành 10 buổi hỗ trợ", "🥈", "SESSION_COUNT", 3),
            createBadge("SESSION_25", "Chuyên nghiệp", "Đã hoàn thành 25 buổi hỗ trợ", "🥇", "SESSION_COUNT", 4),
            createBadge("SESSION_50", "Chuyên gia", "Đã hoàn thành 50 buổi hỗ trợ", "💎", "SESSION_COUNT", 5),
            createBadge("TOP_RATED", "Được đánh giá cao", "Đánh giá trung bình 4.5 sao trở lên", "⭐", "RATING_SCORE", 1)
        );

        for (Badge b : defaultBadges) {
            Badge existing = badgeRepository.findByCode(b.getCode()).orElse(null);
            if (existing == null) {
                badgeRepository.save(b);
                log.info("Inserted new badge: {}", b.getCode());
            } else {
                // Update category and level if they are missing or different
                boolean needsUpdate = false;
                if (b.getCategory() != null && !b.getCategory().equals(existing.getCategory())) {
                    existing.setCategory(b.getCategory());
                    needsUpdate = true;
                }
                if (b.getLevel() != null && !b.getLevel().equals(existing.getLevel())) {
                    existing.setLevel(b.getLevel());
                    needsUpdate = true;
                }
                if (needsUpdate) {
                    badgeRepository.save(existing);
                    log.info("Updated category/level for badge: {}", b.getCode());
                }
            }
        }

        // Chạy cấp lại huy hiệu tự động cho tất cả user để ai bị miss sẽ được cấp bù.
        log.info("Running retroactive badge award process for all users...");
        ratingService.retroactiveAwardBadgesForAllUsers();
    }

    private Badge createBadge(String code, String name, String desc, String icon, String category, int level) {
        Badge b = new Badge();
        b.setCode(code);
        b.setName(name);
        b.setDescription(desc);
        b.setIconUrl(icon);
        b.setCategory(category);
        b.setLevel(level);
        return b;
    }
}
