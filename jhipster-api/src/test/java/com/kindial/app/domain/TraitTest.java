package com.kindial.app.domain;

import static com.kindial.app.domain.ProfileTestSamples.*;
import static com.kindial.app.domain.TraitTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.kindial.app.web.rest.TestUtil;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class TraitTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Trait.class);
        Trait trait1 = getTraitSample1();
        Trait trait2 = new Trait();
        assertThat(trait1).isNotEqualTo(trait2);

        trait2.setId(trait1.getId());
        assertThat(trait1).isEqualTo(trait2);

        trait2 = getTraitSample2();
        assertThat(trait1).isNotEqualTo(trait2);
    }

    @Test
    void profileTest() {
        Trait trait = getTraitRandomSampleGenerator();
        Profile profileBack = getProfileRandomSampleGenerator();

        trait.addProfile(profileBack);
        assertThat(trait.getProfiles()).containsOnly(profileBack);
        assertThat(profileBack.getTraits()).containsOnly(trait);

        trait.removeProfile(profileBack);
        assertThat(trait.getProfiles()).doesNotContain(profileBack);
        assertThat(profileBack.getTraits()).doesNotContain(trait);

        trait.profiles(new HashSet<>(Set.of(profileBack)));
        assertThat(trait.getProfiles()).containsOnly(profileBack);
        assertThat(profileBack.getTraits()).containsOnly(trait);

        trait.setProfiles(new HashSet<>());
        assertThat(trait.getProfiles()).doesNotContain(profileBack);
        assertThat(profileBack.getTraits()).doesNotContain(trait);
    }
}
