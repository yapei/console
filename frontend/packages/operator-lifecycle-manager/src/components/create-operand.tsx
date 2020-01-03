import * as React from 'react';
import { connect } from 'react-redux';
import { match } from 'react-router';
import { Helmet } from 'react-helmet';
import { safeDump } from 'js-yaml';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { Alert, ActionGroup, Button, Switch, Accordion, Checkbox } from '@patternfly/react-core';
import { JSONSchema6TypeName } from 'json-schema';
import {
  apiVersionForModel,
  GroupVersionKind,
  ImagePullPolicy,
  k8sCreate,
  K8sKind,
  K8sResourceKind,
  K8sResourceKindReference,
  kindForReference,
  referenceFor,
  referenceForModel,
  Status,
  nameForModel,
  CustomResourceDefinitionKind,
  modelFor,
  ObjectMetadata,
} from '@console/internal/module/k8s';
import { SwaggerDefinition, definitionFor } from '@console/internal/module/k8s/swagger';
import { CustomResourceDefinitionModel } from '@console/internal/models';
import { Firehose } from '@console/internal/components/utils/firehose';
import {
  NumberSpinner,
  StatusBox,
  BreadCrumbs,
  history,
  SelectorInput,
  ListDropdown,
  resourcePathFromModel,
  FirehoseResult,
  useScrollToTopOnMount,
  Dropdown,
} from '@console/internal/components/utils';
import { RootState } from '@console/internal/redux';
import { CreateYAML } from '@console/internal/components/create-yaml';
import { RadioGroup } from '@console/internal/components/radio';
import { ConfigureUpdateStrategy } from '@console/internal/components/modals/configure-update-strategy-modal';
import { ExpandCollapse } from '@console/internal/components/utils/expand-collapse';
import { ClusterServiceVersionModel } from '../models';
import { ClusterServiceVersionKind, CRDDescription, APIServiceDefinition } from '../types';
import { SpecCapability, StatusCapability, Descriptor } from './descriptors/types';
import { ResourceRequirements } from './descriptors/spec/resource-requirements';
import {
  NodeAffinity,
  PodAffinity,
  defaultNodeAffinity,
  defaultPodAffinity,
} from './descriptors/spec/affinity';
import { FieldGroup } from './descriptors/spec/field-group';
import { referenceForProvidedAPI, ClusterServiceVersionLogo, providedAPIsFor } from './index';

const annotationKey = 'alm-examples';

enum Validations {
  maximum = 'maximum',
  minimum = 'minimum',
  maxLength = 'maxLength',
  minLength = 'minLength',
  pattern = 'pattern',
}

/**
 * Combines OLM descriptor with JSONSchema.
 */
type OperandField = {
  path: string;
  displayName: string;
  description?: string;
  type: JSONSchema6TypeName;
  required: boolean;
  validation: {
    [Validations.maximum]?: number;
    [Validations.minimum]?: number;
    [Validations.maxLength]?: number;
    [Validations.minLength]?: number;
    [Validations.pattern]?: string;
  };
  capabilities: (SpecCapability | StatusCapability)[];
};

type FieldErrors = {
  [path: string]: string;
};

const fieldsFor = (providedAPI: CRDDescription) =>
  _.get(providedAPI, 'specDescriptors', [] as Descriptor[]).map((desc) => ({
    path: desc.path,
    displayName: desc.displayName,
    description: desc.description,
    type: null,
    required: false,
    validation: null,
    capabilities: desc['x-descriptors'],
  })) as OperandField[];

