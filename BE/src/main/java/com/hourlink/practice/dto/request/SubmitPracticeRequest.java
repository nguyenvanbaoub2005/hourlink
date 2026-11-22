package com.hourlink.practice.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SubmitPracticeRequest {

    @NotBlank(message = "Nội dung bài thực hành / cách xử lý tình huống không được để trống")
    @Size(max = 4000, message = "Nội dung nộp tối đa 4000 ký tự")
    String submissionText;

    @Size(max = 500, message = "Đường dẫn minh chứng tối đa 500 ký tự")
    String submissionLink;
}
