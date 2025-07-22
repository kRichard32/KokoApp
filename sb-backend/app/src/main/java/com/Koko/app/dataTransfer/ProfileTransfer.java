package com.Koko.app.dataTransfer;

import java.util.List;

import static com.Koko.app.domain.jsonTools.getStrings;

public class ProfileTransfer {
    private String name;

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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

}
