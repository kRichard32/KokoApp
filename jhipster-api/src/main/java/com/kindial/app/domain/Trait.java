package com.kindial.app.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/**
 * A Trait.
 */
@Entity
@Table(name = "trait")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@org.springframework.data.elasticsearch.annotations.Document(indexName = "trait")
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Trait implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "sequenceGenerator")
    @SequenceGenerator(name = "sequenceGenerator")
    @Column(name = "id")
    private Long id;

    @Column(name = "trait_name")
    @org.springframework.data.elasticsearch.annotations.Field(type = org.springframework.data.elasticsearch.annotations.FieldType.Text)
    private String traitName;

    @ManyToMany(fetch = FetchType.LAZY, mappedBy = "traits")
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
    @org.springframework.data.annotation.Transient
    @JsonIgnoreProperties(value = { "user", "traits", "messages", "message" }, allowSetters = true)
    private Set<Profile> profiles = new HashSet<>();

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public Long getId() {
        return this.id;
    }

    public Trait id(Long id) {
        this.setId(id);
        return this;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTraitName() {
        return this.traitName;
    }

    public Trait traitName(String traitName) {
        this.setTraitName(traitName);
        return this;
    }

    public void setTraitName(String traitName) {
        this.traitName = traitName;
    }

    public Set<Profile> getProfiles() {
        return this.profiles;
    }

    public void setProfiles(Set<Profile> profiles) {
        if (this.profiles != null) {
            this.profiles.forEach(i -> i.removeTrait(this));
        }
        if (profiles != null) {
            profiles.forEach(i -> i.addTrait(this));
        }
        this.profiles = profiles;
    }

    public Trait profiles(Set<Profile> profiles) {
        this.setProfiles(profiles);
        return this;
    }

    public Trait addProfile(Profile profile) {
        this.profiles.add(profile);
        profile.getTraits().add(this);
        return this;
    }

    public Trait removeProfile(Profile profile) {
        this.profiles.remove(profile);
        profile.getTraits().remove(this);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Trait)) {
            return false;
        }
        return getId() != null && getId().equals(((Trait) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "Trait{" +
            "id=" + getId() +
            ", traitName='" + getTraitName() + "'" +
            "}";
    }
}
