package com.kindial.app.web.rest;

import com.kindial.app.domain.Trait;
import com.kindial.app.repository.TraitRepository;
import com.kindial.app.repository.search.TraitSearchRepository;
import com.kindial.app.web.rest.errors.BadRequestAlertException;
import com.kindial.app.web.rest.errors.ElasticsearchExceptionMapper;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.PaginationUtil;
import tech.jhipster.web.util.ResponseUtil;

/**
 * REST controller for managing {@link com.kindial.app.domain.Trait}.
 */
@RestController
@RequestMapping("/api/traits")
@Transactional
public class TraitResource {

    private static final Logger LOG = LoggerFactory.getLogger(TraitResource.class);

    private static final String ENTITY_NAME = "trait";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final TraitRepository traitRepository;

    private final TraitSearchRepository traitSearchRepository;

    public TraitResource(TraitRepository traitRepository, TraitSearchRepository traitSearchRepository) {
        this.traitRepository = traitRepository;
        this.traitSearchRepository = traitSearchRepository;
    }

    /**
     * {@code POST  /traits} : Create a new trait.
     *
     * @param trait the trait to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new trait, or with status {@code 400 (Bad Request)} if the trait has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<Trait> createTrait(@RequestBody Trait trait) throws URISyntaxException {
        LOG.debug("REST request to save Trait : {}", trait);
        if (trait.getId() != null) {
            throw new BadRequestAlertException("A new trait cannot already have an ID", ENTITY_NAME, "idexists");
        }
        trait = traitRepository.save(trait);
        traitSearchRepository.index(trait);
        return ResponseEntity.created(new URI("/api/traits/" + trait.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, trait.getId().toString()))
            .body(trait);
    }

    /**
     * {@code PUT  /traits/:id} : Updates an existing trait.
     *
     * @param id the id of the trait to save.
     * @param trait the trait to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated trait,
     * or with status {@code 400 (Bad Request)} if the trait is not valid,
     * or with status {@code 500 (Internal Server Error)} if the trait couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<Trait> updateTrait(@PathVariable(value = "id", required = false) final Long id, @RequestBody Trait trait)
        throws URISyntaxException {
        LOG.debug("REST request to update Trait : {}, {}", id, trait);
        if (trait.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, trait.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!traitRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        trait = traitRepository.save(trait);
        traitSearchRepository.index(trait);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, trait.getId().toString()))
            .body(trait);
    }

    /**
     * {@code PATCH  /traits/:id} : Partial updates given fields of an existing trait, field will ignore if it is null
     *
     * @param id the id of the trait to save.
     * @param trait the trait to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated trait,
     * or with status {@code 400 (Bad Request)} if the trait is not valid,
     * or with status {@code 404 (Not Found)} if the trait is not found,
     * or with status {@code 500 (Internal Server Error)} if the trait couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<Trait> partialUpdateTrait(@PathVariable(value = "id", required = false) final Long id, @RequestBody Trait trait)
        throws URISyntaxException {
        LOG.debug("REST request to partial update Trait partially : {}, {}", id, trait);
        if (trait.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, trait.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!traitRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<Trait> result = traitRepository
            .findById(trait.getId())
            .map(existingTrait -> {
                if (trait.getTraitName() != null) {
                    existingTrait.setTraitName(trait.getTraitName());
                }

                return existingTrait;
            })
            .map(traitRepository::save)
            .map(savedTrait -> {
                traitSearchRepository.index(savedTrait);
                return savedTrait;
            });

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, trait.getId().toString())
        );
    }

    /**
     * {@code GET  /traits} : get all the traits.
     *
     * @param pageable the pagination information.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of traits in body.
     */
    @GetMapping("")
    public ResponseEntity<List<Trait>> getAllTraits(@org.springdoc.core.annotations.ParameterObject Pageable pageable) {
        LOG.debug("REST request to get a page of Traits");
        Page<Trait> page = traitRepository.findAll(pageable);
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(ServletUriComponentsBuilder.fromCurrentRequest(), page);
        return ResponseEntity.ok().headers(headers).body(page.getContent());
    }

    /**
     * {@code GET  /traits/:id} : get the "id" trait.
     *
     * @param id the id of the trait to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the trait, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Trait> getTrait(@PathVariable("id") Long id) {
        LOG.debug("REST request to get Trait : {}", id);
        Optional<Trait> trait = traitRepository.findById(id);
        return ResponseUtil.wrapOrNotFound(trait);
    }

    /**
     * {@code DELETE  /traits/:id} : delete the "id" trait.
     *
     * @param id the id of the trait to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrait(@PathVariable("id") Long id) {
        LOG.debug("REST request to delete Trait : {}", id);
        traitRepository.deleteById(id);
        traitSearchRepository.deleteFromIndexById(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }

    /**
     * {@code SEARCH  /traits/_search?query=:query} : search for the trait corresponding
     * to the query.
     *
     * @param query the query of the trait search.
     * @param pageable the pagination information.
     * @return the result of the search.
     */
    @GetMapping("/_search")
    public ResponseEntity<List<Trait>> searchTraits(
        @RequestParam("query") String query,
        @org.springdoc.core.annotations.ParameterObject Pageable pageable
    ) {
        LOG.debug("REST request to search for a page of Traits for query {}", query);
        try {
            Page<Trait> page = traitSearchRepository.search(query, pageable);
            HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(ServletUriComponentsBuilder.fromCurrentRequest(), page);
            return ResponseEntity.ok().headers(headers).body(page.getContent());
        } catch (RuntimeException e) {
            throw ElasticsearchExceptionMapper.mapException(e);
        }
    }
}
