package com.kindial.app.web.rest;

import static com.kindial.app.domain.ConversationAsserts.*;
import static com.kindial.app.web.rest.TestUtil.createUpdateProxyForBean;
import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.hamcrest.Matchers.hasItem;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kindial.app.IntegrationTest;
import com.kindial.app.domain.Conversation;
import com.kindial.app.repository.ConversationRepository;
import com.kindial.app.repository.search.ConversationSearchRepository;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.Random;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import org.assertj.core.util.IterableUtil;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.data.util.Streamable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests for the {@link ConversationResource} REST controller.
 */
@IntegrationTest
@AutoConfigureMockMvc
@WithMockUser
class ConversationResourceIT {

    private static final String DEFAULT_LAST_MESSAGE_ID = "AAAAAAAAAA";
    private static final String UPDATED_LAST_MESSAGE_ID = "BBBBBBBBBB";

    private static final String DEFAULT_CREATED_AT = "AAAAAAAAAA";
    private static final String UPDATED_CREATED_AT = "BBBBBBBBBB";

    private static final String DEFAULT_UPDATED_AT = "AAAAAAAAAA";
    private static final String UPDATED_UPDATED_AT = "BBBBBBBBBB";

    private static final String DEFAULT_CONVERSATION_NAME = "AAAAAAAAAA";
    private static final String UPDATED_CONVERSATION_NAME = "BBBBBBBBBB";

    private static final String ENTITY_API_URL = "/api/conversations";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";
    private static final String ENTITY_SEARCH_API_URL = "/api/conversations/_search";

    private static Random random = new Random();
    private static AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    @Autowired
    private ObjectMapper om;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private ConversationSearchRepository conversationSearchRepository;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restConversationMockMvc;

    private Conversation conversation;

    private Conversation insertedConversation;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Conversation createEntity() {
        return new Conversation()
            .lastMessageID(DEFAULT_LAST_MESSAGE_ID)
            .createdAt(DEFAULT_CREATED_AT)
            .updatedAt(DEFAULT_UPDATED_AT)
            .conversationName(DEFAULT_CONVERSATION_NAME);
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Conversation createUpdatedEntity() {
        return new Conversation()
            .lastMessageID(UPDATED_LAST_MESSAGE_ID)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT)
            .conversationName(UPDATED_CONVERSATION_NAME);
    }

    @BeforeEach
    void initTest() {
        conversation = createEntity();
    }

    @AfterEach
    void cleanup() {
        if (insertedConversation != null) {
            conversationRepository.delete(insertedConversation);
            conversationSearchRepository.delete(insertedConversation);
            insertedConversation = null;
        }
    }

