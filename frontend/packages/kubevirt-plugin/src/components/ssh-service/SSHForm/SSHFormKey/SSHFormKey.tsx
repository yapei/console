import * as React from 'react';
import sshpk from 'sshpk';
import { isEmpty } from 'lodash';
import { FileUpload, Flex, FlexItem, Button } from '@patternfly/react-core';
import { ValidatedOptions } from '../ssh-form-utils';
import { useTranslation } from 'react-i18next';
import useSSHKeys from '../../../../hooks/use-ssh-keys';
import { sshActions, SSHActionsNames } from '../../redux/actions';
import SSHFormSaveInNamespace from '../SSHFormSave/SSHFormSaveInNamespace';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useDispatch } from 'react-redux';

import './ssh-form-key.scss';

const SSHFormKey: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const {
    key,
    tempSSHKey,
    updateSSHTempKey,
    showRestoreKeyButton,
    setIsValidSSHKey,
  } = useSSHKeys();
  const [filename, setFilename] = React.useState<string>();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [helperText, setHelperText] = React.useState<string>('');
  const [validated, setValidated] = React.useState<ValidatedOptions>(ValidatedOptions.default);

  const valueChanged = React.useCallback(
    (val: string) => {
      updateSSHTempKey(val);
      dispatch(sshActions[SSHActionsNames.disableSaveInNamespaceCheckbox](isEmpty(val)));
    },
    [dispatch, updateSSHTempKey],
  );

  return (
    <>
      <FileUpload
        id="simple-text-file"
        className="SSHFormKey-input-field"
        type="text"
        value={tempSSHKey}
        filename={filename}
        onChange={(val: string, name: string) => {
          valueChanged(val);
          setFilename(name);
          setHelperText('');
          setValidated(ValidatedOptions.default);
          if (val) {
            try {
              const evaluatedKey = sshpk.parseKey(val, 'ssh');
              setValidated(ValidatedOptions.success);
              setHelperText(`Key Type is ${evaluatedKey.type}`);
              setIsValidSSHKey(true);
            } catch {
              setValidated(ValidatedOptions.error);
              setIsValidSSHKey(false);
              setHelperText(t('kubevirt-plugin~Invalid SSH public key format'));
            }
          }
        }}
        onReadStarted={() => setIsLoading(true)}
        onReadFinished={() => setIsLoading(false)}
        isLoading={isLoading}
        validated={validated}
        allowEditingUploadedText
        isReadOnly={false}
      />
      {helperText && <div className={`SSHFormKey-helperText-${validated}`}>{helperText}</div>}
      <Flex
        justifyContent={{ default: 'justifyContentSpaceBetween' }}
        alignItems={{ default: 'alignItemsCenter' }}
        className="SSHFormKey-flex"
      >
        <FlexItem>
          <SSHFormSaveInNamespace />
        </FlexItem>
        {showRestoreKeyButton && key && (
          <FlexItem>
            <Button
              className="SSHFormKey-restore-button"
              onClick={() => valueChanged(key)}
              variant="link"
              isInline
            >
              {t('kubevirt-plugin~Restore Key')}
            </Button>
          </FlexItem>
        )}
      </Flex>
    </>
  );
};

export default SSHFormKey;
