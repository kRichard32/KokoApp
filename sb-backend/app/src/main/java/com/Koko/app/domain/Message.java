package com.Koko.app.domain;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

import java.sql.Date;
import java.sql.Timestamp;

@Entity
public class Message {
    @Column(unique=true)
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "message_seq", sequenceName = "message_seq", allocationSize = 1)
    private long id;

    @ManyToOne
    private Profile sender;

    private Timestamp timestamp;

    private String audioFileId;

    private String audioTranscription;

    @JsonBackReference
    @ManyToOne
    private Conversation conversation;


    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public Profile getSender() {
        return sender;
    }

    public void setSender(Profile sender) {
        this.sender = sender;
    }

    public Timestamp getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Timestamp timestamp) {
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
        this.timestamp = new Timestamp(System.currentTimeMillis());
    }
}
