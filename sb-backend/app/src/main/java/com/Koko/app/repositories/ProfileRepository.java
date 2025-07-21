package com.Koko.app.repositories;

import com.Koko.app.domain.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, Integer> {
    Optional<Profile> findByEmail(String email);
}
