package com.hourlink.admin.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * AdminCategoryRequest — Yêu cầu cập nhật tên/mô tả danh mục kỹ năng.
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminCategoryRequest {

    @NotBlank(message = "Tên danh mục không được để trống")
    @Size(max = 100, message = "Tên danh mục tối đa 100 ký tự")
    String name;

    @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
    String description;
}
