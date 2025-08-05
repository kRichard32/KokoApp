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
        String sessionId = headerAccessor.getSessionId();
        message.setUserId(sessionId);
        String token = ((JwtAuthenticationToken) Objects.requireNonNull(headerAccessor.getHeader("simpUser"))).getToken().getTokenValue();
        Map<String, Object> userInfo = jwtService.decodeIdToken(token);
        webRTCService.joinCall(message,profileService.getProfileByEmail((String) userInfo.get("email")).getId().toString());
    }

    @MessageMapping("/offer")
    public void handleOffer(@Payload OfferMessage message, SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        message.setUserId(sessionId);
        String token = ((JwtAuthenticationToken) Objects.requireNonNull(headerAccessor.getHeader("simpUser"))).getToken().getTokenValue();
        Map<String, Object> userInfo = jwtService.decodeIdToken(token);
        webRTCService.handleOffer(message,profileService.getProfileByEmail((String) userInfo.get("email")).getId().toString());
    }

    @MessageMapping("/answer")
    public void handleAnswer(@Payload AnswerMessage message, SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        message.setUserId(sessionId);
        String token = ((JwtAuthenticationToken) Objects.requireNonNull(headerAccessor.getHeader("simpUser"))).getToken().getTokenValue();
        Map<String, Object> userInfo = jwtService.decodeIdToken(token);
        webRTCService.handleAnswer(message,profileService.getProfileByEmail((String) userInfo.get("email")).getId().toString());
    }

    @MessageMapping("/ice-candidate")
    public void handleIceCandidate(@Payload IceCandidateMessage message, SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        message.setUserId(sessionId);
        String token = ((JwtAuthenticationToken) Objects.requireNonNull(headerAccessor.getHeader("simpUser"))).getToken().getTokenValue();
        Map<String, Object> userInfo = jwtService.decodeIdToken(token);
        webRTCService.handleIceCandidate(message,profileService.getProfileByEmail((String) userInfo.get("email")).getId().toString());
    }

    @MessageMapping("/end-call")
    public void endCall(@Payload EndCallMessage message, SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        message.setUserId(sessionId);
        String token = ((JwtAuthenticationToken) Objects.requireNonNull(headerAccessor.getHeader("simpUser"))).getToken().getTokenValue();
        Map<String, Object> userInfo = jwtService.decodeIdToken(token);
        webRTCService.endCall(message,profileService.getProfileByEmail((String) userInfo.get("email")).getId().toString());
    }
}