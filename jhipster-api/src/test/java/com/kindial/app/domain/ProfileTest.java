package com.kindial.app.domain;

import static com.kindial.app.domain.ConversationTestSamples.*;
import static com.kindial.app.domain.MessageTestSamples.*;
import static com.kindial.app.domain.ProfileTestSamples.*;
import static com.kindial.app.domain.TraitTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.kindial.app.web.rest.TestUtil;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class ProfileTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Profile.class);
        Profile profile1 = getProfileSample1();
        Profile profile2 = new Profile();
        assertThat(profile1).isNotEqualTo(profile2);

        profile2.setId(profile1.getId());
        assertThat(profile1).isEqualTo(profile2);

        profile2 = getProfileSample2();
        assertThat(profile1).isNotEqualTo(profile2);
    }

    @Test
    void traitTest() {
        Profile profile = getProfileRandomSampleGenerator();
        Trait traitBack = getTraitRandomSampleGenerator();

        profile.addTrait(traitBack);
        assertThat(profile.getTraits()).containsOnly(traitBack);

        profile.removeTrait(traitBack);
        assertThat(profile.getTraits()).doesNotContain(traitBack);

        profile.traits(new HashSet<>(Set.of(traitBack)));
        assertThat(profile.getTraits()).containsOnly(traitBack);

        profile.setTraits(new HashSet<>());
        assertThat(profile.getTraits()).doesNotContain(traitBack);
    }

    @Test
    void messagesTest() {
        Profile profile = getProfileRandomSampleGenerator();
        Conversation conversationBack = getConversationRandomSampleGenerator();

        profile.addMessages(conversationBack);
        assertThat(profile.getMessages()).containsOnly(conversationBack);

        profile.removeMessages(conversationBack);
        assertThat(profile.getMessages()).doesNotContain(conversationBack);

        profile.messages(new HashSet<>(Set.of(conversationBack)));
        assertThat(profile.getMessages()).containsOnly(conversationBack);

        profile.setMessages(new HashSet<>());
        assertThat(profile.getMessages()).doesNotContain(conversationBack);
    }

    @Test
    void messageTest() {
        Profile profile = getProfileRandomSampleGenerator();
        Message messageBack = getMessageRandomSampleGenerator();

        profile.setMessage(messageBack);
        assertThat(profile.getMessage()).isEqualTo(messageBack);
        assertThat(messageBack.getProfile()).isEqualTo(profile);

        profile.message(null);
        assertThat(profile.getMessage()).isNull();
        assertThat(messageBack.getProfile()).isNull();
    }
}
