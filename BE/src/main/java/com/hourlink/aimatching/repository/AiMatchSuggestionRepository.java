package com.hourlink.aimatching.repository;

import com.hourlink.aimatching.entity.AiMatchSuggestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface AiMatchSuggestionRepository extends JpaRepository<AiMatchSuggestion, UUID> {
    // TODO: thêm custom queries
}
