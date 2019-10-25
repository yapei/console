import * as React from 'react';
import * as _ from 'lodash';
import { Loading } from '@console/internal/components/utils';
import { useFormikContext, FormikValues } from 'formik';
import { RedExclamationCircleIcon } from '@console/shared';

const SearchStatus: React.FC = () => {
  const { values, errors } = useFormikContext<FormikValues>();
  const isiError = _.get(errors, 'isi.image');

  return _.isEmpty(values.isi.image) ? (
    <div className="co-image-name-results">
      <div className="co-image-name-results__loading">
        {values.isSearchingForImage && <Loading className="co-m-loader--inline" />}
        {!values.isSearchingForImage && !isiError && (
          <h2 className="h3 co-image-name-results__loading-heading">
            {/* Select an image stream tag or e */}Enter an image name.
          </h2>
        )}
        {!values.isSearchingForImage && isiError && (
          <>
            <h2 className="h3 co-image-name-results__loading-heading">
              <RedExclamationCircleIcon /> Could not load image metadata.
            </h2>
            <p className="co-image-name-results__loading-error">{isiError}</p>
          </>
        )}
      </div>
    </div>
  ) : null;
};

export default SearchStatus;
