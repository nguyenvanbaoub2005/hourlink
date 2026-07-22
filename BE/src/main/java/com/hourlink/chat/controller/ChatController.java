package com.hourlink.chat.controller;

import com.hourlink.common.response.ApiResponse;
import com.hourlink.chat.service.ChatService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

/**
 * ChatController — TODO: implement endpoints cho module chat.
 */
@Tag(name = "Chat Management")
@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatController {

    ChatService chatService;

    // TODO: thêm các endpoints
}
