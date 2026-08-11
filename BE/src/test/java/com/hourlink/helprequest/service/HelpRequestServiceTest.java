package com.hourlink.helprequest.service;

import com.hourlink.common.exception.AppException;
import com.hourlink.common.exception.ErrorCode;
import com.hourlink.helprequest.dto.request.HelpRequestRequest;
import com.hourlink.helprequest.entity.HelpRequest;
import com.hourlink.helprequest.enums.RequestStatus;
import com.hourlink.helprequest.repository.HelpRequestRepository;
import com.hourlink.skill.repository.SkillCategoryRepository;
import com.hourlink.user.entity.User;
import com.hourlink.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HelpRequestServiceTest {

    @Mock HelpRequestRepository helpRequestRepository;
    @Mock SkillCategoryRepository categoryRepository;
    @Mock UserRepository userRepository;

    HelpRequestService service;

    @BeforeEach
    void setUp() {
        service = new HelpRequestService(helpRequestRepository, categoryRepository, userRepository);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void deleteOwnedRequest_softDeletesSoLinkedHistoryIsPreserved() {
        User owner = authenticate("owner@hourlink.vn");
        HelpRequest request = helpRequest(owner, RequestStatus.SEARCHING);
        when(helpRequestRepository.findById(request.getId())).thenReturn(Optional.of(request));

        service.deleteHelpRequest(request.getId());

        assertEquals(RequestStatus.DELETED, request.getStatus());
        verify(helpRequestRepository).save(request);
        verify(helpRequestRepository, never()).delete(any(HelpRequest.class));
    }

    @Test
    void deleteOwnedRequest_isIdempotentWhenAlreadyDeleted() {
        User owner = authenticate("owner@hourlink.vn");
        HelpRequest request = helpRequest(owner, RequestStatus.DELETED);
        when(helpRequestRepository.findById(request.getId())).thenReturn(Optional.of(request));

        service.deleteHelpRequest(request.getId());

        verify(helpRequestRepository, never()).save(any(HelpRequest.class));
        verify(helpRequestRepository, never()).delete(any(HelpRequest.class));
    }

    @Test
    void deleteRequest_rejectsNonOwnerWithoutChangingStatus() {
        authenticate("other@hourlink.vn");
        HelpRequest request = helpRequest(user("owner@hourlink.vn"), RequestStatus.SEARCHING);
        when(helpRequestRepository.findById(request.getId())).thenReturn(Optional.of(request));

        AppException exception = assertThrows(
                AppException.class, () -> service.deleteHelpRequest(request.getId()));

        assertEquals(ErrorCode.ACCESS_DENIED, exception.getErrorCode());
        assertEquals(RequestStatus.SEARCHING, request.getStatus());
        verify(helpRequestRepository, never()).save(any(HelpRequest.class));
        verify(helpRequestRepository, never()).delete(any(HelpRequest.class));
    }

    @Test
    void getMyRequests_excludesSoftDeletedRequestsAtRepositoryBoundary() {
        User owner = authenticate("owner@hourlink.vn");
        HelpRequest visible = helpRequest(owner, RequestStatus.SEARCHING);
        when(helpRequestRepository.findAllByRequester_EmailAndStatusNotOrderByCreatedAtDesc(
                owner.getEmail(), RequestStatus.DELETED)).thenReturn(List.of(visible));

        var result = service.getMyHelpRequests();

        assertEquals(1, result.size());
        assertEquals(visible.getId(), result.get(0).getId());
        verify(helpRequestRepository).findAllByRequester_EmailAndStatusNotOrderByCreatedAtDesc(
                owner.getEmail(), RequestStatus.DELETED);
    }

    @Test
    void updateDeletedRequest_doesNotResurrectIt() {
        User owner = authenticate("owner@hourlink.vn");
        HelpRequest request = helpRequest(owner, RequestStatus.DELETED);
        when(helpRequestRepository.findById(request.getId())).thenReturn(Optional.of(request));

        AppException exception = assertThrows(AppException.class,
                () -> service.updateHelpRequest(request.getId(), new HelpRequestRequest()));

        assertEquals(ErrorCode.REQUEST_NOT_FOUND, exception.getErrorCode());
        verify(helpRequestRepository, never()).save(any(HelpRequest.class));
    }

    @Test
    void closeDeletedRequest_doesNotResurrectIt() {
        User owner = authenticate("owner@hourlink.vn");
        HelpRequest request = helpRequest(owner, RequestStatus.DELETED);
        when(helpRequestRepository.findById(request.getId())).thenReturn(Optional.of(request));

        AppException exception = assertThrows(AppException.class,
                () -> service.closeHelpRequest(request.getId()));

        assertEquals(ErrorCode.REQUEST_NOT_FOUND, exception.getErrorCode());
        verify(helpRequestRepository, never()).save(any(HelpRequest.class));
    }

    private User authenticate(String email) {
        User user = user(email);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, null, List.of()));
        return user;
    }

    private User user(String email) {
        User user = User.builder()
                .email(email)
                .fullName("Người dùng")
                .passwordHash("hash")
                .build();
        user.setId(UUID.randomUUID());
        return user;
    }

    private HelpRequest helpRequest(User owner, RequestStatus status) {
        HelpRequest request = HelpRequest.builder()
                .title("Cần hỗ trợ Java")
                .requester(owner)
                .status(status)
                .build();
        request.setId(UUID.randomUUID());
        return request;
    }
}
