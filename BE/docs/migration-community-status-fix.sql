-- Fix for Enum mismatch between Spring Boot and MySQL
-- Changes the status column to VARCHAR to allow all Enum values defined in Java (e.g. REGISTERED, COMPLETED)

ALTER TABLE activity_participant MODIFY status VARCHAR(20) NOT NULL;
ALTER TABLE community_activity MODIFY status VARCHAR(20) NOT NULL;
