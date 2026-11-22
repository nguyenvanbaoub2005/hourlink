package com.hourlink.aichat.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FaqFallbackTest {

    @Test
    void answersTimeCreditQuestionsEvenWithoutAccents() {
        assertTrue(FaqFallback.answer("Time Credit là gì?").contains("giờ tín dụng"));
        assertTrue(FaqFallback.answer("gio tin dung la gi").contains("giờ tín dụng"));
    }

    @Test
    void routesToTheRightTopic() {
        assertTrue(FaqFallback.answer("Cách đăng yêu cầu hỗ trợ?").contains("Đăng bài"));
        assertTrue(FaqFallback.answer("AI gợi ý người hỗ trợ thế nào?").contains("60%"));
        assertTrue(FaqFallback.answer("Quy trình xác nhận buổi học?").contains("QR"));
        assertTrue(FaqFallback.answer("làm sao để báo cáo người dùng").contains("Báo cáo"));
    }

    @Test
    void shortKeywordsMatchWholeWordsOnly() {
        String unrelated = FaqFallback.answer("đi vivu cuối tuần");
        assertTrue(unrelated.startsWith("Mình là Trợ lý HourLink"));
        assertTrue(FaqFallback.answer("Ví của tôi").contains("giờ tín dụng"));
    }

    @Test
    void unknownQuestionFallsBackToDefaultIntro() {
        assertEquals(FaqFallback.answer("hôm nay trời đẹp"), FaqFallback.answer("xyz abc"));
    }
}
