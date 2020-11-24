import * as yup from 'yup';
import { TFunction } from 'i18next';
import { isValidUrl } from '@console/shared';
import {
  nameValidationSchema,
  projectNameValidationSchema,
  applicationNameValidationSchema,
} from '@console/dev-console/src/components/import/validation-schema';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { EventSources, SinkType } from './import-types';
import { isDefaultChannel, getChannelKind } from '../../utils/create-channel-utils';

export const sinkTypeUriValidatiuon = (t) =>
  yup.object().shape({
    uri: yup
      .string()
      .max(2000, t('knative-plugin~Please enter a URI that is less then 2000 characters.'))
      .test('validate-uri', t('knative-plugin~Invalid URI.'), function(value) {
        return isValidUrl(value);
      })
      .required(t('knative-plugin~Required')),
  });

const sinkServiceSchema = (t: TFunction) =>
  yup
    .object()
    .when('sinkType', {
      is: SinkType.Resource,
      then: yup.object().shape({
        name: yup.string().required(t('knative-plugin~Required')),
      }),
    })
    .when('sinkType', {
      is: SinkType.Uri,
      then: sinkTypeUriValidatiuon(t),
    });

export const sourceDataSpecSchema = (t: TFunction) =>
  yup
    .object()
    .when('type', {
      is: EventSources.CronJobSource,
      then: yup.object().shape({
        [EventSources.CronJobSource]: yup.object().shape({
          data: yup.string().max(253, t('knative-plugin~Cannot be longer than 253 characters.')),
          schedule: yup
            .string()
            .max(253, t('knative-plugin~Cannot be longer than 253 characters.'))
            .required(t('knative-plugin~Required')),
        }),
      }),
    })
    .when('type', {
      is: EventSources.PingSource,
      then: yup.object().shape({
        [EventSources.PingSource]: yup.object().shape({
          data: yup.string().max(253, t('knative-plugin~Cannot be longer than 253 characters.')),
          schedule: yup
            .string()
            .max(253, t('knative-plugin~Cannot be longer than 253 characters.'))
            .required(t('knative-plugin~Required')),
        }),
      }),
    })
    .when('type', {
      is: EventSources.SinkBinding,
      then: yup.object().shape({
        [EventSources.SinkBinding]: yup.object().shape({
          subject: yup.object().shape({
            selector: yup.object().shape({
              matchLabels: yup.object(),
            }),
            apiVersion: yup
              .string()
              .max(253, t('knative-plugin~Cannot be longer than 253 characters.'))
              .required(t('knative-plugin~Required')),
            kind: yup
              .string()
              .max(253, t('knative-plugin~Cannot be longer than 253 characters.'))
              .required(t('knative-plugin~Required')),
          }),
        }),
      }),
    })
    .when('type', {
      is: EventSources.ApiServerSource,
      then: yup.object().shape({
        [EventSources.ApiServerSource]: yup.object().shape({
          resources: yup
            .array()
            .of(
              yup.object({
                apiVersion: yup.string().required(t('knative-plugin~Required')),
                kind: yup.string().required(t('knative-plugin~Required')),
              }),
            )
            .required(t('knative-plugin~Required')),
        }),
      }),
    })
    .when('type', {
      is: EventSources.KafkaSource,
      then: yup.object().shape({
        [EventSources.KafkaSource]: yup.object().shape({
          bootstrapServers: yup
            .array()
            .of(yup.string())
            .min(1, t('knative-plugin~Required')),
          consumerGroup: yup.string().required(t('knative-plugin~Required')),
          topics: yup
            .array()
            .of(yup.string())
            .min(1, t('knative-plugin~Required')),
          net: yup.object().shape({
            sasl: yup.object().shape({
              enable: yup.boolean(),
              user: yup.object().when('enable', {
                is: true,
                then: yup.object().shape({
                  secretKeyRef: yup.object().shape({
                    name: yup.string().required(t('knative-plugin~Required')),
                    key: yup.string().required(t('knative-plugin~Required')),
                  }),
                }),
              }),
              password: yup.object().when('enable', {
                is: true,
                then: yup.object().shape({
                  secretKeyRef: yup.object().shape({
                    name: yup.string().required(t('knative-plugin~Required')),
                    key: yup.string().required(t('knative-plugin~Required')),
                  }),
                }),
              }),
            }),
            tls: yup.object().shape({
              enable: yup.boolean(),
              caCert: yup.object().when('enable', {
                is: true,
                then: yup.object().shape({
                  secretKeyRef: yup.object().shape({
                    name: yup.string().required(t('knative-plugin~Required')),
                    key: yup.string().required(t('knative-plugin~Required')),
                  }),
                }),
              }),
              cert: yup.object().when('enable', {
                is: true,
                then: yup.object().shape({
                  secretKeyRef: yup.object().shape({
                    name: yup.string().required(t('knative-plugin~Required')),
                    key: yup.string().required(t('knative-plugin~Required')),
                  }),
                }),
              }),
              key: yup.object().when('enable', {
                is: true,
                then: yup.object().shape({
                  secretKeyRef: yup.object().shape({
                    name: yup.string().required(t('knative-plugin~Required')),
                    key: yup.string().required(t('knative-plugin~Required')),
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
    })
    .when('type', {
      is: EventSources.ContainerSource,
      then: yup.object().shape({
        [EventSources.ContainerSource]: yup.object().shape({
          template: yup.object({
            spec: yup.object({
              containers: yup.array().of(
                yup.object({
                  image: yup.string().required(t('knative-plugin~Required')),
                }),
              ),
            }),
          }),
        }),
      }),
    });

export const eventSourceValidationSchema = (t: TFunction) =>
  yup.object().shape({
    editorType: yup.string(),
    formData: yup.object().when('editorType', {
      is: EditorType.Form,
      then: yup.object().shape({
        project: projectNameValidationSchema,
        application: applicationNameValidationSchema,
        name: nameValidationSchema,
        sink: sinkServiceSchema(t),
        data: sourceDataSpecSchema(t),
      }),
    }),
    yamlData: yup.string(),
  });

export const addChannelValidationSchema = (t: TFunction) =>
  yup.lazy((formData) => {
    if (isDefaultChannel(getChannelKind(formData.type))) {
      return yup.object().shape({
        application: applicationNameValidationSchema,
        name: nameValidationSchema,
        data: sourceDataSpecSchema(t),
        type: yup.string(),
      });
    }
    return yup.object().shape({
      yamlData: yup.string(),
    });
  });
