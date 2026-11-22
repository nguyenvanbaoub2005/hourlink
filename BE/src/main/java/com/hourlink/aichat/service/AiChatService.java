package com.hourlink.aichat.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.hourlink.aichat.dto.ChatStreamRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Stream;

/**
 * Trợ lý AI của HourLink — gọi Gemini (streamGenerateContent, alt=sse) rồi
 * đẩy từng đoạn token về client qua Server-Sent Events.
 *
 * API key nằm ở backend (biến môi trường GEMINI_API_KEY) nên không lộ ra app.
 * Khi chưa cấu hình key, service trả lời bằng bộ FAQ nội bộ (vẫn stream) để demo không bị gián đoạn.
 */
@Slf4j
@Service
public class AiChatService {

    static final String SYSTEM_PROMPT = """
            Bạn là "Trợ lý HourLink" — chatbot hỗ trợ người dùng ứng dụng HourLink, nền tảng trao đổi kỹ năng
            bằng Time Credit (giờ tín dụng), không dùng tiền mặt.
            Kiến thức nền:
            - Người dùng đăng Yêu cầu hỗ trợ (kỹ năng cần học); AI phân loại danh mục và gợi ý người hỗ trợ
              phù hợp theo độ khớp ngữ nghĩa 60%, lịch rảnh 20%, uy tín 20%.
            - Người hỗ trợ đăng Kỹ năng (mô tả, trình độ, hình thức Online/Offline, lịch rảnh).
            - Lịch hẹn được xác nhận bắt đầu bằng mã QR hoặc OTP; sau buổi học Time Credit được chuyển
              cho người hỗ trợ, hai bên đánh giá nhau 1–5 sao ảnh hưởng điểm uy tín.
            - Có chat 1-1, hoạt động cộng đồng (tổ chức xác nhận minh chứng rồi cộng giờ), báo cáo/chặn người dùng.
            Quy tắc trả lời: tiếng Việt, ngắn gọn, thân thiện, dùng gạch đầu dòng khi liệt kê các bước.
            Chỉ trả lời về HourLink và học/trao đổi kỹ năng; câu hỏi ngoài phạm vi thì lịch sự từ chối.
            Không bịa tính năng không có; nếu không chắc hãy nói chưa rõ và gợi ý xem mục Trợ giúp & FAQ.
            """;

    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.0-flash}")
    private String model;

    @Value("${gemini.base-url:https://generativelanguage.googleapis.com/v1beta}")
    private String baseUrl;

    /** SSE sống tối đa 2 phút cho một câu trả lời. */
    public SseEmitter stream(ChatStreamRequest request) {
        SseEmitter emitter = new SseEmitter(120_000L);
        emitter.onTimeout(emitter::complete);
        executor.execute(() -> run(request, emitter));
        return emitter;
    }

    private void run(ChatStreamRequest request, SseEmitter emitter) {
        try {
            if (apiKey == null || apiKey.isBlank()) {
                streamFallback(request, emitter);
            } else {
                streamFromGemini(request, emitter);
            }
            emitter.send(SseEmitter.event().name("done").data("[DONE]"));
            emitter.complete();
        } catch (Exception e) {
            log.warn("AI chat stream lỗi: {}", e.getMessage());
            try {
                emitter.send(SseEmitter.event().name("error")
                        .data("Trợ lý AI đang bận, bạn vui lòng thử lại sau ít phút."));
            } catch (IOException ignored) {
                // client đã ngắt kết nối
            }
            emitter.complete();
        }
    }

    // ───────────── Gemini ─────────────

    private void streamFromGemini(ChatStreamRequest request, SseEmitter emitter) throws Exception {
        String url = "%s/models/%s:streamGenerateContent?alt=sse".formatted(baseUrl, model);
        HttpRequest httpRequest = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(90))
                .header("Content-Type", "application/json")
                .header("x-goog-api-key", apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(buildBody(request)))
                .build();

        HttpResponse<Stream<String>> response =
                httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofLines());
        if (response.statusCode() != 200) {
            response.body().close();
            throw new IllegalStateException("Gemini trả về HTTP " + response.statusCode());
        }
        try (Stream<String> lines = response.body()) {
            for (var it = lines.iterator(); it.hasNext(); ) {
                String text = extractText(it.next());
                if (!text.isEmpty()) {
                    emitter.send(SseEmitter.event().name("token").data(text));
                }
            }
        }
    }

    String buildBody(ChatStreamRequest request) throws IOException {
        ObjectNode root = mapper.createObjectNode();
        root.putObject("systemInstruction").putArray("parts").addObject().put("text", SYSTEM_PROMPT);
        ArrayNode contents = root.putArray("contents");
        for (ChatStreamRequest.Message m : request.messages()) {
            ObjectNode content = contents.addObject();
            content.put("role", m.role());
            content.putArray("parts").addObject().put("text", m.content());
        }
        root.putObject("generationConfig").put("temperature", 0.4).put("maxOutputTokens", 700);
        return mapper.writeValueAsString(root);
    }

    /** Một dòng SSE của Gemini có dạng: data: {"candidates":[{"content":{"parts":[{"text":"..."}]}}]} */
    String extractText(String line) {
        if (line == null || !line.startsWith("data:")) {
            return "";
        }
        String json = line.substring(5).trim();
        if (json.isEmpty()) {
            return "";
        }
        try {
            JsonNode parts = mapper.readTree(json).path("candidates").path(0).path("content").path("parts");
            StringBuilder sb = new StringBuilder();
            for (JsonNode part : parts) {
                sb.append(part.path("text").asText(""));
            }
            return sb.toString();
        } catch (IOException e) {
            return "";
        }
    }

    // ───────────── Fallback khi chưa có GEMINI_API_KEY ─────────────

    private void streamFallback(ChatStreamRequest request, SseEmitter emitter) throws Exception {
        List<ChatStreamRequest.Message> messages = request.messages();
        String question = messages.get(messages.size() - 1).content();
        String answer = FaqFallback.answer(question);
        // Cắt theo từ để giữ trải nghiệm "gõ dần" giống LLM thật
        for (String word : answer.split("(?<=\\s)")) {
            emitter.send(SseEmitter.event().name("token").data(word));
            Thread.sleep(25);
        }
    }
}