const fieldsForOpenAPI = (openAPI: SwaggerDefinition): OperandField[] => {
  if (_.isEmpty(openAPI)) {
    return [];
  }

  const fields: OperandField[] = _.flatten(
    _.map(
      _.get(openAPI, 'properties.spec.properties', {}),
      (val, key: string): OperandField[] => {
        const capabilitiesFor = (property): SpecCapability[] => {
          if (property.enum) {
            return property.enum.map((i) => SpecCapability.select.concat(i));
          }
          switch (property.type) {
            case 'integer':
              return [SpecCapability.number];
            case 'boolean':
              return [SpecCapability.booleanSwitch];
            case 'string':
            default:
              return [SpecCapability.text];
          }
        };

        switch (val.type) {
          case 'object':
            if (
              _.values(val.properties).some((nestedVal) =>
                ['object', 'array'].includes(nestedVal.type),
              )
            ) {
              return null;
            }
            return _.map(
              val.properties,
              (nestedVal, nestedKey: string): OperandField => ({
                path: [key, nestedKey].join('.'),
                displayName: _.startCase(nestedKey),
                type: nestedVal.type,
                required: _.get(val, 'required', []).includes(nestedKey),
                validation: null,
                capabilities: [
                  SpecCapability.fieldGroup.concat(key) as SpecCapability.fieldGroup,
                  ...capabilitiesFor(nestedVal),
                ],
              }),
            );
          case 'array':
            if (
              val.items.type !== 'object' ||
              _.values(val.items.properties).some((itemVal) =>
                ['object', 'array'].includes(itemVal.type),
              )
            ) {
              return null;
            }
            return _.map(
              val.items.properties,
              (itemVal, itemKey: string): OperandField => ({
                path: `${key}[0].${itemKey}`,
                displayName: _.startCase(itemKey),
                type: itemVal.type,
                required: _.get(val.items, 'required', []).includes(itemKey),
                validation: null,
                capabilities: [
                  SpecCapability.arrayFieldGroup.concat(key) as SpecCapability.fieldGroup,
                  ...capabilitiesFor(itemVal),
                ],
              }),
            );
          case undefined:
            return null;
          default:
            return [
              {
                path: key,
                displayName: _.startCase(key),
                type: val.type,
                required: _.get(openAPI.properties.spec, 'required', []).includes(key),
                validation: _.pick(val, [...Object.keys(Validations)]),
                capabilities: capabilitiesFor(val),
              },
            ];
        }
      },
    ),
  );

  return _.compact(fields);
};

