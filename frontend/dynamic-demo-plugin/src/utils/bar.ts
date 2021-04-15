import { SetFeatureFlag } from '@console/dynamic-plugin-sdk/src/extensions/feature-flags';

export default (label: string) => `Hello ${label} Function!`;

export const testHandler = (callback: SetFeatureFlag) => {
  // eslint-disable-next-line no-console
  console.log('testHandler called', callback);
};
