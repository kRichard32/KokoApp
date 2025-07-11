import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Col, Row } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './profile.reducer';

export const ProfileDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const profileEntity = useAppSelector(state => state.profile.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="profileDetailsHeading">
          <Translate contentKey="kindialApp.profile.detail.title">Profile</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{profileEntity.id}</dd>
          <dt>
            <span id="language">
              <Translate contentKey="kindialApp.profile.language">Language</Translate>
            </span>
          </dt>
          <dd>{profileEntity.language}</dd>
          <dt>
            <Translate contentKey="kindialApp.profile.user">User</Translate>
          </dt>
          <dd>{profileEntity.user ? profileEntity.user.id : ''}</dd>
          <dt>
            <Translate contentKey="kindialApp.profile.trait">Trait</Translate>
          </dt>
          <dd>
            {profileEntity.traits
              ? profileEntity.traits.map((val, i) => (
                  <span key={val.id}>
                    <a>{val.id}</a>
                    {profileEntity.traits && i === profileEntity.traits.length - 1 ? '' : ', '}
                  </span>
                ))
              : null}
          </dd>
          <dt>
            <Translate contentKey="kindialApp.profile.messages">Messages</Translate>
          </dt>
          <dd>
            {profileEntity.messages
              ? profileEntity.messages.map((val, i) => (
                  <span key={val.id}>
                    <a>{val.id}</a>
                    {profileEntity.messages && i === profileEntity.messages.length - 1 ? '' : ', '}
                  </span>
                ))
              : null}
          </dd>
        </dl>
        <Button tag={Link} to="/profile" replace color="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button tag={Link} to={`/profile/${profileEntity.id}/edit`} replace color="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default ProfileDetail;
