package com.Koko.app.webrtc;

public class EndCallMessage extends WebRTCMessage {
    public EndCallMessage() {}

    public EndCallMessage(String conversationId, String userId) {
        super(conversationId, userId);
    }
}