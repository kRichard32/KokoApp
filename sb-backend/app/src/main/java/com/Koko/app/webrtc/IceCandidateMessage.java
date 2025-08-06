package com.Koko.app.webrtc;

import java.util.Map;

public class IceCandidateMessage extends WebRTCMessage {
    private Map<String, Object> candidate;

    public IceCandidateMessage() {}

    public IceCandidateMessage(String conversationId, String userId, Map<String, Object> candidate) {
        super(conversationId, userId);
        this.candidate = candidate;
    }

    public Map<String, Object> getCandidate() { return candidate; }
    public void setCandidate(Map<String, Object> candidate) { this.candidate = candidate; }
}