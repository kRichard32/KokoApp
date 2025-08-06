package com.Koko.app.webrtc;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({
        @JsonSubTypes.Type(value = JoinCallMessage.class, name = "join-call"),
        @JsonSubTypes.Type(value = OfferMessage.class, name = "offer"),
        @JsonSubTypes.Type(value = AnswerMessage.class, name = "answer"),
        @JsonSubTypes.Type(value = IceCandidateMessage.class, name = "ice-candidate"),
        @JsonSubTypes.Type(value = EndCallMessage.class, name = "end-call")
})
public abstract class WebRTCMessage {
    private String conversationId;
    private String userId;

    // Constructors
    public WebRTCMessage() {}

    public WebRTCMessage(String conversationId, String userId) {
        this.conversationId = conversationId;
        this.userId = userId;
    }

    // Getters and setters
    public String getConversationId() { return conversationId; }
    public void setConversationId(String conversationId) { this.conversationId = conversationId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
}