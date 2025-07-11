package com.kindial.app.web.rest;

import static com.kindial.app.domain.TraitAsserts.*;
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
import com.kindial.app.domain.Trait;
import com.kindial.app.repository.TraitRepository;
import com.kindial.app.repository.search.TraitSearchRepository;
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
 * Integration tests for the {@link TraitResource} REST controller.
 */
@IntegrationTest
@AutoConfigureMockMvc
@WithMockUser
class TraitResourceIT {

    private static final String DEFAULT_TRAIT_NAME = "AAAAAAAAAA";
    private static final String UPDATED_TRAIT_NAME = "BBBBBBBBBB";

    private static final String ENTITY_API_URL = "/api/traits";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";
    private static final String ENTITY_SEARCH_API_URL = "/api/traits/_search";

    private static Random random = new Random();
    private static AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    @Autowired
    private ObjectMapper om;

    @Autowired
    private TraitRepository traitRepository;

    @Autowired
    private TraitSearchRepository traitSearchRepository;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restTraitMockMvc;

    private Trait trait;

    private Trait insertedTrait;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Trait createEntity() {
        return new Trait().traitName(DEFAULT_TRAIT_NAME);
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Trait createUpdatedEntity() {
        return new Trait().traitName(UPDATED_TRAIT_NAME);
    }

    @BeforeEach
    void initTest() {
        trait = createEntity();
    }

    @AfterEach
    void cleanup() {
        if (insertedTrait != null) {
            traitRepository.delete(insertedTrait);
            traitSearchRepository.delete(insertedTrait);
            insertedTrait = null;
        }
    }

    @Test
    @Transactional
    void createTrait() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(traitSearchRepository.findAll());
        // Create the Trait
        var returnedTrait = om.readValue(
            restTraitMockMvc
                .perform(post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(trait)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            Trait.class
        );

        // Validate the Trait in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        assertTraitUpdatableFieldsEquals(returnedTrait, getPersistedTrait(returnedTrait));

        await()
            .atMost(5, TimeUnit.SECONDS)
            .untilAsserted(() -> {
                int searchDatabaseSizeAfter = IterableUtil.sizeOf(traitSearchRepository.findAll());
                assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore + 1);
            });

        insertedTrait = returnedTrait;
    }

