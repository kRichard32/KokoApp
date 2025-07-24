package com.Koko.app.service;

import com.Koko.app.domain.Conversation;
import com.Koko.app.repositories.ConversationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

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
    public List<Conversation> getConversationsByUserID(long id) {
        return conversationRepository.findByUsersId(id);
    }
    public Conversation getConversationByMessageID(int id) {
        return conversationRepository.findByMessagesId(id);
    }
    public Conversation getConversationByConversationID(long userId, int conversationId) {
        return conversationRepository.findByUsersIdAndId(userId,conversationId);
    }
}
