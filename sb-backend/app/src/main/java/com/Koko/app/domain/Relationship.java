package com.Koko.app.domain;

import jakarta.persistence.*;

import java.util.Set;

@Entity
public class Relationship {
    @Id
    private Long id;

    @ManyToOne
    private Profile from;

    @ManyToOne
    private Profile to;

    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(name = "relationship_traits", joinColumns = {@JoinColumn(name = "relationships_id")}, inverseJoinColumns = {@JoinColumn(name = "traits_id")},
            uniqueConstraints = {@UniqueConstraint(columnNames = {"relationships_id", "traits_id"})})
    private Set<Trait> traits;

    public void setId(Long id) {
        this.id = id;
    }

    public Long getId() {
        return id;
    }

    public Profile getFrom() {
        return from;
    }

    public void setFrom(Profile from) {
        this.from = from;
    }

    public Profile getTo() {
        return to;
    }

    public void setTo(Profile to) {
        this.to = to;
    }

    public Set<Trait> getTrait() {
        return traits;
    }

    public void setTraits(Set<Trait> traits) {
        this.traits = traits;
    }
    public void addTraits(Set<Trait> traits) {
        this.traits.addAll(traits);
    }
}
