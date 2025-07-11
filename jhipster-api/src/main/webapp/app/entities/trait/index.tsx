import React from 'react';
import { Route } from 'react-router';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Trait from './trait';
import TraitDetail from './trait-detail';
import TraitUpdate from './trait-update';
import TraitDeleteDialog from './trait-delete-dialog';

const TraitRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Trait />} />
    <Route path="new" element={<TraitUpdate />} />
    <Route path=":id">
      <Route index element={<TraitDetail />} />
      <Route path="edit" element={<TraitUpdate />} />
      <Route path="delete" element={<TraitDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default TraitRoutes;
