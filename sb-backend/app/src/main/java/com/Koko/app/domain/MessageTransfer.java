package com.Koko.app.domain;

import jakarta.persistence.*;

import java.sql.Date;

public class MessageTransfer {

    private int id;

    private String profileID;

    private String audioPath;

    private String audioTranscription;

    private String conversationID;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getAudioPath() {
        return audioPath;
    }

    public void setAudioPath(String audioPath) {
        this.audioPath = audioPath;
    }

    public String getAudioTranscription() {
        return audioTranscription;
    }

    public void setAudioTranscription(String audioTranscription) {
        this.audioTranscription = audioTranscription;
    }

    public String getProfileID() {
        return profileID;
    }

    public void setProfileID(String profileID) {
        this.profileID = profileID;
    }

    public String getConversationID() {
        return conversationID;
    }

    public void setConversationID(String conversationID) {
        this.conversationID = conversationID;
    }
}
