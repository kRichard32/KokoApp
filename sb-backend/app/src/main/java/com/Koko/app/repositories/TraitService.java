package com.Koko.app.repositories;

import com.Koko.app.domain.Trait;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class TraitService {
    @Autowired
    TraitRepository traitRepository;

    public void save(Trait trait) {
        traitRepository.save(trait);
    }
    public Optional<Trait> getMessage(int id) {
        return traitRepository.findById(id);
    }
    public Optional<Trait> getTraitByName(String name) {
        List<Trait> traits = traitRepository.findByTraitName(name);
        if (traits.isEmpty()){
            return Optional.empty();
        }
        return Optional.ofNullable(traits.get(0));
    }
    public Trait createNewTrait(String traitName){
        Trait newTrait = new Trait();
        newTrait.setTraitName(traitName);
        save(newTrait);
        return newTrait;
    }
    public Set<Trait> getTraits(List<String> traitsNames) {
        Set<Trait> traits = new HashSet<>();
        for (String traitsName : traitsNames) {
            Trait trait = getTraitByName(traitsName).orElse(null);
            if (trait != null) {
                traits.add(trait);
            } else {
                Trait newTrait = createNewTrait(traitsName);
                traits.add(newTrait);
            }
        }
        return traits;
    }

}
