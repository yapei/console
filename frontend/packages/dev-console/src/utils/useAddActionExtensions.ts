import {
  ResolvedExtension,
  useResolvedExtensions,
  AddAction,
  isAddAction,
} from '@console/dynamic-plugin-sdk';

interface AddPage {
  disabledActions?: string[];
}

const getDisabledAddActions = (): string[] | undefined => {
  if (window.SERVER_FLAGS.addPage) {
    const addPage: AddPage = JSON.parse(window.SERVER_FLAGS.addPage);
    const { disabledActions } = addPage;
    return disabledActions;
  }
  return undefined;
};

export const useAddActionExtensions = (): [ResolvedExtension<AddAction>[], boolean] => {
  const [allAddActionExtensions, resolved] = useResolvedExtensions<AddAction>(isAddAction);
  const disabledActions = getDisabledAddActions();

  if (allAddActionExtensions && disabledActions && disabledActions.length > 0) {
    const filteredAddActionExtensions = allAddActionExtensions.filter(
      (addActionExtension) => !disabledActions.includes(addActionExtension.properties.id),
    );
    return [filteredAddActionExtensions, resolved];
  }

  return [allAddActionExtensions, resolved];
};
