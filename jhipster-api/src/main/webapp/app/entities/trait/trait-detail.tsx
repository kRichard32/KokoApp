import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Col, Row } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './trait.reducer';

export const TraitDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const traitEntity = useAppSelector(state => state.trait.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="traitDetailsHeading">
          <Translate contentKey="kindialApp.trait.detail.title">Trait</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{traitEntity.id}</dd>
          <dt>
            <span id="traitName">
              <Translate contentKey="kindialApp.trait.traitName">Trait Name</Translate>
            </span>
          </dt>
          <dd>{traitEntity.traitName}</dd>
          <dt>
            <Translate contentKey="kindialApp.trait.profile">Profile</Translate>
          </dt>
          <dd>
            {traitEntity.profiles
              ? traitEntity.profiles.map((val, i) => (
                  <span key={val.id}>
                    <a>{val.id}</a>
                    {traitEntity.profiles && i === traitEntity.profiles.length - 1 ? '' : ', '}
                  </span>
                ))
              : null}
          </dd>
        </dl>
        <Button tag={Link} to="/trait" replace color="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button tag={Link} to={`/trait/${traitEntity.id}/edit`} replace color="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default TraitDetail;
