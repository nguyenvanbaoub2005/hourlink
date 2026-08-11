package com.hourlink.community.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class MarkParticipantsAbsentRequest {

    @NotEmpty(message = "Vui lòng chọn ít nhất một người vắng mặt")
    private List<@NotNull UUID> participantIds;

    @Size(max = 500, message = "Lý do tối đa 500 ký tự")
    private String reason;
}
