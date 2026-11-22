package com.hourlink.aichat.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

/** Lịch sử hội thoại gửi lên trợ lý AI (message cuối cùng là câu hỏi mới của user). */
public record ChatStreamRequest(
        @NotEmpty @Size(max = 30) List<@Valid Message> messages
) {
    public record Message(
            @NotBlank @Pattern(regexp = "user|model", message = "role phải là 'user' hoặc 'model'") String role,
            @NotBlank @Size(max = 2000) String content
    ) {
    }
}
