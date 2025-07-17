package com.Koko.app.domain;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;

import java.util.ArrayList;
import java.util.List;

public class ProfileTransfer {

    private Long id;

    private String jsonTraits;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setJsonTraits(String jsonTraits) {
        this.jsonTraits = jsonTraits;
    }

    public List<String> getTraits() {
        ObjectMapper mapper = new ObjectMapper();
        List<String> result;
        try{
            result = mapper.readValue(jsonTraits, new TypeReference<>(){});
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
        return result;
    }

}
