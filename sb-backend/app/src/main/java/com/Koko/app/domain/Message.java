package com.Koko.app.domain;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

import java.sql.Date;

@Entity
public class Message {
    @Column(unique=true)
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private int id;

    @JsonBackReference
    @ManyToOne
    private Profile sender;

    private Date timestamp;

    private String audioFileId;

    private String audioTranscription;

    @JsonBackReference
    @ManyToOne
    private Conversation conversation;


    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public Profile getSender() {
        return sender;
    }

    public void setSender(Profile sender) {
        this.sender = sender;
    }

    public Date getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Date timestamp) {
        this.timestamp = timestamp;
    }

    public String getAudioFileId() {
        return audioFileId;
    }

    public void setAudioFileId(String audioPath) {
        this.audioFileId = audioPath;
    }

    public String getAudioTranscription() {
        return audioTranscription;
    }

    public void setAudioTranscription(String audioTranscription) {
        this.audioTranscription = audioTranscription;
    }

    public Conversation getConversation() {
        return conversation;
    }

    public void setConversation(Conversation conversation) {
        this.conversation = conversation;
    }
    public void setTimestampToCurrentTime() {
        this.timestamp = new Date(System.currentTimeMillis());
    }
}
