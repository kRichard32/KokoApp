package com.Koko.app.repositories;

import com.Koko.app.domain.Trait;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TraitRepository extends JpaRepository<Trait, Integer> {
    List<Trait> findByTraitName(String name);

}
