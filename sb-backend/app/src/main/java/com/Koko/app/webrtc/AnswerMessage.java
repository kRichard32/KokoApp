package com.Koko.app.webrtc;

import java.util.Map;

public class AnswerMessage extends WebRTCMessage {
    private Map<String, Object> answer;

    public AnswerMessage() {}

    public AnswerMessage(String conversationId, String userId, Map<String, Object> answer) {
        super(conversationId, userId);
        this.answer = answer;
    }

    public Map<String, Object> getAnswer() { return answer; }
    public void setAnswer(Map<String, Object> answer) { this.answer = answer; }
}