package com.Koko.app.rest;

import com.Koko.app.domain.Profile;
import com.Koko.app.service.JwtService;
import com.Koko.app.service.ProfileService;
import com.Koko.app.service.TranscriptionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/navigation")
public class NavigationController {
    private static final Logger logger = LoggerFactory.getLogger(MessageController.class);

    @Autowired
    private JwtService jwtService;

    @Autowired
    private TranscriptionService transcriptionService;

    @CrossOrigin()
    @PostMapping("/transcribe")
    public Map<String, String> transcribeAndCompare(@CookieValue(value = "token", required = false) String token,
                                         @RequestPart MultipartFile audio, @RequestParam String screens) {
        Map<String, Object> userInfo = jwtService.decodeIdToken(token);

        HashMap<String, String> map = new HashMap<>();
        String transcription = "";
        try{
            transcription = transcriptionService.transcribe(audio.getBytes());
        }
        catch(IOException e){
            logger.error(e.getMessage());
        }



        map.put("id", "");
        return map;
    }
}
