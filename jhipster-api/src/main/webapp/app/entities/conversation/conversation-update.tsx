import React, { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Col, Row } from 'reactstrap';
import { Translate, ValidatedField, ValidatedForm, translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { mapIdList } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntities as getProfiles } from 'app/entities/profile/profile.reducer';
import { createEntity, getEntity, reset, updateEntity } from './conversation.reducer';

export const ConversationUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const profiles = useAppSelector(state => state.profile.entities);
  const conversationEntity = useAppSelector(state => state.conversation.entity);
  const loading = useAppSelector(state => state.conversation.loading);
  const updating = useAppSelector(state => state.conversation.updating);
  const updateSuccess = useAppSelector(state => state.conversation.updateSuccess);

  const handleClose = () => {
    navigate('/conversation');
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }

    dispatch(getProfiles({}));
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
      ...conversationEntity,
      ...values,
      profiles: mapIdList(values.profiles),
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
          ...conversationEntity,
          profiles: conversationEntity?.profiles?.map(e => e.id.toString()),
        };

  return (
    <div>
      <Row className="justify-content-center">
        <Col md="8">
          <h2 id="kindialApp.conversation.home.createOrEditLabel" data-cy="ConversationCreateUpdateHeading">
            <Translate contentKey="kindialApp.conversation.home.createOrEditLabel">Create or edit a Conversation</Translate>
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
                  id="conversation-id"
                  label={translate('global.field.id')}
                  validate={{ required: true }}
                />
              ) : null}
              <ValidatedField
                label={translate('kindialApp.conversation.lastMessageID')}
                id="conversation-lastMessageID"
                name="lastMessageID"
                data-cy="lastMessageID"
                type="text"
              />
              <ValidatedField
                label={translate('kindialApp.conversation.createdAt')}
                id="conversation-createdAt"
                name="createdAt"
                data-cy="createdAt"
                type="text"
              />
              <ValidatedField
                label={translate('kindialApp.conversation.updatedAt')}
                id="conversation-updatedAt"
                name="updatedAt"
                data-cy="updatedAt"
                type="text"
              />
              <ValidatedField
                label={translate('kindialApp.conversation.conversationName')}
                id="conversation-conversationName"
                name="conversationName"
                data-cy="conversationName"
                type="text"
              />
              <ValidatedField
                label={translate('kindialApp.conversation.profile')}
                id="conversation-profile"
                data-cy="profile"
                type="select"
                multiple
                name="profiles"
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
              <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/conversation" replace color="info">
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

export default ConversationUpdate;
