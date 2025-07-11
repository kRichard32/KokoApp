package com.kindial.app.web.rest;

import com.kindial.app.domain.Conversation;
import com.kindial.app.repository.ConversationRepository;
import com.kindial.app.repository.search.ConversationSearchRepository;
import com.kindial.app.web.rest.errors.BadRequestAlertException;
import com.kindial.app.web.rest.errors.ElasticsearchExceptionMapper;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.StreamSupport;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.ResponseUtil;

/**
 * REST controller for managing {@link com.kindial.app.domain.Conversation}.
 */
@RestController
@RequestMapping("/api/conversations")
@Transactional
public class ConversationResource {

    private static final Logger LOG = LoggerFactory.getLogger(ConversationResource.class);

    private static final String ENTITY_NAME = "conversation";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final ConversationRepository conversationRepository;

    private final ConversationSearchRepository conversationSearchRepository;

    public ConversationResource(ConversationRepository conversationRepository, ConversationSearchRepository conversationSearchRepository) {
        this.conversationRepository = conversationRepository;
        this.conversationSearchRepository = conversationSearchRepository;
    }

    /**
     * {@code POST  /conversations} : Create a new conversation.
     *
     * @param conversation the conversation to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new conversation, or with status {@code 400 (Bad Request)} if the conversation has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<Conversation> createConversation(@RequestBody Conversation conversation) throws URISyntaxException {
        LOG.debug("REST request to save Conversation : {}", conversation);
        if (conversation.getId() != null) {
            throw new BadRequestAlertException("A new conversation cannot already have an ID", ENTITY_NAME, "idexists");
        }
        conversation = conversationRepository.save(conversation);
        conversationSearchRepository.index(conversation);
        return ResponseEntity.created(new URI("/api/conversations/" + conversation.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, conversation.getId().toString()))
            .body(conversation);
    }

    /**
     * {@code PUT  /conversations/:id} : Updates an existing conversation.
     *
     * @param id the id of the conversation to save.
     * @param conversation the conversation to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated conversation,
     * or with status {@code 400 (Bad Request)} if the conversation is not valid,
     * or with status {@code 500 (Internal Server Error)} if the conversation couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<Conversation> updateConversation(
        @PathVariable(value = "id", required = false) final Long id,
        @RequestBody Conversation conversation
    ) throws URISyntaxException {
        LOG.debug("REST request to update Conversation : {}, {}", id, conversation);
        if (conversation.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, conversation.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!conversationRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        conversation = conversationRepository.save(conversation);
        conversationSearchRepository.index(conversation);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, conversation.getId().toString()))
            .body(conversation);
    }

    /**
     * {@code PATCH  /conversations/:id} : Partial updates given fields of an existing conversation, field will ignore if it is null
     *
     * @param id the id of the conversation to save.
     * @param conversation the conversation to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated conversation,
     * or with status {@code 400 (Bad Request)} if the conversation is not valid,
     * or with status {@code 404 (Not Found)} if the conversation is not found,
     * or with status {@code 500 (Internal Server Error)} if the conversation couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<Conversation> partialUpdateConversation(
        @PathVariable(value = "id", required = false) final Long id,
        @RequestBody Conversation conversation
    ) throws URISyntaxException {
        LOG.debug("REST request to partial update Conversation partially : {}, {}", id, conversation);
        if (conversation.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, conversation.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!conversationRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<Conversation> result = conversationRepository
            .findById(conversation.getId())
            .map(existingConversation -> {
                if (conversation.getLastMessageID() != null) {
                    existingConversation.setLastMessageID(conversation.getLastMessageID());
                }
                if (conversation.getCreatedAt() != null) {
                    existingConversation.setCreatedAt(conversation.getCreatedAt());
                }
                if (conversation.getUpdatedAt() != null) {
                    existingConversation.setUpdatedAt(conversation.getUpdatedAt());
                }
                if (conversation.getConversationName() != null) {
                    existingConversation.setConversationName(conversation.getConversationName());
                }

                return existingConversation;
            })
            .map(conversationRepository::save)
            .map(savedConversation -> {
                conversationSearchRepository.index(savedConversation);
                return savedConversation;
            });

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, conversation.getId().toString())
        );
    }

    /**
     * {@code GET  /conversations} : get all the conversations.
     *
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of conversations in body.
     */
    @GetMapping("")
    public List<Conversation> getAllConversations() {
        LOG.debug("REST request to get all Conversations");
        return conversationRepository.findAll();
    }

    /**
     * {@code GET  /conversations/:id} : get the "id" conversation.
     *
     * @param id the id of the conversation to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the conversation, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Conversation> getConversation(@PathVariable("id") Long id) {
        LOG.debug("REST request to get Conversation : {}", id);
        Optional<Conversation> conversation = conversationRepository.findById(id);
        return ResponseUtil.wrapOrNotFound(conversation);
    }

    /**
     * {@code DELETE  /conversations/:id} : delete the "id" conversation.
     *
     * @param id the id of the conversation to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConversation(@PathVariable("id") Long id) {
        LOG.debug("REST request to delete Conversation : {}", id);
        conversationRepository.deleteById(id);
        conversationSearchRepository.deleteFromIndexById(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }

    /**
     * {@code SEARCH  /conversations/_search?query=:query} : search for the conversation corresponding
     * to the query.
     *
     * @param query the query of the conversation search.
     * @return the result of the search.
     */
    @GetMapping("/_search")
    public List<Conversation> searchConversations(@RequestParam("query") String query) {
        LOG.debug("REST request to search Conversations for query {}", query);
        try {
            return StreamSupport.stream(conversationSearchRepository.search(query).spliterator(), false).toList();
        } catch (RuntimeException e) {
            throw ElasticsearchExceptionMapper.mapException(e);
        }
    }
}
