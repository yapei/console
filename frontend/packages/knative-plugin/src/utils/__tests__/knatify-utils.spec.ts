import {
  getKnatifyWorkloadData,
  getCommonInitialValues,
  getInitialValuesKnatify,
} from '../knatify-utils';
import {
  imageStremsData,
  knatifyFormCommonInitailValues,
  ksvcData,
} from '../__mocks__/knatify-mock';
import { deploymentData } from './knative-serving-data';

describe('knatify-utils', () => {
  it('getKnatifyWorkloadData should return valid knative service spec', () => {
    expect(getKnatifyWorkloadData(deploymentData)).toEqual(ksvcData);
  });

  it('getCommonInitialValues should return valid formik common initial values', () => {
    expect(getCommonInitialValues(ksvcData, 'overlayimage', 'testproject3')).toEqual(
      knatifyFormCommonInitailValues,
    );
  });

  it('getInitialValuesKnatify should return valid formik initial values with external regstry and searchTerm if image is not in imageStreams', () => {
    const knatifyFormInitialVal = {
      ...knatifyFormCommonInitailValues,
      runtimeIcon: null,
      searchTerm: 'openshift/hello-openshift',
      registry: 'external',
      allowInsecureRegistry: false,
      imageStream: { image: '', tag: '', namespace: '' },
      isi: { name: '', image: {}, tag: '', status: { metadata: {}, status: '' }, ports: [] },
      image: { name: '', image: {}, tag: '', status: { metadata: {}, status: '' }, ports: [] },
      build: { env: [], triggers: {}, strategy: '' },
      isSearchingForImage: false,
    };
    expect(getInitialValuesKnatify(ksvcData, 'overlayimage', 'testproject3', [])).toEqual(
      knatifyFormInitialVal,
    );
  });

  it('getInitialValuesKnatify should return valid formik initial values with internal regstry and valid IS if image is not in imageStreams', () => {
    const mockKsvcData = {
      ...ksvcData,
      spec: {
        template: {
          ...ksvcData.spec.template,
          spec: {
            containers: [
              {
                image:
                  'image-registry.openshift-image-registry.svc:5000/testproject3/ruby-ex-git-dc@sha256:731442c798a6afd04c4b2a97c29eb55993df87ee861185b736097ea72959d0bc',
                ports: [{ containerPort: 8080 }],
                imagePullPolicy: 'Always',
                resources: {},
              },
            ],
          },
        },
      },
    };
    const knatifyFormInitialVal = {
      ...knatifyFormCommonInitailValues,
      runtimeIcon: null,
      searchTerm: '',
      registry: 'internal',
      allowInsecureRegistry: false,
      imageStream: { image: 'ruby-ex-git-dc', tag: 'latest', namespace: 'testproject3' },
      isi: { name: '', image: {}, tag: '', status: { metadata: {}, status: '' }, ports: [] },
      image: { name: '', image: {}, tag: '', status: { metadata: {}, status: '' }, ports: [] },
      build: { env: [], triggers: {}, strategy: '' },
      isSearchingForImage: false,
    };
    expect(
      getInitialValuesKnatify(mockKsvcData, 'overlayimage', 'testproject3', imageStremsData),
    ).toEqual(knatifyFormInitialVal);
  });
});