    @Test
    @Transactional
    void createConversation() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(conversationSearchRepository.findAll());
        // Create the Conversation
        var returnedConversation = om.readValue(
            restConversationMockMvc
                .perform(
                    post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(conversation))
                )
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            Conversation.class
        );

        // Validate the Conversation in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        assertConversationUpdatableFieldsEquals(returnedConversation, getPersistedConversation(returnedConversation));

        await()
            .atMost(5, TimeUnit.SECONDS)
            .untilAsserted(() -> {
                int searchDatabaseSizeAfter = IterableUtil.sizeOf(conversationSearchRepository.findAll());
                assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore + 1);
            });

        insertedConversation = returnedConversation;
    }

    @Test
    @Transactional
    void createConversationWithExistingId() throws Exception {
        // Create the Conversation with an existing ID
        conversation.setId(1L);

        long databaseSizeBeforeCreate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(conversationSearchRepository.findAll());

        // An entity with an existing ID cannot be created, so this API call must fail
        restConversationMockMvc
            .perform(post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(conversation)))
            .andExpect(status().isBadRequest());

        // Validate the Conversation in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(conversationSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void getAllConversations() throws Exception {
        // Initialize the database
        insertedConversation = conversationRepository.saveAndFlush(conversation);

        // Get all the conversationList
        restConversationMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(conversation.getId().intValue())))
            .andExpect(jsonPath("$.[*].lastMessageID").value(hasItem(DEFAULT_LAST_MESSAGE_ID)))
            .andExpect(jsonPath("$.[*].createdAt").value(hasItem(DEFAULT_CREATED_AT)))
            .andExpect(jsonPath("$.[*].updatedAt").value(hasItem(DEFAULT_UPDATED_AT)))
            .andExpect(jsonPath("$.[*].conversationName").value(hasItem(DEFAULT_CONVERSATION_NAME)));
    }

    @Test
    @Transactional
    void getConversation() throws Exception {
        // Initialize the database
        insertedConversation = conversationRepository.saveAndFlush(conversation);

        // Get the conversation
        restConversationMockMvc
            .perform(get(ENTITY_API_URL_ID, conversation.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(conversation.getId().intValue()))
            .andExpect(jsonPath("$.lastMessageID").value(DEFAULT_LAST_MESSAGE_ID))
            .andExpect(jsonPath("$.createdAt").value(DEFAULT_CREATED_AT))
            .andExpect(jsonPath("$.updatedAt").value(DEFAULT_UPDATED_AT))
            .andExpect(jsonPath("$.conversationName").value(DEFAULT_CONVERSATION_NAME));
    }

    @Test
    @Transactional
    void getNonExistingConversation() throws Exception {
        // Get the conversation
        restConversationMockMvc.perform(get(ENTITY_API_URL_ID, Long.MAX_VALUE)).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingConversation() throws Exception {
        // Initialize the database
        insertedConversation = conversationRepository.saveAndFlush(conversation);

        long databaseSizeBeforeUpdate = getRepositoryCount();
        conversationSearchRepository.save(conversation);
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(conversationSearchRepository.findAll());

        // Update the conversation
        Conversation updatedConversation = conversationRepository.findById(conversation.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedConversation are not directly saved in db
        em.detach(updatedConversation);
        updatedConversation
            .lastMessageID(UPDATED_LAST_MESSAGE_ID)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT)
            .conversationName(UPDATED_CONVERSATION_NAME);

        restConversationMockMvc
            .perform(
                put(ENTITY_API_URL_ID, updatedConversation.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(updatedConversation))
            )
            .andExpect(status().isOk());

        // Validate the Conversation in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedConversationToMatchAllProperties(updatedConversation);

        await()
            .atMost(5, TimeUnit.SECONDS)
            .untilAsserted(() -> {
                int searchDatabaseSizeAfter = IterableUtil.sizeOf(conversationSearchRepository.findAll());
                assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
                List<Conversation> conversationSearchList = Streamable.of(conversationSearchRepository.findAll()).toList();
                Conversation testConversationSearch = conversationSearchList.get(searchDatabaseSizeAfter - 1);

                assertConversationAllPropertiesEquals(testConversationSearch, updatedConversation);
            });
    }

    @Test
    @Transactional
    void putNonExistingConversation() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(conversationSearchRepository.findAll());
        conversation.setId(longCount.incrementAndGet());

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restConversationMockMvc
            .perform(
                put(ENTITY_API_URL_ID, conversation.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(conversation))
            )
            .andExpect(status().isBadRequest());

        // Validate the Conversation in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(conversationSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void putWithIdMismatchConversation() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(conversationSearchRepository.findAll());
        conversation.setId(longCount.incrementAndGet());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restConversationMockMvc
            .perform(
                put(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(conversation))
            )
            .andExpect(status().isBadRequest());

        // Validate the Conversation in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(conversationSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamConversation() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(conversationSearchRepository.findAll());
        conversation.setId(longCount.incrementAndGet());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restConversationMockMvc
            .perform(put(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(conversation)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Conversation in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(conversationSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void partialUpdateConversationWithPatch() throws Exception {
        // Initialize the database
        insertedConversation = conversationRepository.saveAndFlush(conversation);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the conversation using partial update
        Conversation partialUpdatedConversation = new Conversation();
        partialUpdatedConversation.setId(conversation.getId());

        partialUpdatedConversation
            .lastMessageID(UPDATED_LAST_MESSAGE_ID)
            .updatedAt(UPDATED_UPDATED_AT)
            .conversationName(UPDATED_CONVERSATION_NAME);

        restConversationMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedConversation.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedConversation))
            )
            .andExpect(status().isOk());

        // Validate the Conversation in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertConversationUpdatableFieldsEquals(
            createUpdateProxyForBean(partialUpdatedConversation, conversation),
            getPersistedConversation(conversation)
        );
    }

    @Test
    @Transactional
    void fullUpdateConversationWithPatch() throws Exception {
        // Initialize the database
        insertedConversation = conversationRepository.saveAndFlush(conversation);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the conversation using partial update
        Conversation partialUpdatedConversation = new Conversation();
        partialUpdatedConversation.setId(conversation.getId());

        partialUpdatedConversation
            .lastMessageID(UPDATED_LAST_MESSAGE_ID)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT)
            .conversationName(UPDATED_CONVERSATION_NAME);

        restConversationMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedConversation.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedConversation))
            )
            .andExpect(status().isOk());

        // Validate the Conversation in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertConversationUpdatableFieldsEquals(partialUpdatedConversation, getPersistedConversation(partialUpdatedConversation));
    }

    @Test
    @Transactional
    void patchNonExistingConversation() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(conversationSearchRepository.findAll());
        conversation.setId(longCount.incrementAndGet());

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restConversationMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, conversation.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(conversation))
            )
            .andExpect(status().isBadRequest());

        // Validate the Conversation in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(conversationSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void patchWithIdMismatchConversation() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(conversationSearchRepository.findAll());
        conversation.setId(longCount.incrementAndGet());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restConversationMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(conversation))
            )
            .andExpect(status().isBadRequest());

        // Validate the Conversation in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(conversationSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamConversation() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(conversationSearchRepository.findAll());
        conversation.setId(longCount.incrementAndGet());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restConversationMockMvc
            .perform(
                patch(ENTITY_API_URL).with(csrf()).contentType("application/merge-patch+json").content(om.writeValueAsBytes(conversation))
            )
            .andExpect(status().isMethodNotAllowed());

        // Validate the Conversation in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(conversationSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void deleteConversation() throws Exception {
        // Initialize the database
        insertedConversation = conversationRepository.saveAndFlush(conversation);
        conversationRepository.save(conversation);
        conversationSearchRepository.save(conversation);

        long databaseSizeBeforeDelete = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(conversationSearchRepository.findAll());
        assertThat(searchDatabaseSizeBefore).isEqualTo(databaseSizeBeforeDelete);

        // Delete the conversation
        restConversationMockMvc
            .perform(delete(ENTITY_API_URL_ID, conversation.getId()).with(csrf()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(conversationSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore - 1);
    }

    @Test
    @Transactional
    void searchConversation() throws Exception {
        // Initialize the database
        insertedConversation = conversationRepository.saveAndFlush(conversation);
        conversationSearchRepository.save(conversation);

        // Search the conversation
        restConversationMockMvc
            .perform(get(ENTITY_SEARCH_API_URL + "?query=id:" + conversation.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(conversation.getId().intValue())))
            .andExpect(jsonPath("$.[*].lastMessageID").value(hasItem(DEFAULT_LAST_MESSAGE_ID)))
            .andExpect(jsonPath("$.[*].createdAt").value(hasItem(DEFAULT_CREATED_AT)))
            .andExpect(jsonPath("$.[*].updatedAt").value(hasItem(DEFAULT_UPDATED_AT)))
            .andExpect(jsonPath("$.[*].conversationName").value(hasItem(DEFAULT_CONVERSATION_NAME)));
    }

    protected long getRepositoryCount() {
        return conversationRepository.count();
    }

    protected void assertIncrementedRepositoryCount(long countBefore) {
        assertThat(countBefore + 1).isEqualTo(getRepositoryCount());
    }

    protected void assertDecrementedRepositoryCount(long countBefore) {
        assertThat(countBefore - 1).isEqualTo(getRepositoryCount());
    }

    protected void assertSameRepositoryCount(long countBefore) {
        assertThat(countBefore).isEqualTo(getRepositoryCount());
    }

    protected Conversation getPersistedConversation(Conversation conversation) {
        return conversationRepository.findById(conversation.getId()).orElseThrow();
    }

    protected void assertPersistedConversationToMatchAllProperties(Conversation expectedConversation) {
        assertConversationAllPropertiesEquals(expectedConversation, getPersistedConversation(expectedConversation));
    }

    protected void assertPersistedConversationToMatchUpdatableProperties(Conversation expectedConversation) {
        assertConversationAllUpdatablePropertiesEquals(expectedConversation, getPersistedConversation(expectedConversation));
    }
}
