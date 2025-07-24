package com.Koko.app.repositories;

import com.Koko.app.domain.Conversation;
import com.Koko.app.domain.Profile;
import com.Koko.app.domain.Trait;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Integer> {
    List<Conversation> findByUsersId(Long users_id);
    Conversation findByMessagesId(int messages_id);
    Conversation findByUsersIdAndId(Long users_id, int conversationId);
}
