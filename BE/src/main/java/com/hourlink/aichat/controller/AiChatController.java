package com.hourlink.aichat.controller;

import com.hourlink.aichat.dto.ChatStreamRequest;
import com.hourlink.aichat.service.AiChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Tag(name = "AI Chat (Gemini streaming)")
@RestController
@RequestMapping("/ai-chat")
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService aiChatService;

    /**
     * Stream câu trả lời của Trợ lý AI qua Server-Sent Events.
     * Event: "token" (đoạn text), "done" (kết thúc), "error" (lỗi).
     */
    @Operation(summary = "Hỏi Trợ lý AI HourLink — trả lời dạng streaming (SSE)")
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@Valid @RequestBody ChatStreamRequest request) {
        return aiChatService.stream(request);
    }
}
