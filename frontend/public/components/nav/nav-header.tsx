import * as React from 'react';
import { connect } from 'react-redux';
import { Dropdown, DropdownItem, DropdownToggle, Title } from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';
import { Perspective, useExtensions, isPerspective } from '@console/plugin-sdk';
import { RootState } from '../../redux';
import { featureReducerName, getFlagsObject, FlagsObject } from '../../reducers/features';
import { history } from '../utils';
import { useActivePerspective } from '@console/shared';

type StateProps = {
  flags: FlagsObject;
};

export type NavHeaderProps = {
  onPerspectiveSelected: () => void;
};

const NavHeader_: React.FC<NavHeaderProps & StateProps> = ({ onPerspectiveSelected, flags }) => {
  const [activePerspective, setActivePerspective] = useActivePerspective();
  const [isPerspectiveDropdownOpen, setPerspectiveDropdownOpen] = React.useState(false);
  const perspectiveExtensions = useExtensions<Perspective>(isPerspective);
  const togglePerspectiveOpen = React.useCallback(() => {
    setPerspectiveDropdownOpen(!isPerspectiveDropdownOpen);
  }, [isPerspectiveDropdownOpen]);

  const onPerspectiveSelect = React.useCallback(
    (event: React.MouseEvent<HTMLLinkElement>, perspective: Perspective): void => {
      event.preventDefault();
      if (perspective.properties.id !== activePerspective) {
        setActivePerspective(perspective.properties.id);
        history.push(perspective.properties.getLandingPageURL(flags));
      }

      setPerspectiveDropdownOpen(false);
      onPerspectiveSelected && onPerspectiveSelected();
    },
    [activePerspective, flags, onPerspectiveSelected, setActivePerspective],
  );

  const renderToggle = React.useCallback(
    (icon: React.ReactNode, name: string) => (
      <DropdownToggle
        isOpen={isPerspectiveDropdownOpen}
        onToggle={togglePerspectiveOpen}
        toggleIndicator={CaretDownIcon}
        data-test-id="perspective-switcher-toggle"
      >
        <Title headingLevel="h2" size="md">
          <span className="oc-nav-header__icon">{icon}</span>
          {name}
        </Title>
      </DropdownToggle>
    ),
    [isPerspectiveDropdownOpen, togglePerspectiveOpen],
  );

  const perspectiveItems = React.useMemo(
    () =>
      perspectiveExtensions.map((nextPerspective: Perspective) => (
        <DropdownItem
          key={nextPerspective.properties.id}
          onClick={(event: React.MouseEvent<HTMLLinkElement>) =>
            onPerspectiveSelect(event, nextPerspective)
          }
          isHovered={nextPerspective.properties.id === activePerspective}
          component="button"
        >
          <Title headingLevel="h2" size="md" data-test-id="perspective-switcher-menu-option">
            <span className="oc-nav-header__icon">{nextPerspective.properties.icon}</span>
            {nextPerspective.properties.name}
          </Title>
        </DropdownItem>
      )),
    [activePerspective, onPerspectiveSelect, perspectiveExtensions],
  );

  const { icon, name } = React.useMemo(
    () => perspectiveExtensions.find((p) => p.properties.id === activePerspective).properties,
    [activePerspective, perspectiveExtensions],
  );

  return (
    <div
      className="oc-nav-header"
      data-tour-id="tour-perspective-dropdown"
      data-quickstart-id="qs-perspective-switcher"
    >
      <Dropdown
        isOpen={isPerspectiveDropdownOpen}
        toggle={renderToggle(icon, name)}
        dropdownItems={perspectiveItems}
        data-test-id="perspective-switcher-menu"
      />
    </div>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  flags: getFlagsObject(state),
});

export default connect<StateProps, {}, NavHeaderProps, RootState>(mapStateToProps, null, null, {
  areStatesEqual: (next, prev) => next[featureReducerName] === prev[featureReducerName],
})(NavHeader_);
