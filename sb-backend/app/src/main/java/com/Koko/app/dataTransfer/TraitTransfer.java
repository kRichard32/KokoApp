package com.Koko.app.dataTransfer;

import java.util.Set;

import static com.Koko.app.domain.jsonTools.getStrings;

public class TraitTransfer {

    private String jsonTraits;

    public void setJsonTraits(String jsonTraits) {
        this.jsonTraits = jsonTraits;
    }

    public Set<String> getTraits() {
        return getStrings(jsonTraits);
    }

}
