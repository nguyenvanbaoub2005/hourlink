package com.hourlink.chat.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * FirebaseTokenResponse — Custom token để client đăng nhập Firebase và nghe
 * tin nhắn realtime (chức năng 9.10).
 */
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FirebaseTokenResponse {

    /** Firebase đã được cấu hình phía server hay chưa */
    Boolean enabled;

    /** Custom token — null khi enabled = false */
    String token;

    /** uid trên Firebase, chính là ID người dùng trong MySQL */
    String uid;
}
