import * as _ from 'lodash';
import * as Immutable from 'immutable';
import { JSONSchema6 } from 'json-schema';
import { UiSchema } from 'react-jsonschema-form';
import { getSchemaType } from 'react-jsonschema-form/lib/utils';
import { modelFor } from '@console/internal/module/k8s';
import { getJSONSchemaOrder } from '@console/shared/src/components/dynamic-form/utils';
import { SpecCapability, Descriptor } from '../descriptors/types';
import { capabilityFieldMap, capabilityWidgetMap } from '../descriptors/spec/spec-descriptor-input';
import { HIDDEN_UI_SCHEMA } from './const';
import {
  REGEXP_K8S_RESOURCE_SUFFIX,
  REGEXP_FIELD_DEPENDENCY_PATH_VALUE,
  REGEXP_SELECT_OPTION,
  OBJECT_COMPATIBLE_CAPABILITIES,
  ARRAY_COMPATIBLE_CAPABILITIES,
  PRIMITIVE_COMPATIBLE_CAPABILITIES,
  DEPRECATED_CAPABILITIES,
} from '../descriptors/const';
import { getSchemaAtPath } from '@console/shared';
import { JSONSchemaType } from '@console/shared/src/components/dynamic-form';

const getCompatibleCapabilities = (jsonSchemaType: JSONSchemaType) => {
  switch (jsonSchemaType) {
    case JSONSchemaType.object:
      return OBJECT_COMPATIBLE_CAPABILITIES;
    case JSONSchemaType.array:
      return ARRAY_COMPATIBLE_CAPABILITIES;
    default:
      return PRIMITIVE_COMPATIBLE_CAPABILITIES;
  }
};

// Transform a path string from a descriptor to a JSON schema path array
export const descriptorPathToUISchemaPath = (path: string): string[] =>
  (_.toPath(path) ?? []).map((subPath) => {
    return /^\d+$/.test(subPath) ? 'items' : subPath;
  });

// Applies a hidden widget and label configuration to every property of the given schema.
// This is useful for whitelisting only a few schema properties when all properties are not known.
export const hideAllExistingProperties = (schema: JSONSchema6) => {
  return _.reduce(
    schema?.properties,
    (acc, _unused, propertyName) => ({
      ...acc,
      [propertyName]: HIDDEN_UI_SCHEMA,
    }),
    {},
  );
};

const k8sResourceCapabilityToUISchema = (capability: SpecCapability): UiSchema => {
  const [, suffix] = capability.match(REGEXP_K8S_RESOURCE_SUFFIX) ?? [];
  const groupVersionKind = suffix?.replace(/:/g, '~');
  const model = groupVersionKind && modelFor(groupVersionKind);
  if (model) {
    return {
      'ui:widget': 'K8sResourceWidget',
      'ui:options': { model, groupVersionKind },
    };
  }
  return {};
};

const fieldDependencyCapabilityToUISchema = (capability: SpecCapability): UiSchema => {
  const [, path, controlFieldValue] = capability.match(REGEXP_FIELD_DEPENDENCY_PATH_VALUE) ?? [];
  const controlFieldPath = descriptorPathToUISchemaPath(path);
  const controlFieldName = _.last(controlFieldPath);
  return {
    ...(path &&
      controlFieldValue && {
        'ui:dependency': {
          controlFieldPath,
          controlFieldValue,
          controlFieldName,
        },
      }),
  };
};

const selectCapabilitiesToUISchema = (capabilities: SpecCapability[]): UiSchema => {
  const items = capabilities.reduce((optionAccumulator, capability) => {
    const [, option] = capability.match(REGEXP_SELECT_OPTION) ?? [];
    return {
      ...optionAccumulator,
      ...(option && { [option]: option }),
    };
  }, {});

  if (!_.isEmpty(items)) {
    return {
      'ui:field': 'DropdownField',
      'ui:items': items,
    };
  }

  return {};
};

// Given an array of SpecCapabilities, return the appropriate corresponding UISchema
export const capabilitiesToUISchema = (capabilities: SpecCapability[] = []) => {
  if (!capabilities?.length) {
    return {};
  }

  const k8sResourceCapability = _.find(capabilities, (capability) =>
    capability.startsWith(SpecCapability.k8sResourcePrefix),
  );
  if (k8sResourceCapability) {
    return k8sResourceCapabilityToUISchema(k8sResourceCapability);
  }

  const hasSelectOptions = _.some(capabilities, (capability) =>
    capability.startsWith(SpecCapability.select),
  );
  if (hasSelectOptions) {
    return selectCapabilitiesToUISchema(capabilities);
  }

  const field = _.reduce(
    capabilities,
    (fieldAccumulator, capability) => {
      return fieldAccumulator ?? capabilityFieldMap.get(capability);
    },
    undefined,
  );

  const widget = _.reduce(
    capabilities,
    (widgetAccumulator, capability) => {
      return widgetAccumulator ?? capabilityWidgetMap.get(capability);
    },
    undefined,
  );

  return {
    ...(field && { 'ui:field': field }),
    ...(widget && { 'ui:widget': widget }),
  };
};

