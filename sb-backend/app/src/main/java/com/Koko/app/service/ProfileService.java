package com.Koko.app.service;

import com.Koko.app.domain.Profile;
import com.Koko.app.repositories.ProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class ProfileService {
    @Autowired
    ProfileRepository profileRepository;

    public void save(Profile profile) {
        profileRepository.save(profile);
    }
    public Profile getProfile(int id) {
        Profile profile = profileRepository.findById(id).orElse(null);
        if (profile == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "profile not found"
            );
        }
        return profile;
    }
    public Set<Profile> getProfiles(Set<String> profileIDs) {
        Set<Profile> profiles = new HashSet<>();
        for (String traitsName : profileIDs) {
            Profile profile = getProfile(Integer.parseInt(traitsName));
            profiles.add(profile);
        }
        return profiles;
    }
    public Profile getProfileByEmail(String email) {
        return profileRepository.findByEmail(email).orElse(null);
    }
    public List<Profile> getProfiles() {
        return profileRepository.findAll();
    }

}
