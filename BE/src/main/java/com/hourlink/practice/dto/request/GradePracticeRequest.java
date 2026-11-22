package com.hourlink.practice.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GradePracticeRequest {

    @NotNull(message = "Vui lòng chấm điểm Giao tiếp & Diễn đạt")
    @DecimalMin(value = "1.0", message = "Điểm tối thiểu là 1.0")
    @DecimalMax(value = "10.0", message = "Điểm tối đa là 10.0")
    Double communicationScore;

    @NotNull(message = "Vui lòng chấm điểm Vận dụng & Xử lý tình huống")
    @DecimalMin(value = "1.0", message = "Điểm tối thiểu là 1.0")
    @DecimalMax(value = "10.0", message = "Điểm tối đa là 10.0")
    Double applicationScore;

    @NotNull(message = "Vui lòng chấm điểm Tư duy & Sự tự tin")
    @DecimalMin(value = "1.0", message = "Điểm tối thiểu là 1.0")
    @DecimalMax(value = "10.0", message = "Điểm tối đa là 10.0")
    Double confidenceScore;

    @Size(max = 2000, message = "Nhận xét tối đa 2000 ký tự")
    String mentorFeedback;
}