const getValidCapabilities = (descriptor: Descriptor<SpecCapability>, jsonSchema: JSONSchema6) => {
  const schemaType = getSchemaType(jsonSchema ?? {}) as JSONSchemaType;
  const compatibleCapabilities = getCompatibleCapabilities(schemaType);
  const [valid, invalid, deprecated] = _.reduce(
    descriptor?.['x-descriptors'] ?? [],
    ([validAccumulator, invalidAccumulator, deprecatedAccumulator], capability) => {
      const isDeprecated = DEPRECATED_CAPABILITIES.some((deprecatedCapability) =>
        capability.startsWith(deprecatedCapability),
      );
      const isValid = compatibleCapabilities.some((compatibleCapability) =>
        capability.startsWith(compatibleCapability),
      );
      if (isDeprecated) {
        return [
          validAccumulator,
          invalidAccumulator,
          [...(deprecatedAccumulator ?? []), capability],
        ];
      }
      return isValid
        ? [[...(validAccumulator ?? []), capability], invalidAccumulator, deprecatedAccumulator]
        : [validAccumulator, [...(invalidAccumulator ?? []), capability], deprecatedAccumulator];
    },
    [[], [], []],
  );

  if (invalid?.length) {
    invalid.forEach((i) => {
      // eslint-disable-next-line no-console
      console.warn(
        `[Operand Form] x-descriptor "${i}" is not compatible with schema property at ${descriptor.path} and will have no effect on the corresponding form field.`,
      );
    });
  }

  if (deprecated?.length) {
    deprecated.forEach((i) => {
      // eslint-disable-next-line no-console
      console.warn(
        `[Operand Form] x-descriptor "${i}" is deprecated and will have no effect on the form field corresponding to ${descriptor.path}`,
      );
    });
  }

  return valid ?? [];
};

// Map a set of spec descriptors to a ui schema
export const descriptorsToUISchema = (
  descriptors: Descriptor<SpecCapability>[],
  jsonSchema: JSONSchema6,
) => {
  const uiSchemaFromDescriptors = _.reduce(
    descriptors,
    (uiSchemaAccumulator, descriptor, index) => {
      const schemaForDescriptor = getSchemaAtPath(jsonSchema, descriptor.path);
      if (!schemaForDescriptor) {
        // eslint-disable-next-line no-console
        console.warn(
          '[OperandForm] SpecDescriptor path references a non-existent schema property:',
          descriptor.path,
        );
        return uiSchemaAccumulator;
      }
      const capabilities = getValidCapabilities(descriptor, schemaForDescriptor);
      const uiSchemaPath = descriptorPathToUISchemaPath(descriptor.path);
      const isAdvanced = capabilities.includes(SpecCapability.advanced);
      const dependency = capabilities.find((capability) =>
        capability.startsWith(SpecCapability.fieldDependency),
      );
      return uiSchemaAccumulator.withMutations((mutable) => {
        if (isAdvanced) {
          const advancedPropertyName = _.last(uiSchemaPath);
          const pathToAdvanced = [...uiSchemaPath.slice(0, uiSchemaPath.length - 1), 'ui:advanced'];
          const currentAdvanced = mutable.getIn(pathToAdvanced) ?? Immutable.List();
          mutable.setIn(pathToAdvanced, currentAdvanced.push(advancedPropertyName));
        }

        mutable.setIn(
          uiSchemaPath,
          Immutable.Map({
            ...(descriptor.description && { 'ui:description': descriptor.description }),
            ...(descriptor.displayName && { 'ui:title': descriptor.displayName }),
            ...(dependency && fieldDependencyCapabilityToUISchema(dependency)),
            ...capabilitiesToUISchema(capabilities),
            'ui:sortOrder': index + 1,
          }),
        );
      });
    },
    Immutable.Map(),
  ).toJS();
  return _.merge(uiSchemaFromDescriptors, getJSONSchemaOrder(jsonSchema, uiSchemaFromDescriptors));
};

// Use jsonSchema, descriptors, and some defaults to generate a uiSchema
export const getUISchema = (jsonSchema, providedAPI) => {
  return {
    metadata: {
      ...hideAllExistingProperties(jsonSchema?.properties?.metadata as JSONSchema6),
      name: {
        'ui:title': 'Name',
        'ui:widget': 'TextWidget',
      },
      labels: {
        'ui:title': 'Labels',
        'ui:field': 'LabelsField',
      },
      'ui:options': {
        label: false,
      },
      'ui:order': ['name', 'labels', '*'],
    },
    spec: {
      ...descriptorsToUISchema(providedAPI?.specDescriptors, jsonSchema?.properties?.spec),
      'ui:options': {
        label: false,
      },
    },
    'ui:order': ['metadata', 'spec', '*'],
  };
};
