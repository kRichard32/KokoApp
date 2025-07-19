package com.Koko.app.rest;


import com.Koko.app.domain.Message;
import com.Koko.app.domain.Profile;
import com.Koko.app.domain.ProfileTransfer;
import com.Koko.app.repositories.FileService;
import com.Koko.app.repositories.MessageService;
import com.Koko.app.repositories.ProfileService;
import com.Koko.app.repositories.TraitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileResource {
    @Autowired
    private TraitService traitService;

    @Autowired
    private ProfileService profileService;

    @Autowired
    private FileService fileService;

    @ResponseStatus(value = HttpStatus.OK)

    @CrossOrigin()
    @PostMapping("/create")
    public Map<String, String> createProfile(@RequestBody ProfileTransfer profileData) {
        List<String> traits = profileData.getTraits();
        Profile profile = new Profile();
        profile.setTraits(traitService.getTraits(traits));
        profileService.save(profile);

        HashMap<String, String> map = new HashMap<>();

        map.put("id", profile.getId().toString());
        return map;
    }

    @CrossOrigin()
    @PostMapping("/addTrait")
    public Map<String, String> addTrait(@RequestBody ProfileTransfer profileData) {
        List<String> traits = profileData.getTraits();
        Profile profile = profileService.getProfile(profileData.getId());
        HashMap<String, String> map = new HashMap<>();
        profile.addTraits(traitService.getTraits(traits));
        profileService.save(profile);

        map.put("id", profile.getId().toString());
        return map;
    }
    @CrossOrigin()
    @PostMapping("/addProfilePicture")
    public Map<String, String> addTrait(@RequestPart MultipartFile profilePicture, @RequestPart ProfileTransfer profileData) {
        Profile profile = profileService.getProfile(profileData.getId());
        String profilePicturePath = fileService.do_POST(profilePicture);
        profile.setProfilePicture(profilePicturePath);
        HashMap<String, String> map = new HashMap<>();
        profileService.save(profile);

        map.put("id", profile.getId().toString());
        return map;
    }
    @CrossOrigin()
    @GetMapping("/getProfile")
    public Profile getProfile(@RequestParam("id") int id) {
        return profileService.getProfile(id);
    }
}
