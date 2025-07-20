package com.Koko.app.repositories;

import com.Koko.app.domain.UserKoko;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserKokoRepository extends CrudRepository<UserKoko, Long> {
    Optional<UserKoko> findByVerificationCode(String verificationCode);
    Optional<UserKoko> findByEmail(String email);
    Optional<UserKoko> findByUsername(String username);
}
