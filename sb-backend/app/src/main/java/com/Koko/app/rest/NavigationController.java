package com.Koko.app.rest;

import com.Koko.app.domain.Conversation;
import com.Koko.app.domain.Profile;
import com.Koko.app.service.ConversationService;
import com.Koko.app.service.JwtService;
import com.Koko.app.service.ProfileService;
import com.Koko.app.service.TranscriptionService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/navigation")
public class NavigationController {
    private static final Logger logger = LoggerFactory.getLogger(NavigationController.class);

    @Autowired
    private JwtService jwtService;

    @Autowired
    private TranscriptionService transcriptionService;

    @Autowired
    private ConversationService conversationService;

    @Autowired
    private ProfileService profileService;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    private Map<String, List<String>> navigationData;

    public NavigationController() {
        loadNavigationData();
    }

    private void loadNavigationData() {
        try {
            ClassPathResource resource = new ClassPathResource("navigation.json");
            InputStream inputStream = resource.getInputStream();
            
            TypeReference<Map<String, List<String>>> typeRef = new TypeReference<Map<String, List<String>>>() {};
            navigationData = objectMapper.readValue(inputStream, typeRef);
            
            logger.info("Navigation data loaded successfully with {} screens", navigationData.size());
        } catch (IOException e) {
            logger.error("Failed to load navigation data", e);
            navigationData = new HashMap<>();
        }
    }

    @CrossOrigin()
    @PostMapping("/transcribe")
    public Map<String, String> transcribeAndCompare(@CookieValue(value = "token", required = false) String token,
                                         @RequestPart MultipartFile audio) {
        try {
            // Decode and validate token
            Map<String, Object> userInfo = jwtService.decodeIdToken(token);
            if (userInfo == null || userInfo.get("email") == null) {
                HashMap<String, String> errorMap = new HashMap<>();
                errorMap.put("error", "Invalid authentication token");
                return errorMap;
            }

            HashMap<String, String> map = new HashMap<>();
            String transcription = "";

            try {
                transcription = transcriptionService.transcribe(audio.getBytes());
                map.put("transcription", transcription);
                logger.info("Transcription result: {}", transcription);
            } catch (IOException e) {
                logger.error("Transcription failed", e);
                map.put("error", "Transcription failed: " + e.getMessage());
                return map;
            }

            // Find matching screen based on keywords
            String matchedScreen = findMatchingScreen(transcription);

            if (matchedScreen == null) {
                map.put("match", "false");
                logger.info("Failed to find a matching screen");
            }
            else if (matchedScreen.equals("ChatScreen")){
                List<Conversation> conversations = conversationService.getConversationsByUserID(
                        profileService.getProfileByEmail((String) userInfo.get("email")).getId());
                long matched_conversation = findMatchingConversation(transcription, conversations);
                if (matched_conversation != -1){
                    map.put("screen", matchedScreen);
                    map.put("match", "true");
                    map.put("conversationId", String.valueOf(matched_conversation));
                }
            }
            else {
                map.put("screen", matchedScreen);
                map.put("match", "true");
                logger.info("Matched screen: {} for transcription: {}", matchedScreen, transcription);
            }


            return map;
        } catch (Exception e) {
            logger.error("Error in transcribeAndCompare", e);
            HashMap<String, String> errorMap = new HashMap<>();
            errorMap.put("error", "Internal server error: " + e.getMessage());
            return errorMap;
        }
    }
    private long findMatchingConversation(String transcription, List<Conversation> conversations) {
        if (transcription == null || transcription.trim().isEmpty()) {
            return -1;
        }
        List<Set<Profile>> conversationUsers = conversations.stream().map(Conversation::getUsers).toList();

        String lowercaseTranscription = transcription.toLowerCase();

        // Check each screen's keywords
        for (int i = 0; i < conversationUsers.size(); i++) {
            Set<Profile> users = conversationUsers.get(i);
            int counter = 0;
            for (Profile user : users) {
                String [] name = user.getName().split(" ");
                if (lowercaseTranscription.contains(name[0].toLowerCase())) {
                    counter++;
                }
                else if (name.length > 1 && lowercaseTranscription.contains(name[1].toLowerCase())) {
                    counter++;
                }
            }
            if (counter >= users.size() - 1){
                return conversations.get(i).getId();
            }
        }

        return -1;
    }

    private String findMatchingScreen(String transcription) {
        if (transcription == null || transcription.trim().isEmpty()) {
            return null;
        }

        String lowercaseTranscription = transcription.toLowerCase();
        
        // Check each screen's keywords
        for (Map.Entry<String, List<String>> entry : navigationData.entrySet()) {
            String screenName = entry.getKey();
            List<String> keywords = entry.getValue();
            
            for (String keyword : keywords) {
                if (lowercaseTranscription.contains(keyword.toLowerCase())) {
                    return screenName;
                }
            }
        }
        
        return null;
    }

    

    
}
