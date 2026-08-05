package com.hourlink.community.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ParticipantConfirmRequest {
    
    @NotNull(message = "Số giờ đóng góp không được để trống")
    @Min(value = 0, message = "Số giờ đóng góp không được âm")
    Double contributionHours;
}
