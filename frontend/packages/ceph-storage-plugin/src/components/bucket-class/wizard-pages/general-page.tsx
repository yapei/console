import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  AlertActionCloseButton,
  Form,
  FormGroup,
  TextArea,
  TextInput,
  Radio,
  ValidatedOptions,
  Tooltip,
} from '@patternfly/react-core';
import { ExternalLink } from '@console/internal/components/utils';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { Action, State } from '../state';
import { bucketClassTypeRadios } from '../../../constants/bucket-class';
import { validateBucketClassName } from '../../../utils/bucket-class';
import '../create-bc.scss';

const BucketClassNameToolTip = ({ position, content }) => (
  <Tooltip position={position} content={content} isContentLeftAligned>
    <OutlinedQuestionCircleIcon />
  </Tooltip>
);

const GeneralPage: React.FC<GeneralPageProps> = ({ dispatch, state }) => {
  const { t } = useTranslation();

  const [showHelp, setShowHelp] = React.useState(true);

  const [validated, setValidated] = React.useState<ValidatedOptions>(ValidatedOptions.default);
  const onChange = (value: string) => {
    dispatch({ type: 'setBucketClassName', name: value });
    if (validateBucketClassName(value)) {
      setValidated(ValidatedOptions.success);
    } else {
      setValidated(ValidatedOptions.error);
    }
  };

  return (
    <div className="nb-create-bc-step-page">
      {showHelp && (
        <Alert
          isInline
          variant="info"
          title={t('ceph-storage-plugin~What is a BucketClass?')}
          className="nb-create-bc-step-page__info"
          actionClose={<AlertActionCloseButton onClose={() => setShowHelp(false)} />}
        >
          <p>
            {t(
              'ceph-storage-plugin~A set of policies which would apply to all buckets (OBCs) created with the specific bucket class. These policies include placement, namespace and caching',
            )}
          </p>
          <ExternalLink
            href="https://github.com/noobaa/noobaa-operator/blob/master/doc/bucket-class-crd.md"
            text={t('ceph-storage-plugin~Learn More')}
          />
        </Alert>
      )}
      <Form className="nb-create-bc-step-page-form">
        <FormGroup
          fieldId="bucketclasstype-radio"
          className="nb-create-bc-step-page-form__element nb-bucket-class-type-form__element"
          isRequired
          label={t('ceph-storage-plugin~BucketClass type')}
        >
          {bucketClassTypeRadios(t).map((radio) => {
            const checked = radio.value === state.bucketClassType;
            return (
              <Radio
                {...radio}
                onChange={() => {
                  dispatch({ type: 'setBucketClassType', value: radio.value });
                }}
                checked={checked}
                className="nb-create-bc-step-page-form__radio"
                name="bucketclasstype"
              />
            );
          })}
        </FormGroup>
        <FormGroup
          labelIcon={
            <BucketClassNameToolTip
              position="top"
              content={
                <ul>
                  <li>{t('ceph-storage-plugin~3-63 chars')}</li>
                  <li>
                    {t('ceph-storage-plugin~Starts and ends with lowercase number or letter')}
                  </li>
                  <li>
                    {t(
                      'ceph-storage-plugin~Only lowercase letters, numbers, non-consecutive periods or hyphens',
                    )}
                  </li>
                  <li>{t('ceph-storage-plugin~Avoid using the form of an IP address')}</li>
                  <li>{t('ceph-storage-plugin~Globally unique name')}</li>
                </ul>
              }
            />
          }
          className="nb-create-bc-step-page-form__element"
          fieldId="bucketclassname-input"
          label={t('ceph-storage-plugin~BucketClass name')}
          helperText={t(
            'ceph-storage-plugin~A unique name for the bucket class within the project.',
          )}
        >
          <TextInput
            data-test="bucket-class-name"
            placeholder={t('ceph-storage-plugin~my-multi-cloud-mirror')}
            type="text"
            id="bucketclassname-input"
            value={state.bucketClassName}
            onChange={onChange}
            validated={validated}
            aria-label={t('ceph-storage-plugin~BucketClass Name')}
          />
        </FormGroup>
        <FormGroup
          className="nb-create-bc-step-page-form__element"
          fieldId="bc-description"
          label={t('ceph-storage-plugin~Description (Optional)')}
        >
          <TextArea
            data-test="bucket-class-description"
            id="bc-description"
            value={state.description}
            onChange={(data) => dispatch({ type: 'setDescription', value: data })}
            aria-label={t('ceph-storage-plugin~Description of bucket class')}
          />
        </FormGroup>
      </Form>
    </div>
  );
};

export default GeneralPage;

type GeneralPageProps = {
  dispatch: React.Dispatch<Action>;
  state: State;
};
