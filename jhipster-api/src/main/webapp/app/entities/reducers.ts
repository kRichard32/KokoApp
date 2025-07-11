import profile from 'app/entities/profile/profile.reducer';
import trait from 'app/entities/trait/trait.reducer';
import conversation from 'app/entities/conversation/conversation.reducer';
import message from 'app/entities/message/message.reducer';
/* jhipster-needle-add-reducer-import - JHipster will add reducer here */

const entitiesReducers = {
  profile,
  trait,
  conversation,
  message,
  /* jhipster-needle-add-reducer-combine - JHipster will add reducer here */
};

export default entitiesReducers;
