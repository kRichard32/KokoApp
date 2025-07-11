import React from 'react';
import { Route } from 'react-router';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Profile from './profile';
import Trait from './trait';
import Conversation from './conversation';
import Message from './message';
/* jhipster-needle-add-route-import - JHipster will add routes here */

export default () => {
  return (
    <div>
      <ErrorBoundaryRoutes>
        {/* prettier-ignore */}
        <Route path="profile/*" element={<Profile />} />
        <Route path="trait/*" element={<Trait />} />
        <Route path="conversation/*" element={<Conversation />} />
        <Route path="message/*" element={<Message />} />
        {/* jhipster-needle-add-route-path - JHipster will add routes here */}
      </ErrorBoundaryRoutes>
    </div>
  );
};
