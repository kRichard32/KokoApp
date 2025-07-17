package com.Koko.app.repositories;

import com.Koko.app.domain.Conversation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class ConversationService {
    @Autowired
    ConversationRepository conversationRepository;

    public void save(Conversation conversation) {
        conversationRepository.save(conversation);
    }
    public Optional<Conversation> getConversation(int id) {
        return conversationRepository.findById(id);
    }

}
