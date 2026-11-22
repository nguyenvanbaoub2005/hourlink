package com.hourlink.practice.enums;

public enum PracticeStatus {
    /** Người hướng dẫn vừa giao bài thực hành kỹ năng mềm */
    ASSIGNED,
    /** Người học đã nộp bài thu hoạch / tình huống giải quyết */
    SUBMITTED,
    /** Người hướng dẫn đã chấm Đạt (>= 5.0/10) và hệ thống đã cấp Chứng nhận kỹ năng số */
    PASSED,
    /** Người hướng dẫn chấm cần cải thiện thêm (< 5.0/10) để nộp lại */
    NEEDS_REVISION
}
