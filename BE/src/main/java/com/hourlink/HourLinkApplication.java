package com.hourlink;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync        // Cho phép gửi mail async
@EnableScheduling   // Cho phép cron jobs (cleanup OTP, snapshot stat...)
public class HourLinkApplication {

    public static void main(String[] args) {
        SpringApplication.run(HourLinkApplication.class, args);
    }
}
