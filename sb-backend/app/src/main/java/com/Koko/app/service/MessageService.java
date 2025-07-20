package com.Koko.app.service;

import com.Koko.app.domain.Message;
import com.Koko.app.repositories.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class MessageService {
    @Autowired
    MessageRepository messageRepository;

    public void save(Message message) {
        messageRepository.save(message);
    }
    public Optional<Message> getMessage(int id) {
        return messageRepository.findById(id);
    }

}
