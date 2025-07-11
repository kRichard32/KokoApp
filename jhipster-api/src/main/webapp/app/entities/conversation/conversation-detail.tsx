import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Col, Row } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './conversation.reducer';

export const ConversationDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const conversationEntity = useAppSelector(state => state.conversation.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="conversationDetailsHeading">
          <Translate contentKey="kindialApp.conversation.detail.title">Conversation</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{conversationEntity.id}</dd>
          <dt>
            <span id="lastMessageID">
              <Translate contentKey="kindialApp.conversation.lastMessageID">Last Message ID</Translate>
            </span>
          </dt>
          <dd>{conversationEntity.lastMessageID}</dd>
          <dt>
            <span id="createdAt">
              <Translate contentKey="kindialApp.conversation.createdAt">Created At</Translate>
            </span>
          </dt>
          <dd>{conversationEntity.createdAt}</dd>
          <dt>
            <span id="updatedAt">
              <Translate contentKey="kindialApp.conversation.updatedAt">Updated At</Translate>
            </span>
          </dt>
          <dd>{conversationEntity.updatedAt}</dd>
          <dt>
            <span id="conversationName">
              <Translate contentKey="kindialApp.conversation.conversationName">Conversation Name</Translate>
            </span>
          </dt>
          <dd>{conversationEntity.conversationName}</dd>
          <dt>
            <Translate contentKey="kindialApp.conversation.profile">Profile</Translate>
          </dt>
          <dd>
            {conversationEntity.profiles
              ? conversationEntity.profiles.map((val, i) => (
                  <span key={val.id}>
                    <a>{val.id}</a>
                    {conversationEntity.profiles && i === conversationEntity.profiles.length - 1 ? '' : ', '}
                  </span>
                ))
              : null}
          </dd>
        </dl>
        <Button tag={Link} to="/conversation" replace color="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button tag={Link} to={`/conversation/${conversationEntity.id}/edit`} replace color="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default ConversationDetail;
