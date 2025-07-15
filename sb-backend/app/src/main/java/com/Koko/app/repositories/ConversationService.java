package com.Koko.app.repositories;

import com.Koko.app.domain.Conversation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class ConversationService {
    @Autowired
    ConversationRepository conversationRepository;

    public void save(Conversation message) {
        conversationRepository.save(message);
    }
    public Optional<Conversation> getMessage(int id) {
        return conversationRepository.findById(id);
    }

}
