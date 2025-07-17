package com.Koko.app.rest;


import com.Koko.app.domain.*;
import com.Koko.app.repositories.ConversationService;
import com.Koko.app.repositories.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
public class MessageResource {
    @Autowired
    private MessageService messageService;

    @Autowired
    private ConversationService conversationService;

    @ResponseStatus(value = HttpStatus.OK)

    @CrossOrigin()
    @PostMapping("/create")
    public Map<String, String> createConversation(@RequestBody NewConversation newConversation) {
        HashMap<String, String> map = new HashMap<>();

        map.put("id", "");
        return map;
    }

    @CrossOrigin()
    @PostMapping("/send")
    public Map<String, String> index(@RequestBody MessageTransfer message) {
        HashMap<String, String> map = new HashMap<>();

        map.put("id", "");
        return map;
    }
}
