package com.Koko.app.repositories;

import com.Koko.app.domain.Trait;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TraitRepository extends JpaRepository<Trait, Integer> {
}
