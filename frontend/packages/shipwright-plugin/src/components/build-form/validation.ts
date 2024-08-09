import * as yup from 'yup';
import i18n from '@console/internal/i18n';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { BuildFormikValues } from './types';

const nameSchema = () => yup.string().required(i18n.t('shipwright-plugin~Required'));

const outputImageSchema = () =>
  yup.object({
    image: yup.string().required(i18n.t('shipwright-plugin~Required')),
    secret: yup.string(),
  });

const sourceSchema = () =>
  yup
    .object({
      type: yup.string(),
      git: yup.object({
        git: yup.object({
          url: yup.string().required(i18n.t('shipwright-plugin~Required')),
          ref: yup.string(),
          dir: yup.string(),
        }),
      }),
    })
    .required(i18n.t('shipwright-plugin~Required'));

const buildSchema = () =>
  yup.object({
    strategy: yup.string().required(i18n.t('shipwright-plugin~Required')),
  });

const environmentVariablesSchema = () => yup.array();

export const formDataSchema = () =>
  yup.object({
    name: nameSchema(),
    outputImage: outputImageSchema(),
    source: sourceSchema(),
    build: buildSchema(),
    environmentVariables: environmentVariablesSchema(),
  });

export const validationSchema = () =>
  yup.mixed().test({
    test(values: BuildFormikValues) {
      const formYamlDefinition = yup.object({
        editorType: yup
          .string()
          .oneOf(Object.values(EditorType))
          .required(i18n.t('shipwright-plugin~Required')),
        formData: yup.mixed().when('editorType', {
          is: EditorType.Form,
          then: formDataSchema(),
        }),
        yamlData: yup.mixed().when('editorType', {
          is: EditorType.YAML,
          then: yup.string().required(i18n.t('shipwright-plugin~Required')),
        }),
      });

      return formYamlDefinition.validate(values, { abortEarly: false });
    },
  });
