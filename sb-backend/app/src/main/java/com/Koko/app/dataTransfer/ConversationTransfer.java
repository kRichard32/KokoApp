package com.Koko.app.dataTransfer;


import java.util.List;
import java.util.Set;

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

    public Set<String> getUserIDs() {
        return getStrings(jsonUsers);
    }

    public void setJsonUsers(String jsonUsers) {
        this.jsonUsers = jsonUsers;
    }
}
