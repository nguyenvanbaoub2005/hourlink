package com.hourlink.admin.dto.response;

import com.hourlink.helprequest.enums.RequestStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminHelpRequestResponse {
    UUID id;
    String title;
    RequestStatus status;
    String categoryName;
    UUID requesterId;
    String requesterFullName;
    String requesterEmail;
    String requesterAvatarUrl;
    Double timeCreditAmount;
    Instant createdAt;
}
