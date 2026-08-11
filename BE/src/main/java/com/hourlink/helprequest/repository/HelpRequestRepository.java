package com.hourlink.helprequest.repository;

import com.hourlink.helprequest.entity.HelpRequest;
import com.hourlink.helprequest.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface HelpRequestRepository extends JpaRepository<HelpRequest, UUID>, JpaSpecificationExecutor<HelpRequest> {
    List<HelpRequest> findAllByRequester_EmailAndStatusNotOrderByCreatedAtDesc(
            String email, RequestStatus excludedStatus);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(hr) > 0 FROM HelpRequest hr WHERE hr.requester.id = :userId AND hr.status IN :statuses")
    boolean hasActiveRequests(@org.springframework.data.repository.query.Param("userId") UUID userId, @org.springframework.data.repository.query.Param("statuses") java.util.List<com.hourlink.helprequest.enums.RequestStatus> statuses);
}
