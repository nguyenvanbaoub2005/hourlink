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
public class AssignPracticeRequest {

    @NotBlank(message = "Tiêu đề bài thực hành không được để trống")
    @Size(max = 255, message = "Tiêu đề tối đa 255 ký tự")
    String assignmentTitle;

    @NotBlank(message = "Tình huống / đề bài thực hành không được để trống")
    @Size(max = 3000, message = "Tình huống thực hành tối đa 3000 ký tự")
    String scenarioPrompt;

    @Size(max = 2000, message = "Tiêu chí đánh giá tối đa 2000 ký tự")
    String practiceCriteria;
}
