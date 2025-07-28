package com.Koko.app.rest;

import com.Koko.app.dataTransfer.TraitTransfer;
import com.Koko.app.domain.Profile;
import com.Koko.app.domain.Relationship;
import com.Koko.app.repositories.RelationshipRepository;
import com.Koko.app.service.JwtService;
import com.Koko.app.service.ProfileService;
import com.Koko.app.service.TraitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/relationship")
public class RelationshipController {
    @Autowired
    private RelationshipRepository relationshipRepository;

    @Autowired
    private ProfileService profileService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private TraitService traitService;

    @GetMapping("/getRelationships")
    public Set<Relationship> getRelationships(
            @CookieValue(value = "token", required = false) String token) {
        Map<String, Object> userInfo = jwtService.decodeIdToken(token);
        Profile profile = profileService.getProfileByEmail((String) userInfo.get("email"));
        return relationshipRepository.findByFromId(profile.getId());
    }

    @PostMapping("/setRelationships")
    public Map<String, String> setRelationship(@CookieValue(value = "token", required = false) String token,
                                        @RequestBody TraitTransfer profileData, @RequestParam long toId) {
        Set<String> traits = profileData.getTraits();
        Map<String, Object> userInfo = jwtService.decodeIdToken(token);
        Profile profile = profileService.getProfileByEmail((String) userInfo.get("email"));
        Relationship relationship = relationshipRepository.findByFromIdAndToId(profile.getId(),toId);
        Profile toProfile = profileService.getProfile(toId);

        if (toProfile == null) {
            return null;
        }

        if (relationship != null) {
            relationship.addTraits(traitService.getTraits(traits));
        }
        else {
            relationship = new Relationship();
            relationship.setFrom(profile);
            relationship.setTo(toProfile);
            relationship.setTraits(traitService.getTraits(traits));
        }
        relationshipRepository.save(relationship);

        HashMap<String, String> map = new HashMap<>();

        map.put("id", relationship.getId().toString());
        return map;
    }


}
