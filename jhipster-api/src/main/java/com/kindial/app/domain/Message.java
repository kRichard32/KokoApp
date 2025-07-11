package com.kindial.app.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.kindial.app.domain.enumeration.MessageType;
import jakarta.persistence.*;
import java.io.Serializable;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/**
 * A Message.
 */
@Entity
@Table(name = "message")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@org.springframework.data.elasticsearch.annotations.Document(indexName = "message")
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Message implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "sequenceGenerator")
    @SequenceGenerator(name = "sequenceGenerator")
    @Column(name = "id")
    private Long id;

    @Lob
    @Column(name = "raw_content")
    private byte[] rawContent;

    @Column(name = "raw_content_content_type")
    private String rawContentContentType;

    @Column(name = "transcript")
    @org.springframework.data.elasticsearch.annotations.Field(type = org.springframework.data.elasticsearch.annotations.FieldType.Text)
    private String transcript;

    @Column(name = "timestamp")
    @org.springframework.data.elasticsearch.annotations.Field(type = org.springframework.data.elasticsearch.annotations.FieldType.Text)
    private String timestamp;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type")
    @org.springframework.data.elasticsearch.annotations.Field(type = org.springframework.data.elasticsearch.annotations.FieldType.Keyword)
    private MessageType messageType;

    @JsonIgnoreProperties(value = { "user", "traits", "messages", "message" }, allowSetters = true)
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(unique = true)
    private Profile profile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = { "messages", "profiles" }, allowSetters = true)
    private Conversation conversation;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public Long getId() {
        return this.id;
    }

    public Message id(Long id) {
        this.setId(id);
        return this;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public byte[] getRawContent() {
        return this.rawContent;
    }

    public Message rawContent(byte[] rawContent) {
        this.setRawContent(rawContent);
        return this;
    }

    public void setRawContent(byte[] rawContent) {
        this.rawContent = rawContent;
    }

    public String getRawContentContentType() {
        return this.rawContentContentType;
    }

    public Message rawContentContentType(String rawContentContentType) {
        this.rawContentContentType = rawContentContentType;
        return this;
    }

    public void setRawContentContentType(String rawContentContentType) {
        this.rawContentContentType = rawContentContentType;
    }

    public String getTranscript() {
        return this.transcript;
    }

    public Message transcript(String transcript) {
        this.setTranscript(transcript);
        return this;
    }

    public void setTranscript(String transcript) {
        this.transcript = transcript;
    }

    public String getTimestamp() {
        return this.timestamp;
    }

    public Message timestamp(String timestamp) {
        this.setTimestamp(timestamp);
        return this;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public MessageType getMessageType() {
        return this.messageType;
    }

    public Message messageType(MessageType messageType) {
        this.setMessageType(messageType);
        return this;
    }

    public void setMessageType(MessageType messageType) {
        this.messageType = messageType;
    }

    public Profile getProfile() {
        return this.profile;
    }

    public void setProfile(Profile profile) {
        this.profile = profile;
    }

    public Message profile(Profile profile) {
        this.setProfile(profile);
        return this;
    }

    public Conversation getConversation() {
        return this.conversation;
    }

    public void setConversation(Conversation conversation) {
        this.conversation = conversation;
    }

    public Message conversation(Conversation conversation) {
        this.setConversation(conversation);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Message)) {
            return false;
        }
        return getId() != null && getId().equals(((Message) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "Message{" +
            "id=" + getId() +
            ", rawContent='" + getRawContent() + "'" +
            ", rawContentContentType='" + getRawContentContentType() + "'" +
            ", transcript='" + getTranscript() + "'" +
            ", timestamp='" + getTimestamp() + "'" +
            ", messageType='" + getMessageType() + "'" +
            "}";
    }
}
