package com.Koko.app.webrtc;

import java.util.Map;

public class OfferMessage extends WebRTCMessage {
    private Map<String, Object> offer;

    public OfferMessage() {}

    public OfferMessage(String conversationId, String userId, Map<String, Object> offer) {
        super(conversationId, userId);
        this.offer = offer;
    }

    public Map<String, Object> getOffer() { return offer; }
    public void setOffer(Map<String, Object> offer) { this.offer = offer; }
}
