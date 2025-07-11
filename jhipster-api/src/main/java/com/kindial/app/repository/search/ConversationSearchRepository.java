package com.kindial.app.repository.search;

import co.elastic.clients.elasticsearch._types.query_dsl.QueryStringQuery;
import com.kindial.app.domain.Conversation;
import com.kindial.app.repository.ConversationRepository;
import java.util.stream.Stream;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchTemplate;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.query.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.scheduling.annotation.Async;

/**
 * Spring Data Elasticsearch repository for the {@link Conversation} entity.
 */
public interface ConversationSearchRepository extends ElasticsearchRepository<Conversation, Long>, ConversationSearchRepositoryInternal {}

interface ConversationSearchRepositoryInternal {
    Stream<Conversation> search(String query);

    Stream<Conversation> search(Query query);

    @Async
    void index(Conversation entity);

    @Async
    void deleteFromIndexById(Long id);
}

class ConversationSearchRepositoryInternalImpl implements ConversationSearchRepositoryInternal {

    private final ElasticsearchTemplate elasticsearchTemplate;
    private final ConversationRepository repository;

    ConversationSearchRepositoryInternalImpl(ElasticsearchTemplate elasticsearchTemplate, ConversationRepository repository) {
        this.elasticsearchTemplate = elasticsearchTemplate;
        this.repository = repository;
    }

    @Override
    public Stream<Conversation> search(String query) {
        NativeQuery nativeQuery = new NativeQuery(QueryStringQuery.of(qs -> qs.query(query))._toQuery());
        return search(nativeQuery);
    }

    @Override
    public Stream<Conversation> search(Query query) {
        return elasticsearchTemplate.search(query, Conversation.class).map(SearchHit::getContent).stream();
    }

    @Override
    public void index(Conversation entity) {
        repository.findById(entity.getId()).ifPresent(elasticsearchTemplate::save);
    }

    @Override
    public void deleteFromIndexById(Long id) {
        elasticsearchTemplate.delete(String.valueOf(id), Conversation.class);
    }
}
