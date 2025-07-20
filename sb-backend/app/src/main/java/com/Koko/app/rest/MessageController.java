package com.Koko.app.rest;


import com.Koko.app.dataTransfer.MessageTransfer;
import com.Koko.app.domain.*;
import com.Koko.app.service.ConversationService;
import com.Koko.app.service.FileService;
import com.Koko.app.service.MessageService;
import com.Koko.app.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@RestController
@RequestMapping("/api/messages")
public class MessageController {
    @Autowired
    private MessageService messageService;

    @Autowired
    private ConversationService conversationService;

    @Autowired
    private FileService fileService;

    @Autowired
    private ProfileService profileService;

    @ResponseStatus(value = HttpStatus.OK)

    @CrossOrigin()
    @PostMapping("/create")
    public Map<String, String> createConversation(@RequestPart MultipartFile audio, @RequestPart NewConversation newConversation) {
        HashMap<String, String> map = new HashMap<>();
        String audioPath = fileService.do_POST(audio);
        Conversation conversation = new Conversation();

        Message message = new Message();
        message.setConversation(conversation);
        message.setAudioPath(audioPath);
        Profile sender = profileService.getProfile(newConversation.getMessageTransfer().getProfileID());
        message.setSender(sender);
        message.setTimestampToCurrentTime();

        conversation.setMessages(List.of(message));
        conversation.incrementMessageCount();

        List<String> userIDs = newConversation.getConversationTransfer().getUserIDs();
        conversation.setUsers(profileService.getProfiles(userIDs));
        conversation.setTimestampToCurrentTime();
        conversationService.save(conversation);

        map.put("id", "");
        return map;
    }

    @CrossOrigin()
    @PostMapping("/send")
    public Map<String, String> index(@RequestPart MultipartFile audio, @RequestPart MessageTransfer messageTransfer) {
        HashMap<String, String> map = new HashMap<>();
        Conversation conversation = conversationService.getConversation(messageTransfer.getConversationID());
        String audioPath = fileService.do_POST(audio);
        Message message = new Message();
        message.setConversation(conversation);
        message.setAudioPath(audioPath);
        Profile sender = profileService.getProfile(messageTransfer.getProfileID());
        message.setSender(sender);
        message.setTimestampToCurrentTime();
        conversation.incrementMessageCount();
        conversation.addMessage(message);
        conversationService.save(conversation);

        map.put("id", "");
        return map;
    }
    @CrossOrigin()
    @GetMapping("/getConversation")
    public Conversation getConversation(@RequestParam("id") int id) {
        return conversationService.getConversation(id);
    }


}
