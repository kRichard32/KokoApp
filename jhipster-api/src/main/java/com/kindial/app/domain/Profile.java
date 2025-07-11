package com.kindial.app.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.kindial.app.domain.enumeration.Language;
import jakarta.persistence.*;
import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/**
 * A Profile.
 */
@Entity
@Table(name = "profile")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@org.springframework.data.elasticsearch.annotations.Document(indexName = "profile")
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Profile implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "sequenceGenerator")
    @SequenceGenerator(name = "sequenceGenerator")
    @Column(name = "id")
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "language")
    @org.springframework.data.elasticsearch.annotations.Field(type = org.springframework.data.elasticsearch.annotations.FieldType.Keyword)
    private Language language;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(unique = true)
    private User user;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "rel_profile__trait",
        joinColumns = @JoinColumn(name = "profile_id"),
        inverseJoinColumns = @JoinColumn(name = "trait_id")
    )
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
    @JsonIgnoreProperties(value = { "profiles" }, allowSetters = true)
    private Set<Trait> traits = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "rel_profile__messages",
        joinColumns = @JoinColumn(name = "profile_id"),
        inverseJoinColumns = @JoinColumn(name = "messages_id")
    )
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
    @JsonIgnoreProperties(value = { "messages", "profiles" }, allowSetters = true)
    private Set<Conversation> messages = new HashSet<>();

    @JsonIgnoreProperties(value = { "profile", "conversation" }, allowSetters = true)
    @OneToOne(fetch = FetchType.LAZY, mappedBy = "profile")
    @org.springframework.data.annotation.Transient
    private Message message;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public Long getId() {
        return this.id;
    }

    public Profile id(Long id) {
        this.setId(id);
        return this;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Language getLanguage() {
        return this.language;
    }

    public Profile language(Language language) {
        this.setLanguage(language);
        return this;
    }

    public void setLanguage(Language language) {
        this.language = language;
    }

    public User getUser() {
        return this.user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Profile user(User user) {
        this.setUser(user);
        return this;
    }

    public Set<Trait> getTraits() {
        return this.traits;
    }

    public void setTraits(Set<Trait> traits) {
        this.traits = traits;
    }

    public Profile traits(Set<Trait> traits) {
        this.setTraits(traits);
        return this;
    }

    public Profile addTrait(Trait trait) {
        this.traits.add(trait);
        return this;
    }

    public Profile removeTrait(Trait trait) {
        this.traits.remove(trait);
        return this;
    }

    public Set<Conversation> getMessages() {
        return this.messages;
    }

    public void setMessages(Set<Conversation> conversations) {
        this.messages = conversations;
    }

    public Profile messages(Set<Conversation> conversations) {
        this.setMessages(conversations);
        return this;
    }

    public Profile addMessages(Conversation conversation) {
        this.messages.add(conversation);
        return this;
    }

    public Profile removeMessages(Conversation conversation) {
        this.messages.remove(conversation);
        return this;
    }

    public Message getMessage() {
        return this.message;
    }

    public void setMessage(Message message) {
        if (this.message != null) {
            this.message.setProfile(null);
        }
        if (message != null) {
            message.setProfile(this);
        }
        this.message = message;
    }

    public Profile message(Message message) {
        this.setMessage(message);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Profile)) {
            return false;
        }
        return getId() != null && getId().equals(((Profile) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "Profile{" +
            "id=" + getId() +
            ", language='" + getLanguage() + "'" +
            "}";
    }
}
