package com.hourlink.user.repository;

import com.hourlink.user.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {

    @Query("SELECT ur.role.roleCode FROM UserRole ur WHERE ur.user.id = :userId")
    List<String> findRoleCodesByUserId(@Param("userId") UUID userId);

    boolean existsByUser_IdAndRole_RoleCode(UUID userId, String roleCode);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM UserRole ur WHERE ur.user.id = :userId AND ur.role.roleCode IN :roleCodes")
    int deleteByUserIdAndRoleCodes(@Param("userId") UUID userId,
                                   @Param("roleCodes") Collection<String> roleCodes);
}
