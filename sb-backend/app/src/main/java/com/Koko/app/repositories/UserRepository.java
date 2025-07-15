package com.Koko.app.repositories;

import com.Koko.app.domain.UserKoko;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<UserKoko, Integer> {
}
