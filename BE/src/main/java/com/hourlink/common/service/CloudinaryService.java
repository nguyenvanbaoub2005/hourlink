package com.hourlink.common.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

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
        return uploadFile(file, folder, contentType.startsWith("image/"));
    }

    /**
     * Upload với loại tài nguyên đã được tầng nghiệp vụ xác thực. Cách này xử
     * lý đúng file ảnh mà thiết bị gửi lên dưới MIME application/octet-stream.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> uploadFile(MultipartFile file, String folder,
                                          boolean isImage) throws IOException {

        Map<String, Object> options = isImage
                ? ObjectUtils.asMap(
                        "folder", folder,
                        "resource_type", "image",
                        "use_filename", true,
                        "unique_filename", true,
                        "overwrite", false)
                : ObjectUtils.asMap(
                        "folder", folder,
                        "resource_type", "raw",
                        // Cloudinary yêu cầu public_id của raw asset có phần mở
                        // rộng. MultipartFile được chuyển thành byte[] nên phải
                        // gắn public_id rõ ràng để URL tải xuống vẫn có .pdf/.docx.
                        "public_id", rawPublicId(file),
                        "overwrite", false);

        return (Map<String, Object>) cloudinary.uploader().upload(file.getBytes(), options);
    }

    String rawPublicId(MultipartFile file) {
        String originalName = file.getOriginalFilename() != null
                ? file.getOriginalFilename().replace('\\', '/') : "";
        int slash = originalName.lastIndexOf('/');
        if (slash >= 0) originalName = originalName.substring(slash + 1);
        int dot = originalName.lastIndexOf('.');
        String extensionFromName = dot >= 0
                ? originalName.substring(dot).toLowerCase(Locale.ROOT) : "";
        String extensionFromMime = extensionForContentType(file.getContentType());
        String extension = !".bin".equals(extensionFromMime)
                ? extensionFromMime : extensionFromName;
        if (!extension.matches("\\.[a-z0-9]{1,10}")) {
            extension = ".bin";
        }
        return "file_" + UUID.randomUUID() + extension;
    }

    private String extensionForContentType(String contentType) {
        String normalized = contentType != null
                ? contentType.split(";", 2)[0].trim().toLowerCase(Locale.ROOT) : "";
        return switch (normalized) {
            case "application/pdf" -> ".pdf";
            case "application/msword" -> ".doc";
            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document" -> ".docx";
            case "application/vnd.ms-powerpoint" -> ".ppt";
            case "application/vnd.openxmlformats-officedocument.presentationml.presentation" -> ".pptx";
            default -> ".bin";
        };
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
