package com.hourlink.helprequest.entity;

import com.hourlink.common.entity.BaseEntity;
import com.hourlink.helprequest.enums.RequestStatus;
import com.hourlink.skill.entity.SkillCategory;
import com.hourlink.skill.enums.SessionFormat;
import com.hourlink.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "help_request")
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class HelpRequest extends BaseEntity {

    @Column(name = "title", nullable = false, length = 255)
    String title;

    @Column(name = "description", columnDefinition = "TEXT")
    String description;

    @Column(name = "current_level", length = 100)
    String currentLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "format", length = 50)
    SessionFormat format;

    @Column(name = "desired_time", length = 150)
    String desiredTime;

    @Column(name = "duration")
    Integer duration;

    @Column(name = "region", length = 200)
    String region;

    @Column(name = "time_credit_amount", nullable = false)
    @Builder.Default
    Double timeCreditAmount = 1.0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    RequestStatus status = RequestStatus.SEARCHING;

    @Column(name = "response_count", nullable = false)
    @Builder.Default
    Integer responseCount = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    SkillCategory category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    User requester;
}
