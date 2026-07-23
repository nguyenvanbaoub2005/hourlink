package com.hourlink.chat.repository;

import com.hourlink.chat.entity.UserBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface UserBlockRepository extends JpaRepository<UserBlock, UUID> {
    // TODO: thêm custom queries
}
