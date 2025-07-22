package com.Koko.app.rest;


import com.Koko.app.domain.Profile;
import com.Koko.app.dataTransfer.ProfileTransfer;
import com.Koko.app.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    @Autowired
    private TraitService traitService;

    @Autowired
    private ProfileService profileService;

//    @Autowired
//    private FileService fileService;
    @Autowired
    private GoogleDriveFileService googleDriveFileService;

    @Autowired
    private JwtService jwtService;

    @ResponseStatus(value = HttpStatus.OK)

    @PostMapping("/create")
    public Map<String, String> createProfile(@CookieValue(value = "token", required = false) String token,
                                             @RequestBody ProfileTransfer profileData) {
        Map<String, Object> userInfo = jwtService.decodeIdToken(token);
        List<String> traits = profileData.getTraits();
        Profile profile = new Profile();
        profile.setEmail(userInfo.get("email").toString());
        profile.setTraits(traitService.getTraits(traits));
        profile.setName(profileData.getName());
        profileService.save(profile);

        HashMap<String, String> map = new HashMap<>();

        map.put("id", profile.getId().toString());
        return map;
    }

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
    @PostMapping("/addProfilePicture")
    public Map<String, String> addTrait(@CookieValue(value = "token", required = false) String token, @RequestPart MultipartFile profilePicture) {
        Map<String, Object> userInfo = jwtService.decodeIdToken(token);
        Profile profile = profileService.getProfileByEmail((String) userInfo.get("email"));
        String profilePicturePath = googleDriveFileService.do_POST(profilePicture);
        profile.setProfilePictureId(profilePicturePath);
        HashMap<String, String> map = new HashMap<>();
        profileService.save(profile);

        map.put("id", profile.getId().toString());
        return map;
    }
    @GetMapping("/getProfile")
    public Profile getProfile(
            @RequestParam("id") int id) {
        return profileService.getProfile(id);
    }
    @GetMapping("/getUserProfilePicture")
    public byte[] getProfilePicture(
            @CookieValue(value = "token", required = false) String token) {
        Map<String, Object> userInfo = jwtService.decodeIdToken(token);
        Profile profile = profileService.getProfileByEmail((String) userInfo.get("email"));

        return googleDriveFileService.do_GET(profile.getProfilePictureId());
    }
    @GetMapping("/getUserProfile")
    public Profile getUserProfile(
            @CookieValue(value = "token", required = false) String token) {
        Map<String, Object> userInfo = jwtService.decodeIdToken(token);
        return profileService.getProfileByEmail((String) userInfo.get("email"));
    }
}
