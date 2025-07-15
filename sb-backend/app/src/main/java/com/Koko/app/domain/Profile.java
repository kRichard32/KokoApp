package com.Koko.app.domain;

import jakarta.persistence.*;

import java.sql.Date;
import java.util.ArrayList;

@Entity
public class Profile {

    @Id
    private Long id;

    @ManyToMany
    private ArrayList<Trait> trait;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ArrayList<Trait> getTrait() {
        return trait;
    }

    public void setTrait(ArrayList<Trait> trait) {
        this.trait = trait;
    }
}
