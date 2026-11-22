package com.hourlink.aichat.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hourlink.aichat.dto.ChatStreamRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiChatServiceTest {

    private final AiChatService service = new AiChatService();
    private final ObjectMapper mapper = new ObjectMapper();
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void extractText_readsTextFromGeminiSseLine() {
        String line = "data: {\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"Xin chào\"},{\"text\":\" bạn\"}]}}]}";
        assertEquals("Xin chào bạn", service.extractText(line));
    }

    @Test
    void extractText_ignoresNonDataAndMalformedLines() {
        assertEquals("", service.extractText(null));
        assertEquals("", service.extractText(""));
        assertEquals("", service.extractText(": keep-alive"));
        assertEquals("", service.extractText("data:"));
        assertEquals("", service.extractText("data: {not json"));
        assertEquals("", service.extractText("data: {\"candidates\":[]}"));
    }

    @Test
    void buildBody_includesSystemPromptAndConversationRoles() throws Exception {
        ChatStreamRequest request = new ChatStreamRequest(List.of(
                new ChatStreamRequest.Message("user", "Time Credit là gì?"),
                new ChatStreamRequest.Message("model", "Là giờ tín dụng."),
                new ChatStreamRequest.Message("user", "Kiếm bằng cách nào?")));

        JsonNode body = mapper.readTree(service.buildBody(request));

        assertTrue(body.at("/systemInstruction/parts/0/text").asText().contains("HourLink"));
        assertEquals(3, body.get("contents").size());
        assertEquals("user", body.at("/contents/0/role").asText());
        assertEquals("model", body.at("/contents/1/role").asText());
        assertEquals("Kiếm bằng cách nào?", body.at("/contents/2/parts/0/text").asText());
        assertTrue(body.at("/generationConfig/maxOutputTokens").asInt() > 0);
    }

    @Test
    void buildBody_escapesSpecialCharactersSafely() throws Exception {
        String tricky = "Dấu \"ngoặc\" và \\ xuống\ndòng";
        ChatStreamRequest request = new ChatStreamRequest(List.of(new ChatStreamRequest.Message("user", tricky)));

        JsonNode body = mapper.readTree(service.buildBody(request));

        assertEquals(tricky, body.at("/contents/0/parts/0/text").asText());
    }

    @Test
    void request_validation_rejectsInvalidRoleEmptyListAndBlankContent() {
        assertTrue(validator.validate(new ChatStreamRequest(List.of(
                new ChatStreamRequest.Message("user", "ok")))).isEmpty());

        assertFalse(validator.validate(new ChatStreamRequest(List.of())).isEmpty());
        assertFalse(validator.validate(new ChatStreamRequest(List.of(
                new ChatStreamRequest.Message("system", "hack")))).isEmpty());
        assertFalse(validator.validate(new ChatStreamRequest(List.of(
                new ChatStreamRequest.Message("user", "  ")))).isEmpty());
    }
}
