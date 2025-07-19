package com.Koko.app.domain;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;

import java.util.ArrayList;
import java.util.List;

import static com.Koko.app.domain.jsonTools.getStrings;

public class ProfileTransfer {

    private int id;

    private String jsonTraits;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public void setJsonTraits(String jsonTraits) {
        this.jsonTraits = jsonTraits;
    }

    public List<String> getTraits() {
        return getStrings(jsonTraits);
    }

}