    @Test
    @Transactional
    void createTraitWithExistingId() throws Exception {
        // Create the Trait with an existing ID
        trait.setId(1L);

        long databaseSizeBeforeCreate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(traitSearchRepository.findAll());

        // An entity with an existing ID cannot be created, so this API call must fail
        restTraitMockMvc
            .perform(post(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(trait)))
            .andExpect(status().isBadRequest());

        // Validate the Trait in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(traitSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void getAllTraits() throws Exception {
        // Initialize the database
        insertedTrait = traitRepository.saveAndFlush(trait);

        // Get all the traitList
        restTraitMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(trait.getId().intValue())))
            .andExpect(jsonPath("$.[*].traitName").value(hasItem(DEFAULT_TRAIT_NAME)));
    }

    @Test
    @Transactional
    void getTrait() throws Exception {
        // Initialize the database
        insertedTrait = traitRepository.saveAndFlush(trait);

        // Get the trait
        restTraitMockMvc
            .perform(get(ENTITY_API_URL_ID, trait.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(trait.getId().intValue()))
            .andExpect(jsonPath("$.traitName").value(DEFAULT_TRAIT_NAME));
    }

    @Test
    @Transactional
    void getNonExistingTrait() throws Exception {
        // Get the trait
        restTraitMockMvc.perform(get(ENTITY_API_URL_ID, Long.MAX_VALUE)).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingTrait() throws Exception {
        // Initialize the database
        insertedTrait = traitRepository.saveAndFlush(trait);

        long databaseSizeBeforeUpdate = getRepositoryCount();
        traitSearchRepository.save(trait);
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(traitSearchRepository.findAll());

        // Update the trait
        Trait updatedTrait = traitRepository.findById(trait.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedTrait are not directly saved in db
        em.detach(updatedTrait);
        updatedTrait.traitName(UPDATED_TRAIT_NAME);

        restTraitMockMvc
            .perform(
                put(ENTITY_API_URL_ID, updatedTrait.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(updatedTrait))
            )
            .andExpect(status().isOk());

        // Validate the Trait in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedTraitToMatchAllProperties(updatedTrait);

        await()
            .atMost(5, TimeUnit.SECONDS)
            .untilAsserted(() -> {
                int searchDatabaseSizeAfter = IterableUtil.sizeOf(traitSearchRepository.findAll());
                assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
                List<Trait> traitSearchList = Streamable.of(traitSearchRepository.findAll()).toList();
                Trait testTraitSearch = traitSearchList.get(searchDatabaseSizeAfter - 1);

                assertTraitAllPropertiesEquals(testTraitSearch, updatedTrait);
            });
    }

    @Test
    @Transactional
    void putNonExistingTrait() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(traitSearchRepository.findAll());
        trait.setId(longCount.incrementAndGet());

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restTraitMockMvc
            .perform(
                put(ENTITY_API_URL_ID, trait.getId())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(trait))
            )
            .andExpect(status().isBadRequest());

        // Validate the Trait in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(traitSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void putWithIdMismatchTrait() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(traitSearchRepository.findAll());
        trait.setId(longCount.incrementAndGet());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restTraitMockMvc
            .perform(
                put(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(trait))
            )
            .andExpect(status().isBadRequest());

        // Validate the Trait in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(traitSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamTrait() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(traitSearchRepository.findAll());
        trait.setId(longCount.incrementAndGet());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restTraitMockMvc
            .perform(put(ENTITY_API_URL).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(trait)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Trait in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(traitSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void partialUpdateTraitWithPatch() throws Exception {
        // Initialize the database
        insertedTrait = traitRepository.saveAndFlush(trait);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the trait using partial update
        Trait partialUpdatedTrait = new Trait();
        partialUpdatedTrait.setId(trait.getId());

        partialUpdatedTrait.traitName(UPDATED_TRAIT_NAME);

        restTraitMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedTrait.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedTrait))
            )
            .andExpect(status().isOk());

        // Validate the Trait in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertTraitUpdatableFieldsEquals(createUpdateProxyForBean(partialUpdatedTrait, trait), getPersistedTrait(trait));
    }

    @Test
    @Transactional
    void fullUpdateTraitWithPatch() throws Exception {
        // Initialize the database
        insertedTrait = traitRepository.saveAndFlush(trait);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the trait using partial update
        Trait partialUpdatedTrait = new Trait();
        partialUpdatedTrait.setId(trait.getId());

        partialUpdatedTrait.traitName(UPDATED_TRAIT_NAME);

        restTraitMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedTrait.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedTrait))
            )
            .andExpect(status().isOk());

        // Validate the Trait in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertTraitUpdatableFieldsEquals(partialUpdatedTrait, getPersistedTrait(partialUpdatedTrait));
    }

    @Test
    @Transactional
    void patchNonExistingTrait() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(traitSearchRepository.findAll());
        trait.setId(longCount.incrementAndGet());

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restTraitMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, trait.getId())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(trait))
            )
            .andExpect(status().isBadRequest());

        // Validate the Trait in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(traitSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void patchWithIdMismatchTrait() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(traitSearchRepository.findAll());
        trait.setId(longCount.incrementAndGet());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restTraitMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .with(csrf())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(trait))
            )
            .andExpect(status().isBadRequest());

        // Validate the Trait in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(traitSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamTrait() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(traitSearchRepository.findAll());
        trait.setId(longCount.incrementAndGet());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restTraitMockMvc
            .perform(patch(ENTITY_API_URL).with(csrf()).contentType("application/merge-patch+json").content(om.writeValueAsBytes(trait)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Trait in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(traitSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void deleteTrait() throws Exception {
        // Initialize the database
        insertedTrait = traitRepository.saveAndFlush(trait);
        traitRepository.save(trait);
        traitSearchRepository.save(trait);

        long databaseSizeBeforeDelete = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(traitSearchRepository.findAll());
        assertThat(searchDatabaseSizeBefore).isEqualTo(databaseSizeBeforeDelete);

        // Delete the trait
        restTraitMockMvc
            .perform(delete(ENTITY_API_URL_ID, trait.getId()).with(csrf()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(traitSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore - 1);
    }

    @Test
    @Transactional
    void searchTrait() throws Exception {
        // Initialize the database
        insertedTrait = traitRepository.saveAndFlush(trait);
        traitSearchRepository.save(trait);

        // Search the trait
        restTraitMockMvc
            .perform(get(ENTITY_SEARCH_API_URL + "?query=id:" + trait.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(trait.getId().intValue())))
            .andExpect(jsonPath("$.[*].traitName").value(hasItem(DEFAULT_TRAIT_NAME)));
    }

    protected long getRepositoryCount() {
        return traitRepository.count();
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

    protected Trait getPersistedTrait(Trait trait) {
        return traitRepository.findById(trait.getId()).orElseThrow();
    }

    protected void assertPersistedTraitToMatchAllProperties(Trait expectedTrait) {
        assertTraitAllPropertiesEquals(expectedTrait, getPersistedTrait(expectedTrait));
    }

    protected void assertPersistedTraitToMatchUpdatableProperties(Trait expectedTrait) {
        assertTraitAllUpdatablePropertiesEquals(expectedTrait, getPersistedTrait(expectedTrait));
    }
}
