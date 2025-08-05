package com.Koko.app.service;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.Koko.app.webrtc.AnswerMessage;
import com.Koko.app.webrtc.EndCallMessage;
import com.Koko.app.webrtc.IceCandidateMessage;
import com.Koko.app.webrtc.JoinCallMessage;
import com.Koko.app.webrtc.OfferMessage;
import com.Koko.app.webrtc.WebRTCMessage;

@Service
public class WebRTCService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Store active calls and participants
    private final Map<String, Set<String>> activeCalls = new ConcurrentHashMap<>();
    private final Map<String, String> userToCall = new ConcurrentHashMap<>();

    public void joinCall(JoinCallMessage message) {
        String conversationId = message.getConversationId();
        String userId = message.getUserId();

        // Add user to call
        activeCalls.computeIfAbsent(conversationId, k -> ConcurrentHashMap.newKeySet()).add(userId);
        userToCall.put(userId, conversationId);

        // Notify all participants via topic, include senderId in payload
        messagingTemplate.convertAndSend(
                "/topic/call/" + conversationId,
                new WebRTCEnvelope(userId, new UserJoinedMessage(conversationId, userId), "peer-joined")
        );

        System.out.println("User " + userId + " joined call " + conversationId);
    }

    public void handleOffer(OfferMessage message) {
        String conversationId = message.getConversationId();
        String senderId = message.getUserId();

        // Broadcast offer to all participants via topic, include senderId in payload
        messagingTemplate.convertAndSend(
                "/topic/call/" + conversationId,
                new WebRTCEnvelope(senderId, message, "offer")
        );

        System.out.println("Forwarded offer from " + senderId + " for call " + conversationId);
    }

    public void handleAnswer(AnswerMessage message) {
        String conversationId = message.getConversationId();
        String senderId = message.getUserId();

        // Broadcast answer to all participants via topic, include senderId in payload
        messagingTemplate.convertAndSend(
                "/topic/call/" + conversationId,
                new WebRTCEnvelope(senderId, message, "answer")
        );

        System.out.println("Forwarded answer from " + senderId + " for call " + conversationId);
    }

    public void handleIceCandidate(IceCandidateMessage message) {
        String conversationId = message.getConversationId();
        String senderId = message.getUserId();

        // Broadcast ICE candidate to all participants via topic, include senderId in payload
        messagingTemplate.convertAndSend(
                "/topic/call/" + conversationId,
                new WebRTCEnvelope(senderId, message, "ice-candidate")
        );

        System.out.println("Forwarded ICE candidate from " + senderId + " for call " + conversationId);
    }

    public void endCall(EndCallMessage message) {
        String conversationId = message.getConversationId();
        String userId = message.getUserId();

        // Remove user from call
        Set<String> participants = activeCalls.get(conversationId);
        if (participants != null) {
            participants.remove(userId);

            // Broadcast end call message to all participants via topic, include senderId in payload
            messagingTemplate.convertAndSend(
                    "/topic/call/" + conversationId,
                    new WebRTCEnvelope(userId, message, "call-ended")
            );

            // Clean up empty calls
            if (participants.isEmpty()) {
                activeCalls.remove(conversationId);
            }
        }

        userToCall.remove(userId);
        System.out.println("User " + userId + " left call " + conversationId);
    }

    // Helper method to handle user disconnection
    public void handleUserDisconnection(String userId) {
        String conversationId = userToCall.get(userId);
        if (conversationId != null) {
            endCall(new EndCallMessage(conversationId, userId));
        }
    }

    // Additional message type for user joined notification
    public static class UserJoinedMessage extends WebRTCMessage {
        public UserJoinedMessage(String conversationId, String userId) {
            super(conversationId, userId);
        }
    }

    // Envelope class to wrap messages with senderId
    public static class WebRTCEnvelope {
        private String senderId;
        private Object payload;
        private String type;

        public WebRTCEnvelope(String senderId, Object payload, String type) {
            this.senderId = senderId;
            this.payload = payload;
            this.type = type;
        }

        public String getSenderId() {
            return senderId;
        }

        public Object getPayload() {
            return payload;
        }

        public String getType() {
            return type;
        }
    }
}