package com.Koko.app.repositories;

import com.Koko.app.domain.Relationship;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Set;

public interface RelationshipRepository extends JpaRepository<Relationship, Long> {
    Set<Relationship> findByFromId(Long users_id);
    Relationship findByFromIdAndToId(Long from_id, Long to_id);
}
