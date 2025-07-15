package com.Koko.app.repositories;

import com.Koko.app.domain.Profile;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class ProfileService {
    @Autowired
    ProfileRepository profileRepository;

    public void save(Profile message) {
        profileRepository.save(message);
    }
    public Optional<Profile> getMessage(int id) {
        return profileRepository.findById(id);
    }

}