export const CreateOperandForm: React.FC<CreateOperandFormProps> = (props) => {
  const fields: OperandField[] = (!_.isEmpty(
    props.clusterServiceVersion && props.providedAPI.specDescriptors,
  )
    ? fieldsFor(props.providedAPI)
    : fieldsForOpenAPI(props.openAPI)
  )
    .map((field) => {
      const capabilities = field.capabilities || [];
      const openAPIProperties = _.get(props, 'openAPI.properties.spec.properties');
      if (_.isEmpty(openAPIProperties)) {
        return { ...field, capabilities };
      }
      const schemaPath = field.path.split('.').join('.properties.');
      const required = (_.get(
        props.openAPI,
        _.dropRight(['properties', 'spec', ...field.path.split('.')])
          .join('.properties.')
          .concat('.required'),
        [],
      ) as string[]).includes(_.last(field.path.split('.')));
      const type = _.get(openAPIProperties, schemaPath.concat('.type')) as JSONSchema6TypeName;
      const validation = _.pick(openAPIProperties[schemaPath], [
        ...Object.keys(Validations),
      ]) as OperandField['validation'];

      return { ...field, capabilities, type, required, validation };
    })
    .concat(
      fieldsForOpenAPI(props.openAPI).filter(
        (crdField) =>
          props.providedAPI.specDescriptors &&
          !props.providedAPI.specDescriptors.some((d) => d.path === crdField.path),
      ),
    )
    // Associate `specDescriptors` with `fieldGroups` from OpenAPI
    .map((field, i, allFields) =>
      allFields.some((f) =>
        f.capabilities.includes(SpecCapability.fieldGroup.concat(
          field.path.split('.')[0],
        ) as SpecCapability.fieldGroup),
      )
        ? {
            ...field,
            capabilities: [
              ...new Set(field.capabilities).add(SpecCapability.fieldGroup.concat(
                field.path.split('.')[0],
              ) as SpecCapability.fieldGroup),
            ],
          }
        : field,
    );

  const defaultValueFor = (field: OperandField) => {
    if (
      _.intersection(field.capabilities, [
        SpecCapability.podCount,
        SpecCapability.password,
        SpecCapability.imagePullPolicy,
        SpecCapability.text,
        SpecCapability.number,
        SpecCapability.select,
      ]).length > 0
    ) {
      return '';
    }
    if (field.capabilities.includes(SpecCapability.resourceRequirements)) {
      return { limits: { cpu: '', memory: '' }, requests: { cpu: '', memory: '' } };
    }
    if (field.capabilities.some((c) => c.startsWith(SpecCapability.k8sResourcePrefix))) {
      return null;
    }
    if (field.capabilities.includes(SpecCapability.checkbox)) {
      return null;
    }
    if (field.capabilities.includes(SpecCapability.booleanSwitch)) {
      return null;
    }
    if (field.capabilities.includes(SpecCapability.updateStrategy)) {
      return null;
    }
    if (field.capabilities.includes(SpecCapability.nodeAffinity)) {
      return _.cloneDeep(defaultNodeAffinity);
    }
    if (
      field.capabilities.includes(SpecCapability.podAffinity) ||
      field.capabilities.includes(SpecCapability.podAntiAffinity)
    ) {
      return _.cloneDeep(defaultPodAffinity);
    }
    return null;
  };

  type FormValues = { [path: string]: any };

  const defaultFormValues = fields.reduce<FormValues>(
    (allFields, field) => ({ ...allFields, [field.path]: defaultValueFor(field) }),
    {},
  );
  const sampleFormValues = fields.reduce<FormValues>((allFields, field) => {
    const sampleValue = _.get(props.sample, `spec.${field.path}`);
    return sampleValue ? { ...allFields, [field.path]: sampleValue } : allFields;
  }, {});

  const [formValues, setFormValues] = React.useState<FormValues>({
    'metadata.name': 'example',
    'metadata.labels': [],
    ...defaultFormValues,
    ...sampleFormValues,
  });
  const [error, setError] = React.useState<string>();
  const [formErrors, setFormErrors] = React.useState<FieldErrors>({});

  const updateFormValues = (values: FormValues) => (path: _.PropertyPath, value: any) =>
    _.set(_.cloneDeep(values), path, value);

  const submit = (event) => {
    event.preventDefault();

    const errors = fields
      .filter((f) => !_.isNil(f.validation) || !_.isEmpty(f.validation))
      .filter((f) => f.required || !_.isEqual(formValues[f.path], defaultValueFor(f)))
      .reduce<FieldErrors>((allErrors, field) => {
        // NOTE: Use server-side validation in Kubernetes 1.16 (https://github.com/kubernetes/kubernetes/issues/80718#issuecomment-521081640)
        const fieldErrors = _.map(field.validation, (val, rule: Validations) => {
          switch (rule) {
            case Validations.minimum:
              return formValues[field.path] >= val ? null : `Must be greater than ${val}.`;
            case Validations.maximum:
              return formValues[field.path] <= val ? null : `Must be less than ${val}.`;
            case Validations.minLength:
              return formValues[field.path].length >= val
                ? null
                : `Must be at least ${val} characters.`;
            case Validations.maxLength:
              return formValues[field.path].length <= val
                ? null
                : `Must be greater than ${val} characters.`;
            case Validations.pattern:
              return new RegExp(val as string).test(formValues[field.path])
                ? null
                : `Does not match required pattern ${val}`;
            default:
              return null;
          }
        });
        // Just use first error
        return { ...allErrors, [field.path]: fieldErrors.find((e) => !_.isNil(e)) };
      }, {});
    setFormErrors(errors);

    if (_.isEmpty(_.compact(_.values(errors)))) {
      const specValues = fields.reduce((usedFormValues, field) => {
        const formValue = _.get(usedFormValues, field.path);
        if (_.isEqual(formValue, defaultValueFor(field)) || _.isNil(formValue)) {
          return _.omit(usedFormValues, field.path);
        }
        return usedFormValues;
      }, _.omit(formValues, ['metadata.name', 'metadata.labels']));

      const obj: K8sResourceKind = {
        apiVersion: apiVersionForModel(props.operandModel),
        kind: props.operandModel.kind,
        metadata: {
          namespace: props.namespace,
          name: formValues['metadata.name'],
          labels: SelectorInput.objectify(
            formValues['metadata.labels'],
          ) as ObjectMetadata['labels'],
          annotations: _.get(props.sample, 'metadata.annotations', {}),
        },
        spec: _.reduce(
          specValues,
          (spec, value, path) => _.set(spec, path, value),
          _.get(props.sample, 'spec', {}),
        ),
      };

      k8sCreate(props.operandModel, obj)
        .then(() =>
          history.push(
            `${resourcePathFromModel(
              ClusterServiceVersionModel,
              props.clusterServiceVersion.metadata.name,
              props.namespace,
            )}/${referenceForModel(props.operandModel)}`,
          ),
        )
        .catch((err: { json: Status }) => {
          setError(err.json.message);
        });
    }
  };

  // TODO(alecmerdler): Move this into a single `<SpecDescriptorInput>` entry component in the `descriptors/` directory
  const inputFor = (field: OperandField) => {
    if (field.capabilities.find((c) => c.startsWith(SpecCapability.fieldDependency))) {
      const controlFieldInfoList = field.capabilities.filter((c) =>
        c.startsWith(SpecCapability.fieldDependency),
      );
      const controlFieldPathList = _.uniq(
        controlFieldInfoList
          .map((c) => c.split(SpecCapability.fieldDependency)[1])
          .reduce((infoList, info) => [info.split(':')[0], ...infoList], []),
      );
      const controlFieldPath =
        _.isArray(controlFieldPathList) && controlFieldPathList.length === 1
          ? controlFieldPathList[0]
          : null;
      const currentControlFieldValue = !_.isNil(formValues[controlFieldPath])
        ? formValues[controlFieldPath].toString()
        : null;
      const expectedControlFieldValueList = controlFieldInfoList
        .map((c) => c.split(SpecCapability.fieldDependency)[1])
        .reduce((infoList, info) => [info.split(':')[1], ...infoList], []);

      if (!expectedControlFieldValueList.includes(currentControlFieldValue)) {
        return null;
      }
    }
    if (field.capabilities.includes(SpecCapability.podCount)) {
      return (
        <NumberSpinner
          id={field.path}
          className="pf-c-form-control"
          value={_.get(formValues, field.path)}
          onChange={({ currentTarget }) =>
            setFormValues((values) => ({
              ...values,
              [field.path]: _.toInteger(currentTarget.value),
            }))
          }
          changeValueBy={(operation) =>
            setFormValues((values) => ({
              ...values,
              [field.path]: _.toInteger(formValues[field.path]) + operation,
            }))
          }
          autoFocus
          required
        />
      );
    }
    if (field.capabilities.includes(SpecCapability.resourceRequirements)) {
      return (
        <dl style={{ marginLeft: '15px' }}>
          <dt>Limits</dt>
          <dd>
            <ResourceRequirements
              cpu={_.get(formValues, [field.path, 'limits', 'cpu'])}
              memory={_.get(formValues, [field.path, 'limits', 'memory'])}
              onChangeCPU={(cpu) =>
                setFormValues((values) =>
                  updateFormValues(values)([field.path, 'limits', 'cpu'], cpu),
                )
              }
              onChangeMemory={(memory) =>
                setFormValues((values) =>
                  updateFormValues(values)([field.path, 'limits', 'memory'], memory),
                )
              }
              path={`${field.path}.limits`}
            />
          </dd>
          <dt>Requests</dt>
          <dd>
            <ResourceRequirements
              cpu={_.get(formValues, [field.path, 'requests', 'cpu'])}
              memory={_.get(formValues, [field.path, 'requests', 'memory'])}
              onChangeCPU={(cpu) =>
                setFormValues((values) =>
                  updateFormValues(values)([field.path, 'requests', 'cpu'], cpu),
                )
              }
              onChangeMemory={(memory) =>
                setFormValues((values) =>
                  updateFormValues(values)([field.path, 'requests', 'memory'], memory),
                )
              }
              path={`${field.path}.requests`}
            />
          </dd>
        </dl>
      );
    }
    if (field.capabilities.includes(SpecCapability.password)) {
      return (
        <div>
          <input
            className="pf-c-form-control"
            id={field.path}
            type="password"
            {...field.validation}
            onChange={({ currentTarget }) =>
              setFormValues((values) => ({ ...values, [field.path]: currentTarget.value }))
            }
            value={formValues[field.path]}
          />
        </div>
      );
    }
    if (field.capabilities.some((c) => c.startsWith(SpecCapability.k8sResourcePrefix))) {
      const groupVersionKind: GroupVersionKind = field.capabilities
        .find((c) => c.startsWith(SpecCapability.k8sResourcePrefix))
        .split(SpecCapability.k8sResourcePrefix)[1]
        .replace('core~v1~', '');
      const model = modelFor(groupVersionKind);

      return (
        <div>
          {!_.isUndefined(model) ? (
            <ListDropdown
              resources={[
                { kind: groupVersionKind, namespace: model.namespaced ? props.namespace : null },
              ]}
              desc={field.displayName}
              placeholder={`Select ${kindForReference(groupVersionKind)}`}
              onChange={(name) => setFormValues((values) => ({ ...values, [field.path]: name }))}
            />
          ) : (
            <span>Cluster does not have resource {groupVersionKind}</span>
          )}
        </div>
      );
    }
    if (field.capabilities.includes(SpecCapability.checkbox)) {
      return (
        <Checkbox
          id={field.path}
          style={{ marginLeft: '10px' }}
          isChecked={!_.isNil(formValues[field.path]) ? (formValues[field.path] as boolean) : false}
          label={field.displayName}
          required={field.required}
          onChange={(val) => setFormValues((values) => ({ ...values, [field.path]: val }))}
        />
      );
    }
    if (field.capabilities.includes(SpecCapability.booleanSwitch)) {
      return (
        <Switch
          id={field.path}
          isChecked={formValues[field.path]}
          onChange={(val) => setFormValues((values) => ({ ...values, [field.path]: val }))}
          label="True"
          labelOff="False"
        />
      );
    }
    if (field.capabilities.includes(SpecCapability.imagePullPolicy)) {
      return (
        <RadioGroup
          currentValue={formValues[field.path]}
          items={_.values(ImagePullPolicy).map((policy) => ({ value: policy, title: policy }))}
          onChange={({ currentTarget }) =>
            setFormValues((values) => ({ ...values, [field.path]: currentTarget.value }))
          }
        />
      );
    }
    if (field.capabilities.includes(SpecCapability.updateStrategy)) {
      return (
        <ConfigureUpdateStrategy
          strategyType={_.get(formValues, `${field.path}.type`)}
          maxUnavailable={_.get(formValues, `${field.path}.rollingUpdate.maxUnavailable`)}
          maxSurge={_.get(formValues, `${field.path}.rollingUpdate.maxSurge`)}
          onChangeStrategyType={(type) =>
            setFormValues((values) => updateFormValues(values)([field.path, 'type'], type))
          }
          onChangeMaxUnavailable={(maxUnavailable) =>
            setFormValues((values) =>
              updateFormValues(values)(
                [field.path, 'rollingUpdate', 'maxUnavailable'],
                maxUnavailable,
              ),
            )
          }
          onChangeMaxSurge={(maxSurge) =>
            setFormValues((values) =>
              updateFormValues(values)([field.path, 'rollingUpdate', 'maxSurge'], maxSurge),
            )
          }
          replicas={1}
        />
      );
    }
    if (field.capabilities.includes(SpecCapability.text)) {
      return (
        <div>
          <input
            className="pf-c-form-control"
            id={field.path}
            type="text"
            onChange={({ currentTarget }) =>
              setFormValues((values) => ({ ...values, [field.path]: currentTarget.value }))
            }
            value={formValues[field.path]}
          />
        </div>
      );
    }
    if (field.capabilities.includes(SpecCapability.number)) {
      return (
        <div>
          <input
            className="pf-c-form-control"
            id={field.path}
            type="number"
            onChange={({ currentTarget }) =>
              setFormValues((values) => ({
                ...values,
                [field.path]: currentTarget.value !== '' ? _.toNumber(currentTarget.value) : '',
              }))
            }
            value={formValues[field.path]}
          />
        </div>
      );
    }
    if (field.capabilities.includes(SpecCapability.nodeAffinity)) {
      return (
        <div style={{ marginLeft: '15px' }}>
          <NodeAffinity
            affinity={formValues[field.path]}
            onChangeAffinity={(affinity) =>
              setFormValues((values) => ({ ...values, [field.path]: affinity }))
            }
          />
        </div>
      );
    }
    if (
      field.capabilities.includes(SpecCapability.podAffinity) ||
      field.capabilities.includes(SpecCapability.podAntiAffinity)
    ) {
      return (
        <div style={{ marginLeft: '15px' }}>
          <PodAffinity
            affinity={formValues[field.path]}
            onChangeAffinity={(affinity) =>
              setFormValues((values) => ({ ...values, [field.path]: affinity }))
            }
          />
        </div>
      );
    }
    if (field.capabilities.some((c) => c.startsWith(SpecCapability.select))) {
      return (
        <div style={{}}>
          <Dropdown
            title={`Select ${field.displayName}`}
            selectedKey={formValues[field.path]}
            items={field.capabilities
              .filter((c) => c.startsWith(SpecCapability.select))
              .map((c) => c.split(SpecCapability.select)[1])
              .reduce((all, option) => ({ [option]: option, ...all }), {})}
            onChange={(selected) =>
              setFormValues((values) => ({ ...values, [field.path]: selected }))
            }
          />
        </div>
      );
    }
    return null;
  };

  const getGroupName = (group, groupType) => {
    if (!_.isString(group) || !_.isString(groupType)) {
      return null;
    }
    return _.startCase(group.split(groupType)[1]);
  };

  const fieldGroups = fields.reduce(
    (groups, field) =>
      field.capabilities.find((c) => c.startsWith(SpecCapability.fieldGroup))
        ? groups.add(field.capabilities.find((c) =>
            c.startsWith(SpecCapability.fieldGroup),
          ) as SpecCapability.fieldGroup)
        : groups,
    new Set<SpecCapability.fieldGroup>(),
  );

  const arrayFieldGroups = fields.reduce(
    (groups, field) =>
      field.capabilities.find((c) => c.startsWith(SpecCapability.arrayFieldGroup))
        ? groups.add(field.capabilities.find((c) =>
            c.startsWith(SpecCapability.arrayFieldGroup),
          ) as SpecCapability.arrayFieldGroup)
        : groups,
    new Set<SpecCapability.arrayFieldGroup>(),
  );

  const advancedFields = fields
    .filter(
      (f) =>
        !f.capabilities.some(
          (c) =>
            c.startsWith(SpecCapability.fieldGroup) || c.startsWith(SpecCapability.arrayFieldGroup),
        ),
    )
    .filter((f) => f.capabilities.includes(SpecCapability.advanced));

  useScrollToTopOnMount();

  return (
    <div className="co-m-pane__body">
      <div className="row">
        <form className="col-md-8 col-lg-7" onSubmit={submit}>
          <Accordion asDefinitionList={false} className="co-create-operand__accordion">
            <div className="form-group">
              <label className="control-label co-required" htmlFor="name">
                Name
              </label>
              <input
                className="pf-c-form-control"
                type="text"
                onChange={({ target }) =>
                  setFormValues((values) => ({ ...values, 'metadata.name': target.value }))
                }
                value={formValues['metadata.name']}
                id="metadata.name"
                required
              />
            </div>
            <div className="form-group">
              <label className="control-label" htmlFor="tags-input">
                Labels
              </label>
              <SelectorInput
                onChange={(labels) =>
                  setFormValues((values) => ({ ...values, 'metadata.labels': labels }))
                }
                tags={formValues['metadata.labels']}
              />
            </div>
            {[...arrayFieldGroups].map((group) => {
              const groupName = getGroupName(group, SpecCapability.arrayFieldGroup);
              const fieldList = fields
                .filter((f) => f.capabilities.includes(group))
                .filter((f) => !_.isNil(inputFor(f)));

              return (
                !_.isEmpty(fieldList) && (
                  <div id={group} key={group}>
                    <FieldGroup
                      defaultExpand={
                        !_.some(
                          fieldList,
                          (f) => f.capabilities.includes(SpecCapability.advanced) && !f.required,
                        )
                      }
                      groupName={groupName}
                    >
                      {fieldList.map((field) => (
                        <div key={field.path}>
                          <div className="form-group co-create-operand__form-group">
                            <label
                              className={classNames('form-label', {
                                'co-required': field.required,
                              })}
                              htmlFor={field.path}
                            >
                              {field.displayName}
                            </label>
                            {inputFor(field)}
                            {field.description && (
                              <span id={`${field.path}__description`} className="help-block">
                                {field.description}
                              </span>
                            )}
                            {formErrors[field.path] && (
                              <span className="co-error">{formErrors[field.path]}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </FieldGroup>
                  </div>
                )
              );
            })}
            {[...fieldGroups].map((group) => {
              const groupName = getGroupName(group, SpecCapability.fieldGroup);
              const fieldList = fields
                .filter((f) => f.capabilities.includes(group))
                .filter((f) => !_.isNil(inputFor(f)));

              return (
                !_.isEmpty(fieldList) && (
                  <div id={group} key={group}>
                    <FieldGroup
                      defaultExpand={
                        !_.some(
                          fieldList,
                          (f) => f.capabilities.includes(SpecCapability.advanced) && !f.required,
                        )
                      }
                      groupName={groupName}
                    >
                      {fieldList.map((field) => (
                        <div key={field.path}>
                          <div className="form-group co-create-operand__form-group">
                            <label
                              className={classNames('form-label', {
                                'co-required': field.required,
                              })}
                              htmlFor={field.path}
                            >
                              {field.displayName}
                            </label>
                            {inputFor(field)}
                            {field.description && (
                              <span id={`${field.path}__description`} className="help-block">
                                {field.description}
                              </span>
                            )}
                            {formErrors[field.path] && (
                              <span className="co-error">{formErrors[field.path]}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </FieldGroup>
                  </div>
                )
              );
            })}
            {fields
              .filter(
                (f) =>
                  !f.capabilities.some(
                    (c) =>
                      c.startsWith(SpecCapability.fieldGroup) ||
                      c.startsWith(SpecCapability.arrayFieldGroup),
                  ),
              )
              .filter((f) => !f.capabilities.includes(SpecCapability.advanced))
              .filter((f) => !_.isNil(inputFor(f)))
              .map((field) => (
                <div key={field.path}>
                  <div className="form-group co-create-operand__form-group">
                    <label
                      className={classNames('form-label', { 'co-required': field.required })}
                      htmlFor={field.path}
                    >
                      {field.displayName}
                    </label>
                    {inputFor(field)}
                    {field.description && (
                      <span id={`${field.path}__description`} className="help-block">
                        {field.description}
                      </span>
                    )}
                    {formErrors[field.path] && (
                      <span className="co-error">{formErrors[field.path]}</span>
                    )}
                  </div>
                </div>
              ))}
            {advancedFields.length > 0 && (
              <div>
                <ExpandCollapse
                  textExpanded="Advanced Configuration"
                  textCollapsed="Advanced Configuration"
                >
                  {advancedFields
                    .filter((f) => !_.isNil(inputFor(f)))
                    .map((field) => (
                      <div key={field.path}>
                        <div className="form-group co-create-operand__form-group">
                          <label
                            className={classNames('form-label', { 'co-required': field.required })}
                            htmlFor={field.path}
                          >
                            {field.displayName}
                          </label>
                          {inputFor(field)}
                          {field.description && (
                            <span id={`${field.path}__description`} className="help-block">
                              {field.description}
                            </span>
                          )}
                          {formErrors[field.path] && (
                            <span className="co-error">{formErrors[field.path]}</span>
                          )}
                        </div>
                      </div>
                    ))}
                </ExpandCollapse>
              </div>
            )}
          </Accordion>
          {(!_.isEmpty(error) || !_.isEmpty(_.compact(_.values(formErrors)))) && (
            <Alert
              isInline
              className="co-alert co-break-word co-alert--scrollable"
              variant="danger"
              title="Error"
            >
              {error || 'Fix above errors'}
            </Alert>
          )}
          <div style={{ paddingBottom: '30px' }}>
            <ActionGroup className="pf-c-form">
              <Button onClick={submit} type="submit" variant="primary">
                Create
              </Button>
              <Button onClick={history.goBack} variant="secondary">
                Cancel
              </Button>
            </ActionGroup>
          </div>
        </form>
        <div className="col-md-4 col-lg-5">
          {props.clusterServiceVersion && props.providedAPI && (
            <div style={{ marginBottom: '30px' }}>
              <ClusterServiceVersionLogo
                displayName={props.providedAPI.displayName}
                icon={_.get(props.clusterServiceVersion, 'spec.icon[0]')}
                provider={_.get(props.clusterServiceVersion, 'spec.provider')}
              />
              {props.providedAPI.description}
            </div>
          )}
          <Alert
            isInline
            className="co-alert co-break-word"
            variant="info"
            title={
              'Note: Some fields may not be represented in this form. Please select "Edit YAML" for full control of object creation.'
            }
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Component which wraps the YAML editor to ensure the templates are added from the `ClusterServiceVersion` annotations.
 */
export const CreateOperandYAML: React.FC<CreateOperandYAMLProps> = (props) => {
  const template = _.attempt(() => safeDump(props.sample));
  if (_.isError(template)) {
    // eslint-disable-next-line no-console
    console.error('Error parsing example JSON from annotation. Falling back to default.');
  }
  const resourceObjPath = () =>
    `${resourcePathFromModel(
      ClusterServiceVersionModel,
      props.match.params.appName,
      props.match.params.ns,
    )}/${props.match.params.plural}`;

  return (
    <CreateYAML
      template={!_.isError(template) ? template : null}
      match={props.match}
      resourceObjPath={resourceObjPath}
      hideHeader
    />
  );
};

export const CreateOperand: React.FC<CreateOperandProps> = (props) => {
  const providedAPI = () =>
    providedAPIsFor(props.clusterServiceVersion.data).find(
      (crd) => referenceForProvidedAPI(crd) === referenceForModel(props.operandModel),
    );
  const sample = () =>
    JSON.parse(
      _.get(props.clusterServiceVersion.data.metadata.annotations, annotationKey, '[]'),
    ).find((s: K8sResourceKind) => referenceFor(s) === referenceForModel(props.operandModel));
  const [method, setMethod] = React.useState<'yaml' | 'form'>('yaml');

  const openAPI =
    (_.get(props.customResourceDefinition, [
      'data',
      'spec',
      'validation',
      'openAPIV3Schema',
    ]) as SwaggerDefinition) || definitionFor(props.operandModel);

  return (
    <>
      {props.loaded && (
        <div className="co-create-operand__header">
          <div className="co-create-operand__header-buttons">
            <BreadCrumbs
              breadcrumbs={[
                {
                  name: props.clusterServiceVersion.data.spec.displayName,
                  path: resourcePathFromModel(
                    ClusterServiceVersionModel,
                    props.clusterServiceVersion.data.metadata.name,
                    props.clusterServiceVersion.data.metadata.namespace,
                  ),
                },
                { name: `Create ${props.operandModel.label}`, path: window.location.pathname },
              ]}
            />
            <div style={{ marginLeft: 'auto' }}>
              {(method === 'form' && (
                <Button variant="link" onClick={() => setMethod('yaml')}>
                  Edit YAML
                </Button>
              )) ||
                (method === 'yaml' && (
                  <Button variant="link" onClick={() => setMethod('form')}>
                    Edit Form
                  </Button>
                ))}
            </div>
          </div>
          <h1 className="co-create-operand__header-text">{`Create ${props.operandModel.label}`}</h1>
          <p className="help-block">
            {(method === 'yaml' &&
              'Create by manually entering YAML or JSON definitions, or by dragging and dropping a file into the editor.') ||
              (method === 'form' &&
                'Create by completing the form. Default values may be provided by the Operator authors.')}
          </p>
        </div>
      )}
      <StatusBox
        loaded={props.loaded}
        loadError={props.loadError}
        data={props.clusterServiceVersion}
      >
        {(method === 'form' && (
          <CreateOperandForm
            namespace={props.match.params.ns}
            operandModel={props.operandModel}
            providedAPI={providedAPI()}
            sample={props.loaded ? sample() : null}
            clusterServiceVersion={props.clusterServiceVersion.data}
            openAPI={openAPI}
          />
        )) ||
          (method === 'yaml' && (
            <CreateOperandYAML
              match={props.match}
              sample={props.loaded ? sample() : null}
              operandModel={props.operandModel}
              providedAPI={providedAPI()}
              clusterServiceVersion={props.clusterServiceVersion.data}
            />
          ))}
      </StatusBox>
    </>
  );
};

const stateToProps = ({ k8s }: RootState, props: Omit<CreateOperandPageProps, 'operandModel'>) => ({
  operandModel: k8s.getIn(['RESOURCES', 'models', props.match.params.plural]) as K8sKind,
});

export const CreateOperandPage = connect(stateToProps)((props: CreateOperandPageProps) => (
  <>
    <Helmet>
      <title>{`Create ${kindForReference(props.match.params.plural)}`}</title>
    </Helmet>
    {props.operandModel && (
      <Firehose
        resources={[
          {
            kind: referenceForModel(ClusterServiceVersionModel),
            name: props.match.params.appName,
            namespace: props.match.params.ns,
            isList: false,
            prop: 'clusterServiceVersion',
          },
          {
            kind: CustomResourceDefinitionModel.kind,
            isList: false,
            name: nameForModel(props.operandModel),
            prop: 'customResourceDefinition',
            optional: true,
          },
        ]}
      >
        {/* FIXME(alecmerdler): Hack because `Firehose` injects props without TypeScript knowing about it */}
        <CreateOperand {...props as any} operandModel={props.operandModel} match={props.match} />
      </Firehose>
    )}
  </>
));

export type CreateOperandProps = {
  match: match<{ appName: string; ns: string; plural: K8sResourceKindReference }>;
  operandModel: K8sKind;
  loaded: boolean;
  loadError?: any;
  clusterServiceVersion: FirehoseResult<ClusterServiceVersionKind>;
  customResourceDefinition?: FirehoseResult<CustomResourceDefinitionKind>;
};

export type CreateOperandFormProps = {
  operandModel: K8sKind;
  providedAPI: CRDDescription | APIServiceDefinition;
  openAPI?: SwaggerDefinition;
  clusterServiceVersion: ClusterServiceVersionKind;
  sample?: K8sResourceKind;
  namespace: string;
};

export type CreateOperandYAMLProps = {
  operandModel: K8sKind;
  providedAPI: CRDDescription | APIServiceDefinition;
  clusterServiceVersion: ClusterServiceVersionKind;
  sample?: K8sResourceKind;
  match: match<{ appName: string; ns: string; plural: K8sResourceKindReference }>;
};

export type CreateOperandPageProps = {
  match: match<{ appName: string; ns: string; plural: K8sResourceKindReference }>;
  operandModel: K8sKind;
};

export type SpecDescriptorInputProps = {
  field: OperandField;
  sample?: K8sResourceKind;
};

CreateOperandPage.displayName = 'CreateOperandPage';
CreateOperand.displayName = 'CreateOperand';
CreateOperandForm.displayName = 'CreateOperandForm';
CreateOperandYAML.displayName = 'CreateOperandYAML';
