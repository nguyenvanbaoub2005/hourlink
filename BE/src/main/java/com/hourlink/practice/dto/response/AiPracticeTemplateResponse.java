package com.hourlink.practice.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AiPracticeTemplateResponse {

    String skillCategory;
    String assignmentTitle;
    String scenarioPrompt;
    String practiceCriteria;
}
