package com.Koko.app.rest;


import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.Koko.app.dataTransfer.ProfileTransfer;
import com.Koko.app.domain.Profile;
import com.Koko.app.service.GoogleDriveFileService;
import com.Koko.app.service.JwtService;
import com.Koko.app.service.ProfileService;
import com.Koko.app.service.TraitService;

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
        Set<String> traits = profileData.getTraits();
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
        Set<String> traits = profileData.getTraits();
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
    @GetMapping("/getMatchUsers")
    public List<Profile> getMatchUsers(
            @CookieValue(value = "token", required = false) String token) {
        Map<String, Object> userInfo = jwtService.decodeIdToken(token);
        Profile profile = profileService.getProfileByEmail((String) userInfo.get("email"));
        return profileService.getProfiles().stream()
            .filter(p -> !p.getId().equals(profile.getId()))
            .toList();
    }
    @GetMapping("/getProfilePicture")
    public byte[] getProfilePicture(
            @RequestParam("id") int id) {

        Profile profile = profileService.getProfile(id);
        return googleDriveFileService.do_GET(profile.getProfilePictureId());
    }
    @GetMapping("/getUserProfilePicture")
    public byte[] getUserProfilePicture(
            @CookieValue(value = "token", required = false) String token) {
        Map<String, Object> userInfo = jwtService.decodeIdToken(token);
        Profile profile = profileService.getProfileByEmail((String) userInfo.get("email"));
        if (profile.getProfilePictureId() == null) {
            return null;
        }
        return googleDriveFileService.do_GET(profile.getProfilePictureId());
    }
    @GetMapping("/getUserProfile")
    public Profile getUserProfile(
            @CookieValue(value = "token", required = false) String token) {
        Map<String, Object> userInfo = jwtService.decodeIdToken(token);
        return profileService.getProfileByEmail((String) userInfo.get("email"));
    }

}
