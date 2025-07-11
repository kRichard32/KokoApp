package com.kindial.app.repository;

import com.kindial.app.domain.Profile;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;

public interface ProfileRepositoryWithBagRelationships {
    Optional<Profile> fetchBagRelationships(Optional<Profile> profile);

    List<Profile> fetchBagRelationships(List<Profile> profiles);

    Page<Profile> fetchBagRelationships(Page<Profile> profiles);
}
