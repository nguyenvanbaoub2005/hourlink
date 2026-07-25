package com.hourlink.common.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * CloudinaryService — Xử lý upload và xoá file trên Cloudinary.
 * Hỗ trợ ảnh (image/*) và tài liệu (pdf, docx...).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    /**
     * Upload một file lên Cloudinary.
     *
     * @param file   MultipartFile nhận từ request
     * @param folder Thư mục lưu trên Cloudinary (VD: "skill_attachments")
     * @return Map chứa thông tin file đã upload (url, public_id, bytes, resource_type...)
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> uploadFile(MultipartFile file, String folder) throws IOException {
        String contentType = file.getContentType() != null ? file.getContentType() : "";
        boolean isImage = contentType.startsWith("image/");

        Map<String, Object> options = ObjectUtils.asMap(
                "folder", folder,
                "resource_type", isImage ? "image" : "raw",
                "use_filename", true,
                "unique_filename", true,
                "overwrite", false
        );

        return (Map<String, Object>) cloudinary.uploader().upload(file.getBytes(), options);
    }

    /**
     * Xoá một file khỏi Cloudinary theo public ID.
     *
     * @param publicId   Public ID của file cần xoá
     * @param isImage    true nếu là ảnh, false nếu là tài liệu (raw)
     */
    public void deleteFile(String publicId, boolean isImage) {
        try {
            Map<String, Object> options = ObjectUtils.asMap(
                    "resource_type", isImage ? "image" : "raw"
            );
            cloudinary.uploader().destroy(publicId, options);
        } catch (IOException e) {
            log.error("Lỗi khi xoá file trên Cloudinary: publicId={}, error={}", publicId, e.getMessage());
        }
    }
}
