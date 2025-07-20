package com.Koko.app.service;

import com.Koko.app.domain.UserKoko;
import com.Koko.app.repositories.UserKokoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserKokoService {
    @Autowired
    UserKokoRepository userRepository;

    public void save(UserKoko userKoko) {
        userRepository.save(userKoko);
    }
    public Optional<UserKoko> getUser(long id) {
        return userRepository.findById(id);
    }

}
