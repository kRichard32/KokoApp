package com.Koko.app.repositories;

import com.Koko.app.domain.UserKoko;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {
    @Autowired
    UserRepository userRepository;

    public void save(UserKoko message) {
        userRepository.save(message);
    }
    public Optional<UserKoko> getMessage(int id) {
        return userRepository.findById(id);
    }

}
