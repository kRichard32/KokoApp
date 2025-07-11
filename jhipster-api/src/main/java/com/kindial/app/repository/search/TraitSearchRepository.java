package com.kindial.app.repository.search;

import co.elastic.clients.elasticsearch._types.query_dsl.QueryStringQuery;
import com.kindial.app.domain.Trait;
import com.kindial.app.repository.TraitRepository;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchTemplate;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.scheduling.annotation.Async;

/**
 * Spring Data Elasticsearch repository for the {@link Trait} entity.
 */
public interface TraitSearchRepository extends ElasticsearchRepository<Trait, Long>, TraitSearchRepositoryInternal {}

interface TraitSearchRepositoryInternal {
    Page<Trait> search(String query, Pageable pageable);

    Page<Trait> search(Query query);

    @Async
    void index(Trait entity);

    @Async
    void deleteFromIndexById(Long id);
}

class TraitSearchRepositoryInternalImpl implements TraitSearchRepositoryInternal {

    private final ElasticsearchTemplate elasticsearchTemplate;
    private final TraitRepository repository;

    TraitSearchRepositoryInternalImpl(ElasticsearchTemplate elasticsearchTemplate, TraitRepository repository) {
        this.elasticsearchTemplate = elasticsearchTemplate;
        this.repository = repository;
    }

    @Override
    public Page<Trait> search(String query, Pageable pageable) {
        NativeQuery nativeQuery = new NativeQuery(QueryStringQuery.of(qs -> qs.query(query))._toQuery());
        return search(nativeQuery.setPageable(pageable));
    }

    @Override
    public Page<Trait> search(Query query) {
        SearchHits<Trait> searchHits = elasticsearchTemplate.search(query, Trait.class);
        List<Trait> hits = searchHits.map(SearchHit::getContent).stream().toList();
        return new PageImpl<>(hits, query.getPageable(), searchHits.getTotalHits());
    }

    @Override
    public void index(Trait entity) {
        repository.findById(entity.getId()).ifPresent(elasticsearchTemplate::save);
    }

    @Override
    public void deleteFromIndexById(Long id) {
        elasticsearchTemplate.delete(String.valueOf(id), Trait.class);
    }
}
