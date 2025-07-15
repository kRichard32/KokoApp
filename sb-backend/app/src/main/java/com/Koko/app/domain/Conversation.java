package com.Koko.app.domain;

import jakarta.persistence.*;

import java.sql.Date;
import java.util.ArrayList;

@Entity
public class Conversation {
    @Column(unique=true)
    @Id
    private int id;

    private int messageCount;

    @OneToMany
    private ArrayList<Message> messages;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public int getMessageCount() {
        return messageCount;
    }

    public void setMessageCount(int messageCount) {
        this.messageCount = messageCount;
    }

    public ArrayList<Message> getConversation() {
        return messages;
    }

    public void setConversation(ArrayList<Message> messages) {
        this.messages = messages;
    }
}
