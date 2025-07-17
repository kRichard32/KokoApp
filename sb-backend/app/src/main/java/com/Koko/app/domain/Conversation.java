package com.Koko.app.domain;

import jakarta.persistence.*;

import java.util.Set;

@Entity
public class Conversation {
    @Column(unique=true)
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private int id;

    private int messageCount;

    @ManyToMany
    private Set<Profile> users;

    @OneToMany
    private Set<Message> messages;

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

    public Set<Message> getConversation() {
        return messages;
    }

    public void setConversation(Set<Message> messages) {
        this.messages = messages;
    }

    public Set<Profile> getUsers() {
        return users;
    }

    public void setUsers(Set<Profile> users) {
        this.users = users;
    }

    public Set<Message> getMessages() {
        return messages;
    }

    public void setMessages(Set<Message> messages) {
        this.messages = messages;
    }
}
