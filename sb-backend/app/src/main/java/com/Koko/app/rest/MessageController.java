package com.Koko.app.rest;


import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.Koko.app.dataTransfer.ConversationDto;
import com.Koko.app.dataTransfer.ConversationTransfer;
import com.Koko.app.dataTransfer.MessageTransfer;
import com.Koko.app.domain.Conversation;
import com.Koko.app.domain.Message;
import com.Koko.app.domain.Profile;
import com.Koko.app.service.ConversationService;
import com.Koko.app.service.GoogleDriveFileService;
import com.Koko.app.service.JwtService;
import com.Koko.app.service.MessageService;
import com.Koko.app.service.ProfileService;

@RestController
@RequestMapping("/api/messages")
public class MessageController {
    @Autowired
    private MessageService messageService;

    @Autowired
    private ConversationService conversationService;

    @Autowired
    private GoogleDriveFileService googleDriveFileService;

    @Autowired
    private ProfileService profileService;

    @Autowired
    private JwtService jwtService;

    @ResponseStatus(value = HttpStatus.OK)

    @CrossOrigin()
    @PostMapping("/create")
    public Map<String, Long> createConversation(@CookieValue(value = "token", required = false) String token,
                                                  @RequestBody ConversationTransfer newConversation) {
        Map<String, Long> result = new HashMap<>();
        Map<String, Object> userInfo = jwtService.decodeIdToken(token);
        Profile profile = profileService.getProfileByEmail((String) userInfo.get("email"));

        Conversation conversation = new Conversation();

        List<String> userIDs = newConversation.getUserIDs();
        userIDs.add(profile.getId().toString());
        if (!userIDs.contains(profile.getId().toString())){
            return null;
        }
        conversation.setUsers(profileService.getProfiles(userIDs));
        conversation.setTimestampToCurrentTime();
        conversationService.save(conversation);

        result.put("id", conversation.getId());
        return result;
    }

    @CrossOrigin()
    @PostMapping("/send")
    public Map<String, String> sendAudio(@CookieValue(value = "token", required = false) String token,
                                     @RequestPart MultipartFile audio, @RequestParam int conversationId) {
        Map<String, Object> userInfo = jwtService.decodeIdToken(token);
        Profile profile = profileService.getProfileByEmail((String) userInfo.get("email"));
        HashMap<String, String> map = new HashMap<>();
        Conversation conversation = conversationService.getConversationByConversationID(profile.getId(),
                conversationId);
        String audioPath = googleDriveFileService.do_POST(audio);
        Message message = new Message();
        message.setConversation(conversation);
        message.setAudioFileId(audioPath);
        message.setSender(profile);
        message.setTimestampToCurrentTime();
        conversation.setTimestampToCurrentTime();
        conversation.incrementMessageCount();
        conversation.addMessage(message);
        messageService.save(message);

        map.put("id", "");
        return map;
    }
    @CrossOrigin()
    @PostMapping("/sendText")
    public Map<String, String> sendText(@CookieValue(value = "token", required = false) String token,
                                     @RequestBody MessageTransfer messageTransfer) {
        Map<String, Object> userInfo = jwtService.decodeIdToken(token);
        Profile profile = profileService.getProfileByEmail((String) userInfo.get("email"));
        HashMap<String, String> map = new HashMap<>();
        Conversation conversation = conversationService.getConversationByConversationID(profile.getId(),
                messageTransfer.getConversationId());
        Message message = new Message();
        message.setAudioTranscription(messageTransfer.getAudioTranscription());
        message.setConversation(conversation);
        message.setSender(profile);
        message.setTimestampToCurrentTime();
        conversation.setTimestampToCurrentTime();
        conversation.incrementMessageCount();
        conversation.addMessage(message);
        messageService.save(message);

        map.put("id", "");
        return map;
    }
    @CrossOrigin()
    @GetMapping("/getUserConversations")
    public List<Conversation> getConversation(@CookieValue(value = "token", required = false) String token) {
        Map<String, Object> userInfo = jwtService.decodeIdToken(token);
        Profile profile = profileService.getProfileByEmail((String) userInfo.get("email"));
        List<Conversation> conversations = conversationService.getConversationsByUserID(profile.getId());
        
        // Sort conversations by timestamp descending (most recent first)
        conversations.sort(Comparator.comparing(Conversation::getTimestamp).reversed());

        for (Conversation conversation : conversations) {
            List<Profile> profiles = conversation.getUsers();
            for (Profile profile1 : profiles) {
                if (profile.getId().equals(profile1.getId())) {
                    profiles.remove(profile1);
                    break;
                }
            }
            conversation.setUsers(profiles);
        }
        return conversations;
    }
    @CrossOrigin()
    @GetMapping("/getConversation")
    public ConversationDto getConversation(@CookieValue(value = "token", required = false) String token,
                                        @RequestParam("conversationId") int conversationId) {
        Map<String, Object> userInfo = jwtService.decodeIdToken(token);
        Profile profile = profileService.getProfileByEmail((String) userInfo.get("email"));
        Conversation conversation = conversationService.getConversationByConversationID(profile.getId(),conversationId);
        ConversationDto conversationDto = new ConversationDto(conversation,profile);
        return conversationDto;
    }
    @CrossOrigin()
    @GetMapping("/getConversationWithoutUser")
    public ConversationDto getConversationWithoutUser(@CookieValue(value = "token", required = false) String token,
                                           @RequestParam("conversationId") int conversationId) {
        Map<String, Object> userInfo = jwtService.decodeIdToken(token);
        Profile profile = profileService.getProfileByEmail((String) userInfo.get("email"));
        Conversation conversation = conversationService.getConversationByConversationID(profile.getId(),conversationId);
        conversation.getMessages().removeIf(message -> message.getSender().equals(profile));
        ConversationDto conversationDto = new ConversationDto(conversation,profile);
        return conversationDto;
    }
    @CrossOrigin()
    @GetMapping("/getMessageAudio")
    public byte[] getMessageAudio(@CookieValue(value = "token", required = false) String token,
                                  @RequestParam("messageId") long messageId) {
        Map<String, Object> userInfo = jwtService.decodeIdToken(token);
        Message message = messageService.getMessage(messageId).orElse(null);
        if (message == null) {
            return null;
        }
        Conversation conversation = conversationService.getConversationByMessageID(messageId);
        List<Profile> profiles = conversation.getUsers();
        Profile profile = profileService.getProfileByEmail((String) userInfo.get("email"));

        boolean canSee = false;
        for (Profile p : profiles) {
            if (Objects.equals(p.getId(), profile.getId())) {
                canSee = true;
                break;
            }
        }
        if (canSee) {
            return googleDriveFileService.do_GET(message.getAudioFileId());
        }
        return null;

    }


}
