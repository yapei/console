import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TourActions } from './const';
import { TourContext } from './tour-context';

type GuidedTourMastheadTriggerProps = {
  className?: string;
};

const GuidedTourMastheadTrigger: React.FC<GuidedTourMastheadTriggerProps> = ({ className }) => {
  const { tourDispatch, tour } = React.useContext(TourContext);
  const { t } = useTranslation();

  if (!tour) return null;
  return (
    <button
      className={className}
      type="button"
      onClick={() => tourDispatch({ type: TourActions.start })}
    >
      {t('tour~Guided tour')}
    </button>
  );
};

export default GuidedTourMastheadTrigger;
