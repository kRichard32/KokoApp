package com.kindial.app.repository.search;

import co.elastic.clients.elasticsearch._types.query_dsl.QueryStringQuery;
import com.kindial.app.domain.Profile;
import com.kindial.app.repository.ProfileRepository;
import java.util.stream.Stream;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchTemplate;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.query.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.scheduling.annotation.Async;

/**
 * Spring Data Elasticsearch repository for the {@link Profile} entity.
 */
public interface ProfileSearchRepository extends ElasticsearchRepository<Profile, Long>, ProfileSearchRepositoryInternal {}

interface ProfileSearchRepositoryInternal {
    Stream<Profile> search(String query);

    Stream<Profile> search(Query query);

    @Async
    void index(Profile entity);

    @Async
    void deleteFromIndexById(Long id);
}

class ProfileSearchRepositoryInternalImpl implements ProfileSearchRepositoryInternal {

    private final ElasticsearchTemplate elasticsearchTemplate;
    private final ProfileRepository repository;

    ProfileSearchRepositoryInternalImpl(ElasticsearchTemplate elasticsearchTemplate, ProfileRepository repository) {
        this.elasticsearchTemplate = elasticsearchTemplate;
        this.repository = repository;
    }

    @Override
    public Stream<Profile> search(String query) {
        NativeQuery nativeQuery = new NativeQuery(QueryStringQuery.of(qs -> qs.query(query))._toQuery());
        return search(nativeQuery);
    }

    @Override
    public Stream<Profile> search(Query query) {
        return elasticsearchTemplate.search(query, Profile.class).map(SearchHit::getContent).stream();
    }

    @Override
    public void index(Profile entity) {
        repository.findOneWithEagerRelationships(entity.getId()).ifPresent(elasticsearchTemplate::save);
    }

    @Override
    public void deleteFromIndexById(Long id) {
        elasticsearchTemplate.delete(String.valueOf(id), Profile.class);
    }
}
