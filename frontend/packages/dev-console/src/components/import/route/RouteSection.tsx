import * as React from 'react';
import FormSection from '../section/FormSection';
import { RouteData } from '../import-types';
import CreateRoute from './CreateRoute';
import SecureRoute from './SecureRoute';

interface RouteSectionProps {
  route: RouteData;
}

const RouteSection: React.FC<RouteSectionProps> = ({ route }) => {
  return (
    <FormSection title="Routing">
      {route.create && (
        <>
          <CreateRoute />
          <SecureRoute />
        </>
      )}
    </FormSection>
  );
};

export default RouteSection;
