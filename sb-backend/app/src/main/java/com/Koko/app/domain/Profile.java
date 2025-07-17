package com.Koko.app.domain;

import jakarta.persistence.*;

import java.util.Set;

@Entity
public class Profile {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;

    @ManyToMany(mappedBy = "profiles", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private Set<Trait> traits;

    @ManyToMany(mappedBy = "users", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private Set<Conversation> conversations;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Set<Trait> getTraits() {
        return traits;
    }

    public void setTraits(Set<Trait> traits) {
        this.traits = traits;
    }
    public void addTrait(Trait trait) {
        this.traits.add(trait);
    }

    public Set<Conversation> getConversations() {
        return conversations;
    }

    public void setConversations(Set<Conversation> conversations) {
        this.conversations = conversations;
    }
}
