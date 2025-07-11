import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Col, Row } from 'reactstrap';
import { Translate, byteSize, openFile } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './message.reducer';

export const MessageDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const messageEntity = useAppSelector(state => state.message.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="messageDetailsHeading">
          <Translate contentKey="kindialApp.message.detail.title">Message</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{messageEntity.id}</dd>
          <dt>
            <span id="rawContent">
              <Translate contentKey="kindialApp.message.rawContent">Raw Content</Translate>
            </span>
          </dt>
          <dd>
            {messageEntity.rawContent ? (
              <div>
                {messageEntity.rawContentContentType ? (
                  <a onClick={openFile(messageEntity.rawContentContentType, messageEntity.rawContent)}>
                    <Translate contentKey="entity.action.open">Open</Translate>&nbsp;
                  </a>
                ) : null}
                <span>
                  {messageEntity.rawContentContentType}, {byteSize(messageEntity.rawContent)}
                </span>
              </div>
            ) : null}
          </dd>
          <dt>
            <span id="transcript">
              <Translate contentKey="kindialApp.message.transcript">Transcript</Translate>
            </span>
          </dt>
          <dd>{messageEntity.transcript}</dd>
          <dt>
            <span id="timestamp">
              <Translate contentKey="kindialApp.message.timestamp">Timestamp</Translate>
            </span>
          </dt>
          <dd>{messageEntity.timestamp}</dd>
          <dt>
            <span id="messageType">
              <Translate contentKey="kindialApp.message.messageType">Message Type</Translate>
            </span>
          </dt>
          <dd>{messageEntity.messageType}</dd>
          <dt>
            <Translate contentKey="kindialApp.message.profile">Profile</Translate>
          </dt>
          <dd>{messageEntity.profile ? messageEntity.profile.id : ''}</dd>
          <dt>
            <Translate contentKey="kindialApp.message.conversation">Conversation</Translate>
          </dt>
          <dd>{messageEntity.conversation ? messageEntity.conversation.id : ''}</dd>
        </dl>
        <Button tag={Link} to="/message" replace color="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button tag={Link} to={`/message/${messageEntity.id}/edit`} replace color="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default MessageDetail;
