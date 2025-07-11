import React, { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Col, Row } from 'reactstrap';
import { Translate, ValidatedBlobField, ValidatedField, ValidatedForm, translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntities as getProfiles } from 'app/entities/profile/profile.reducer';
import { getEntities as getConversations } from 'app/entities/conversation/conversation.reducer';
import { MessageType } from 'app/shared/model/enumerations/message-type.model';
import { createEntity, getEntity, reset, updateEntity } from './message.reducer';

export const MessageUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const profiles = useAppSelector(state => state.profile.entities);
  const conversations = useAppSelector(state => state.conversation.entities);
  const messageEntity = useAppSelector(state => state.message.entity);
  const loading = useAppSelector(state => state.message.loading);
  const updating = useAppSelector(state => state.message.updating);
  const updateSuccess = useAppSelector(state => state.message.updateSuccess);
  const messageTypeValues = Object.keys(MessageType);

  const handleClose = () => {
    navigate('/message');
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }

    dispatch(getProfiles({}));
    dispatch(getConversations({}));
  }, []);

  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
  }, [updateSuccess]);

  const saveEntity = values => {
    if (values.id !== undefined && typeof values.id !== 'number') {
      values.id = Number(values.id);
    }

    const entity = {
      ...messageEntity,
      ...values,
      profile: profiles.find(it => it.id.toString() === values.profile?.toString()),
      conversation: conversations.find(it => it.id.toString() === values.conversation?.toString()),
    };

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };

  const defaultValues = () =>
    isNew
      ? {}
      : {
          messageType: 'VOICE',
          ...messageEntity,
          profile: messageEntity?.profile?.id,
          conversation: messageEntity?.conversation?.id,
        };

  return (
    <div>
      <Row className="justify-content-center">
        <Col md="8">
          <h2 id="kindialApp.message.home.createOrEditLabel" data-cy="MessageCreateUpdateHeading">
            <Translate contentKey="kindialApp.message.home.createOrEditLabel">Create or edit a Message</Translate>
          </h2>
        </Col>
      </Row>
      <Row className="justify-content-center">
        <Col md="8">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ValidatedForm defaultValues={defaultValues()} onSubmit={saveEntity}>
              {!isNew ? (
                <ValidatedField
                  name="id"
                  required
                  readOnly
                  id="message-id"
                  label={translate('global.field.id')}
                  validate={{ required: true }}
                />
              ) : null}
              <ValidatedBlobField
                label={translate('kindialApp.message.rawContent')}
                id="message-rawContent"
                name="rawContent"
                data-cy="rawContent"
                openActionLabel={translate('entity.action.open')}
              />
              <ValidatedField
                label={translate('kindialApp.message.transcript')}
                id="message-transcript"
                name="transcript"
                data-cy="transcript"
                type="text"
              />
              <ValidatedField
                label={translate('kindialApp.message.timestamp')}
                id="message-timestamp"
                name="timestamp"
                data-cy="timestamp"
                type="text"
              />
              <ValidatedField
                label={translate('kindialApp.message.messageType')}
                id="message-messageType"
                name="messageType"
                data-cy="messageType"
                type="select"
              >
                {messageTypeValues.map(messageType => (
                  <option value={messageType} key={messageType}>
                    {translate(`kindialApp.MessageType.${messageType}`)}
                  </option>
                ))}
              </ValidatedField>
              <ValidatedField
                id="message-profile"
                name="profile"
                data-cy="profile"
                label={translate('kindialApp.message.profile')}
                type="select"
              >
                <option value="" key="0" />
                {profiles
                  ? profiles.map(otherEntity => (
                      <option value={otherEntity.id} key={otherEntity.id}>
                        {otherEntity.id}
                      </option>
                    ))
                  : null}
              </ValidatedField>
              <ValidatedField
                id="message-conversation"
                name="conversation"
                data-cy="conversation"
                label={translate('kindialApp.message.conversation')}
                type="select"
              >
                <option value="" key="0" />
                {conversations
                  ? conversations.map(otherEntity => (
                      <option value={otherEntity.id} key={otherEntity.id}>
                        {otherEntity.id}
                      </option>
                    ))
                  : null}
              </ValidatedField>
              <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/message" replace color="info">
                <FontAwesomeIcon icon="arrow-left" />
                &nbsp;
                <span className="d-none d-md-inline">
                  <Translate contentKey="entity.action.back">Back</Translate>
                </span>
              </Button>
              &nbsp;
              <Button color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
                <FontAwesomeIcon icon="save" />
                &nbsp;
                <Translate contentKey="entity.action.save">Save</Translate>
              </Button>
            </ValidatedForm>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default MessageUpdate;
