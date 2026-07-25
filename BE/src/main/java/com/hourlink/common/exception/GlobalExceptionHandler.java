package com.hourlink.common.exception;
import com.hourlink.common.response.ApiResponse;

import com.fasterxml.jackson.databind.exc.InvalidFormatException;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.UUID;

@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    /** Xử lý lỗi nghiệp vụ (AppException) */
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<?>> handleAppException(AppException ex) {
        ErrorCode errorCode = ex.getErrorCode();
        return ResponseEntity
                .status(errorCode.getStatusCode())
                .body(ApiResponse.error(errorCode.getCode(), errorCode.getMessage()));
    }

    /** Xử lý lỗi validate (@NotNull, @Size, @Email...) */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handleValidation(MethodArgumentNotValidException ex) {
        String msg = ex.getFieldError() != null
                ? ex.getFieldError().getDefaultMessage()
                : "Dữ liệu không hợp lệ";
        return ResponseEntity.badRequest()
                .body(ApiResponse.error(400, msg));
    }

    /** Xử lý lỗi parse JSON (UUID sai format...) */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<?>> handleJsonParseError(HttpMessageNotReadableException ex) {
        String message = "Định dạng dữ liệu không hợp lệ";
        if (ex.getCause() instanceof InvalidFormatException ife
                && ife.getTargetType().equals(UUID.class)) {
            message = "UUID không đúng định dạng";
        }
        return ResponseEntity.badRequest().body(ApiResponse.error(400, message));
    }

    /** Lỗi không tìm thấy tài nguyên */
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleNotFound(NotFoundException ex) {
        return ResponseEntity.status(404)
                .body(ApiResponse.error(404, ex.getMessage()));
    }

    /** Lỗi nghiệp vụ không hợp lệ */
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<?>> handleBadRequest(BadRequestException ex) {
        return ResponseEntity.badRequest()
                .body(ApiResponse.error(400, ex.getMessage()));
    }

    /** Lỗi quyền truy cập */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<?>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(403)
                .body(ApiResponse.error(403, "Không có quyền truy cập"));
    }

    /** IllegalArgumentException */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<?>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest()
                .body(ApiResponse.error(400, ex.getMessage()));
    }

    /** Xử lý lỗi file quá lớn */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<?>> handleMaxUploadSize(MaxUploadSizeExceededException ex) {
        return ResponseEntity.badRequest()
                .body(ApiResponse.error(400, "Kích thước file quá lớn. Vui lòng chọn file dưới 20MB."));
    }

    /** Fallback — bắt tất cả lỗi chưa xử lý */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleGeneric(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.internalServerError()
                .body(ApiResponse.error(9999, "Lỗi hệ thống, vui lòng thử lại sau"));
    }
}
