package com.Koko.app.repositories;

import com.Koko.app.domain.Profile;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class ProfileService {
    @Autowired
    ProfileRepository profileRepository;

    public void save(Profile profile) {
        profileRepository.save(profile);
    }
    public Optional<Profile> getProfile(int id) {
        return profileRepository.findById(id);
    }

}
