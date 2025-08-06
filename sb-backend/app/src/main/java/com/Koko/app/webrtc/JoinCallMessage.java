package com.Koko.app.webrtc;

public class JoinCallMessage extends WebRTCMessage {
    public JoinCallMessage() {}

    public JoinCallMessage(String conversationId, String userId) {
        super(conversationId, userId);
    }
}