package com.hourlink.skill.entity;

import com.hourlink.common.entity.BaseEntity;
import com.hourlink.skill.enums.SessionFormat;
import com.hourlink.skill.enums.SkillLevel;
import com.hourlink.skill.enums.SkillStatus;
import com.hourlink.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "skill")
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Skill extends BaseEntity {

    @Column(name = "name", nullable = false, length = 150)
    String name;

    @Column(name = "description", columnDefinition = "TEXT")
    String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "level", length = 50)
    SkillLevel level;

    @Enumerated(EnumType.STRING)
    @Column(name = "format", length = 50)
    SessionFormat format;

    @Column(name = "duration")
    Integer duration;

    @Column(name = "free_time", length = 200)
    String freeTime; // Thời gian rảnh có thể dạy

    @Column(name = "region", length = 200)
    String region;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    SkillStatus status = SkillStatus.VISIBLE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    SkillCategory category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;
}
