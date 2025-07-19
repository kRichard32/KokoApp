package com.Koko.app.domain;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;

import static com.Koko.app.domain.jsonTools.getStrings;

public class ConversationTransfer {

    private int id;

    private String jsonUsers;


    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public List<String> getUserIDs() {
        return getStrings(jsonUsers);
    }

    public void setJsonUsers(String jsonUsers) {
        this.jsonUsers = jsonUsers;
    }
}
