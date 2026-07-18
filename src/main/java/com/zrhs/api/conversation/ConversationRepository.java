package com.zrhs.api.conversation;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findAllByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Conversation> findByIdAndUserId(Long id, Long userId);
}
