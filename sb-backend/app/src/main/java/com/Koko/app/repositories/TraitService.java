package com.Koko.app.repositories;

import com.Koko.app.domain.Trait;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class TraitService {
    @Autowired
    TraitRepository traitRepository;

    public void save(Trait message) {
        traitRepository.save(message);
    }
    public Optional<Trait> getMessage(int id) {
        return traitRepository.findById(id);
    }

}
