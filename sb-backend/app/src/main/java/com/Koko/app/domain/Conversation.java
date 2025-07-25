package com.Koko.app.domain;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;

import java.sql.Date;
import java.sql.Timestamp;
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
    @JoinTable(name = "conversation_users", joinColumns = {@JoinColumn(name = "conversations_id")}, inverseJoinColumns = {@JoinColumn(name = "users_id")},
            uniqueConstraints = {@UniqueConstraint(columnNames = {"conversations_id", "users_id"})})
    private Set<Profile> users;

    @JsonManagedReference
    @OneToMany(mappedBy = "conversation", orphanRemoval = true)
    @OrderBy("timestamp ASC")
    private Set<Message> messages;

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
