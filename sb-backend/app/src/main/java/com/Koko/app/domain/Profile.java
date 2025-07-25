package com.Koko.app.domain;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
public class Profile {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;

    @JsonManagedReference
    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(name = "profile_traits", joinColumns = {@JoinColumn(name = "profiles_id")}, inverseJoinColumns = {@JoinColumn(name = "traits_id")},
            uniqueConstraints = {@UniqueConstraint(columnNames = {"profiles_id", "traits_id"})})
    private Set<Trait> traits = new HashSet<>();

    @JsonBackReference
    @ManyToMany(mappedBy = "users", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private Set<Conversation> conversations;

    @Column(unique = true, nullable = false)
    private String email;

    private String name;

    private String profilePictureId;

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
    public void addTraits(Set<Trait> traits) {
        this.traits.addAll(traits);
    }

    public Set<Conversation> getConversations() {
        return conversations;
    }

    public void setConversations(Set<Conversation> conversations) {
        this.conversations = conversations;
    }

    public String getProfilePictureId() {
        return profilePictureId;
    }

    public void setProfilePictureId(String profilePicture) {
        this.profilePictureId = profilePicture;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
