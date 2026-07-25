package com.hourlink.helprequest.repository;

import com.hourlink.helprequest.entity.HelpRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface HelpRequestRepository extends JpaRepository<HelpRequest, UUID> {
    java.util.List<HelpRequest> findAllByRequester_Email(String email);
}
