package com.kindial.app.repository;

import com.kindial.app.domain.Trait;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the Trait entity.
 */
@SuppressWarnings("unused")
@Repository
public interface TraitRepository extends JpaRepository<Trait, Long> {}
