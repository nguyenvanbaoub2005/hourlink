package com.hourlink.common.exception;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void appException_returnsSpecificBusinessMessage() {
        var response = handler.handleAppException(new AppException(
                ErrorCode.INVALID_REQUEST,
                "Hai bạn đang có một lịch hẹn chưa kết thúc."));

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Hai bạn đang có một lịch hẹn chưa kết thúc.",
                response.getBody().getMessage());
    }

    @Test
    void appException_withoutCustomMessage_returnsDefaultMessage() {
        var response = handler.handleAppException(new AppException(ErrorCode.INVALID_REQUEST));

        assertEquals("Yêu cầu không hợp lệ", response.getBody().getMessage());
    }
}
