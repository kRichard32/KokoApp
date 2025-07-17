package com.Koko.app.rest;


import com.Koko.app.domain.Message;
import com.Koko.app.domain.Profile;
import com.Koko.app.domain.ProfileTransfer;
import com.Koko.app.repositories.MessageService;
import com.Koko.app.repositories.ProfileService;
import com.Koko.app.repositories.TraitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileResource {
    @Autowired
    private TraitService traitService;

    @Autowired
    private ProfileService profileService;

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

        HashMap<String, String> map = new HashMap<>();

        map.put("", "");
        return map;
    }
}
