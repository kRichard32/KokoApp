package com.Koko.app.domain;

import jakarta.persistence.*;

import java.util.ArrayList;

@Entity
public class Trait {

    @Id
    private Long id;

    private String traitName;

    @ManyToMany
    private ArrayList<Profile> profiles;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTraitName() {
        return traitName;
    }

    public void setTraitName(String traitName) {
        this.traitName = traitName;
    }

    public ArrayList<Profile> getProfiles() {
        return profiles;
    }

    public void setProfiles(ArrayList<Profile> profiles) {
        this.profiles = profiles;
    }
}
