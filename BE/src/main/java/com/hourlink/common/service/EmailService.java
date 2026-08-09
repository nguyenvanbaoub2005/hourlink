package com.hourlink.common.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:your_email@gmail.com}")
    private String fromEmail;

    @Async
    public void sendWarningEmail(String toEmail, String fullName, int warningCount, String reason) {
        log.info("Starting async thread to send warning email to {}", toEmail);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("[HourLink] Thông báo quan trọng về tài khoản của bạn");

            String htmlContent = String.format(
                    "<div style=\"font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);\">"
                            +
                            "  <!-- Header -->" +
                            "  <div style=\"background: linear-gradient(135deg, #10b981, #059669); padding: 25px; text-align: center; color: white;\">"
                            +
                            "    <h1 style=\"margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;\">HourLink</h1>"
                            +
                            "    <p style=\"margin: 5px 0 0 0; font-size: 13px; font-weight: 500; opacity: 0.9;\">Nền Tảng Trao Đổi Kỹ Năng Bằng Tín Dụng Thời Gian</p>"
                            +
                            "  </div>" +
                            "  <!-- Body -->" +
                            "  <div style=\"padding: 30px; background-color: #ffffff;\">" +
                            "    <p style=\"font-size: 16px; color: #1a202c; margin-top: 0;\">Xin chào <strong>%s</strong>,</p>"
                            +
                            "    <p style=\"font-size: 14px; color: #4a5568; line-height: 1.6;\">Chúng tôi viết thư này để thông báo về việc tài khoản của bạn đã vi phạm điều khoản sử dụng hoặc tiêu chuẩn cộng đồng của hệ thống HourLink.</p>"
                            +
                            "    " +
                            "    <!-- Chi tiết lý do -->" +
                            "    <div style=\"background-color: #f8fafc; border-left: 4px solid #ef4444; padding: 18px; margin: 25px 0; border-radius: 0 8px 8px 0;\">"
                            +
                            "      <p style=\"margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #ef4444;\">Lý do từ Ban quản trị:</p>"
                            +
                            "      <p style=\"margin: 0; font-size: 14px; color: #334155; line-height: 1.5; font-style: italic;\">\"%s\"</p>"
                            +
                            "    </div>" +
                            "    " +
                            "    <p style=\"font-size: 14px; color: #4a5568; line-height: 1.6;\">Đây là lần cảnh cáo thứ <strong>%d</strong> của bạn.</p>"
                            +
                            "    <p style=\"font-size: 13px; color: #991b1b; background-color: #fef2f2; padding: 12px 16px; border-radius: 8px; font-weight: 600; line-height: 1.5;\">"
                            +
                            "      Lưu ý quan trọng: Nếu tài khoản bị cảnh cáo quá 3 lần, hệ thống sẽ tự động vô hiệu hoá quyền truy cập của bạn vĩnh viễn nhằm đảm bảo môi trường trao đổi kỹ năng an toàn."
                            +
                            "    </p>" +
                            "    " +
                            "    <div style=\"margin-top: 30px; text-align: center;\">" +
                            "      <a href=\"#\" style=\"display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 8px; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);\">Truy cập website HourLink</a>"
                            +
                            "    </div>" +
                            "  </div>" +
                            "  <!-- Footer -->" +
                            "  <div style=\"background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;\">"
                            +
                            "    <p style=\"margin: 0; font-size: 12px; color: #94a3b8;\">Đây là email tự động gửi từ Ban Quản trị hệ thống HourLink.</p>"
                            +
                            "    <p style=\"margin: 5px 0 0 0; font-size: 12px; color: #94a3b8;\">Mọi thắc mắc xin vui lòng gửi về hòm thư: <a href=\"mailto:support@hourlink.vn\" style=\"color: #10b981; text-decoration: none;\">support@hourlink.vn</a></p>"
                            +
                            "  </div>" +
                            "</div>",
                    fullName, reason, warningCount);

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Warning email successfully sent to {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send warning email to {}", toEmail, e);
        }
    }

    @Async
    public void sendResetPasswordEmail(String toEmail, String fullName, String newPassword) {
        log.info("Sending reset password email to {}", toEmail);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("[HourLink] Mật khẩu tài khoản của bạn đã được cấp lại");

            String htmlContent = String.format(
                "<div style=\"font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);\">" +
                "  <!-- Header -->" +
                "  <div style=\"background: linear-gradient(135deg, #10b981, #059669); padding: 25px; text-align: center; color: white;\">" +
                "    <h1 style=\"margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;\">HourLink</h1>" +
                "    <p style=\"margin: 5px 0 0 0; font-size: 13px; font-weight: 500; opacity: 0.9;\">Nền Tảng Trao Đổi Kỹ Năng Bằng Tín Dụng Thời Gian</p>" +
                "  </div>" +
                "  <!-- Body -->" +
                "  <div style=\"padding: 30px; background-color: #ffffff;\">" +
                "    <p style=\"font-size: 16px; color: #1a202c; margin-top: 0;\">Xin chào <strong>%s</strong>,</p>" +
                "    <p style=\"font-size: 14px; color: #4a5568; line-height: 1.6;\">Quản trị viên hệ thống HourLink vừa cấp lại mật khẩu cho tài khoản của bạn. Vui lòng đăng nhập bằng mật khẩu tạm thời dưới đây:</p>" +
                "    <div style=\"background-color: #f0fdf4; border: 2px dashed #10b981; padding: 20px; margin: 25px 0; border-radius: 10px; text-align: center;\">" +
                "      <p style=\"margin: 0 0 6px 0; font-size: 13px; color: #6b7280; font-weight: 500;\">Mật khẩu tạm thời của bạn</p>" +
                "      <p style=\"margin: 0; font-size: 24px; font-weight: 800; color: #059669; letter-spacing: 3px; font-family: 'Courier New', monospace;\">%s</p>" +
                "    </div>" +
                "    <p style=\"font-size: 13px; color: #dc2626; background-color: #fef2f2; padding: 12px 16px; border-radius: 8px; font-weight: 600; line-height: 1.5;\">" +
                "      ⚠️ Vì lý do bảo mật, hãy đổi mật khẩu ngay sau khi đăng nhập thành công." +
                "    </p>" +
                "  </div>" +
                "  <!-- Footer -->" +
                "  <div style=\"background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;\">" +
                "    <p style=\"margin: 0; font-size: 12px; color: #94a3b8;\">Đây là email tự động gửi từ Ban Quản trị hệ thống HourLink.</p>" +
                "  </div>" +
                "</div>",
                fullName, newPassword
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Reset password email successfully sent to {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send reset password email to {}", toEmail, e);
        }
    }

    @Async
    public void sendSkillWarningEmail(String toEmail, String fullName, String skillName, int warningCount, String reason) {
        log.info("Sending skill warning email to {}", toEmail);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("[HourLink] Cảnh báo kỹ năng vi phạm");

            String htmlContent = String.format(
                "<div style=\"font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);\">" +
                "  <div style=\"padding: 30px; background-color: #ffffff;\">" +
                "    <p style=\"font-size: 16px; color: #1a202c; margin-top: 0;\">Xin chào <strong>%s</strong>,</p>" +
                "    <p style=\"font-size: 14px; color: #4a5568; line-height: 1.6;\">Chúng tôi viết thư này để thông báo về việc kỹ năng <strong>%s</strong> của bạn đã vi phạm điều khoản.</p>" +
                "    <div style=\"background-color: #f8fafc; border-left: 4px solid #ef4444; padding: 18px; margin: 25px 0; border-radius: 0 8px 8px 0;\">" +
                "      <p style=\"margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #ef4444;\">Lý do từ Ban quản trị:</p>" +
                "      <p style=\"margin: 0; font-size: 14px; color: #334155; line-height: 1.5; font-style: italic;\">\"%s\"</p>" +
                "    </div>" +
                "    <p style=\"font-size: 14px; color: #4a5568; line-height: 1.6;\">Đây là lần cảnh cáo thứ <strong>%d</strong> của bạn.</p>" +
                "  </div>" +
                "</div>",
                fullName, skillName, reason, warningCount
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            log.error("Failed to send skill warning email to {}", toEmail, e);
        }
    }
}
