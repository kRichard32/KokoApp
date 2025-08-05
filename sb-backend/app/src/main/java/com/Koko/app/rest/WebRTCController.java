package com.Koko.app.rest;

import com.Koko.app.service.JwtService;
import com.Koko.app.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;

import com.Koko.app.service.WebRTCService;
import com.Koko.app.webrtc.AnswerMessage;
import com.Koko.app.webrtc.EndCallMessage;
import com.Koko.app.webrtc.IceCandidateMessage;
import com.Koko.app.webrtc.JoinCallMessage;
import com.Koko.app.webrtc.OfferMessage;

import java.util.Map;
import java.util.Objects;

@Controller
public class WebRTCController {

    @Autowired
    private WebRTCService webRTCService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ProfileService profileService;

    @MessageMapping("/join-call")
    public void joinCall(@Payload JoinCallMessage message, SimpMessageHeaderAccessor headerAccessor) {
        String token = ((JwtAuthenticationToken) Objects.requireNonNull(headerAccessor.getHeader("simpUser"))).getToken().getTokenValue();
        Map<String, Object> userInfo = jwtService.decodeIdToken(token);
        message.setUserId(profileService.getProfileByEmail((String) userInfo.get("email")).getId().toString());
        webRTCService.joinCall(message);
    }

    @MessageMapping("/offer")
    public void handleOffer(@Payload OfferMessage message, SimpMessageHeaderAccessor headerAccessor) {
        String token = ((JwtAuthenticationToken) Objects.requireNonNull(headerAccessor.getHeader("simpUser"))).getToken().getTokenValue();
        Map<String, Object> userInfo = jwtService.decodeIdToken(token);
        message.setUserId(profileService.getProfileByEmail((String) userInfo.get("email")).getId().toString());
        webRTCService.handleOffer(message);
    }

    @MessageMapping("/answer")
    public void handleAnswer(@Payload AnswerMessage message, SimpMessageHeaderAccessor headerAccessor) {
        String token = ((JwtAuthenticationToken) Objects.requireNonNull(headerAccessor.getHeader("simpUser"))).getToken().getTokenValue();
        Map<String, Object> userInfo = jwtService.decodeIdToken(token);
        message.setUserId(profileService.getProfileByEmail((String) userInfo.get("email")).getId().toString());
        webRTCService.handleAnswer(message);
    }

    @MessageMapping("/ice-candidate")
    public void handleIceCandidate(@Payload IceCandidateMessage message, SimpMessageHeaderAccessor headerAccessor) {
        String token = ((JwtAuthenticationToken) Objects.requireNonNull(headerAccessor.getHeader("simpUser"))).getToken().getTokenValue();
        Map<String, Object> userInfo = jwtService.decodeIdToken(token);
        message.setUserId(profileService.getProfileByEmail((String) userInfo.get("email")).getId().toString());
        webRTCService.handleIceCandidate(message);
    }

    @MessageMapping("/end-call")
    public void endCall(@Payload EndCallMessage message, SimpMessageHeaderAccessor headerAccessor) {
        String token = ((JwtAuthenticationToken) Objects.requireNonNull(headerAccessor.getHeader("simpUser"))).getToken().getTokenValue();
        Map<String, Object> userInfo = jwtService.decodeIdToken(token);
        message.setUserId(profileService.getProfileByEmail((String) userInfo.get("email")).getId().toString());
        webRTCService.endCall(message);
    }
}