package com.kindial.app.domain;

import static com.kindial.app.domain.ConversationTestSamples.*;
import static com.kindial.app.domain.MessageTestSamples.*;
import static com.kindial.app.domain.ProfileTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.kindial.app.web.rest.TestUtil;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class ConversationTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Conversation.class);
        Conversation conversation1 = getConversationSample1();
        Conversation conversation2 = new Conversation();
        assertThat(conversation1).isNotEqualTo(conversation2);

        conversation2.setId(conversation1.getId());
        assertThat(conversation1).isEqualTo(conversation2);

        conversation2 = getConversationSample2();
        assertThat(conversation1).isNotEqualTo(conversation2);
    }

    @Test
    void messageTest() {
        Conversation conversation = getConversationRandomSampleGenerator();
        Message messageBack = getMessageRandomSampleGenerator();

        conversation.addMessage(messageBack);
        assertThat(conversation.getMessages()).containsOnly(messageBack);
        assertThat(messageBack.getConversation()).isEqualTo(conversation);

        conversation.removeMessage(messageBack);
        assertThat(conversation.getMessages()).doesNotContain(messageBack);
        assertThat(messageBack.getConversation()).isNull();

        conversation.messages(new HashSet<>(Set.of(messageBack)));
        assertThat(conversation.getMessages()).containsOnly(messageBack);
        assertThat(messageBack.getConversation()).isEqualTo(conversation);

        conversation.setMessages(new HashSet<>());
        assertThat(conversation.getMessages()).doesNotContain(messageBack);
        assertThat(messageBack.getConversation()).isNull();
    }

    @Test
    void profileTest() {
        Conversation conversation = getConversationRandomSampleGenerator();
        Profile profileBack = getProfileRandomSampleGenerator();

        conversation.addProfile(profileBack);
        assertThat(conversation.getProfiles()).containsOnly(profileBack);
        assertThat(profileBack.getMessages()).containsOnly(conversation);

        conversation.removeProfile(profileBack);
        assertThat(conversation.getProfiles()).doesNotContain(profileBack);
        assertThat(profileBack.getMessages()).doesNotContain(conversation);

        conversation.profiles(new HashSet<>(Set.of(profileBack)));
        assertThat(conversation.getProfiles()).containsOnly(profileBack);
        assertThat(profileBack.getMessages()).containsOnly(conversation);

        conversation.setProfiles(new HashSet<>());
        assertThat(conversation.getProfiles()).doesNotContain(profileBack);
        assertThat(profileBack.getMessages()).doesNotContain(conversation);
    }
}
