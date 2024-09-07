import * as React from 'react';
import { PopperOptions } from 'popper.js';
import { Popper } from '../popper';
import './spotlight.scss';

type InteractiveSpotlightProps = {
  element: Element;
};

const isInViewport = (elementToCheck: Element) => {
  const rect = elementToCheck.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

const popperOptions: PopperOptions = {
  modifiers: {
    preventOverflow: {
      enabled: false,
    },
    flip: {
      enabled: false,
    },
  },
};

const InteractiveSpotlight: React.FC<InteractiveSpotlightProps> = ({ element }) => {
  const { height, width } = element.getBoundingClientRect();
  const style: React.CSSProperties = {
    height,
    width,
  };

  if (!isInViewport(element)) {
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }

  return (
    <Popper reference={element} placement="top-start" popperOptions={popperOptions}>
      <div className="ocs-spotlight ocs-spotlight__element-highlight-animate" style={style} />
    </Popper>
  );
};

export default InteractiveSpotlight;
