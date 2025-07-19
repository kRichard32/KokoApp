package com.Koko.app.repositories;

import com.Koko.app.domain.Conversation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

@Service
public class ConversationService {
    @Autowired
    ConversationRepository conversationRepository;

    public void save(Conversation conversation) {
        conversationRepository.save(conversation);
    }
    public Conversation getConversation(int id) {
        Conversation conversation = conversationRepository.findById(id).orElse(null);
        if (conversation == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Conversation not found"
            );
        }
        return conversation;
    }
}
