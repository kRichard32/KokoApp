package com.Koko.app.domain;

import jakarta.persistence.*;

import java.sql.Date;

@Entity
public class Message {
    @Column(unique=true)
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private int id;

    @OneToOne
    private Profile sender;

    private Date timestamp;

    private String audioPath;

    private String audioTranscription;

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

    public Conversation getConversation() {
        return conversation;
    }

    public void setConversation(Conversation conversation) {
        this.conversation = conversation;
    }
}
