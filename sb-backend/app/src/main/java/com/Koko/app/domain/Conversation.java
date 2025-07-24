package com.Koko.app.domain;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;

import java.sql.Date;
import java.sql.Timestamp;
import java.util.List;
import java.util.Set;

@Entity
public class Conversation {
    @Column(unique=true)
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "conversation_seq", sequenceName = "conversation_seq", allocationSize = 1)
    private long id;

    private int messageCount;

    private Timestamp timestamp;

    @JsonManagedReference
    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<Profile> users;

    @JsonManagedReference
    @OneToMany(mappedBy = "conversation", orphanRemoval = true)
    @OrderBy("timestamp ASC")
    private List<Message> messages;

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public int getMessageCount() {
        return messageCount;
    }

    public void setMessageCount(int messageCount) {
        this.messageCount = messageCount;
    }

    public void incrementMessageCount() {
        this.messageCount = messageCount + 1;
    }

    public List<Profile> getUsers() {
        return users;
    }

    public void setUsers(List<Profile> users) {
        this.users = users;
    }

    public List<Message> getMessages() {
        return messages;
    }

    public void setMessages(List<Message> messages) {
        this.messages = messages;
    }
    public void addMessage(Message message) {
        this.messages.add(message);
    }

    public Timestamp getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Timestamp timestamp) {
        this.timestamp = timestamp;
    }
    public void setTimestampToCurrentTime() {
        this.timestamp = new Timestamp(System.currentTimeMillis());
    }
}
