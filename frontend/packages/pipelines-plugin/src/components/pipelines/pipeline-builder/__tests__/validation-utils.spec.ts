import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { validationSchema } from '../validation-utils';
import { initialPipelineFormData, TASK_ERROR_STRINGS, TaskErrorType } from '../const';
import {
  createSafeTask,
  embeddedTaskSpec,
  externalTaskNoDefaultParam,
  externalTaskWitEmptyDefaultParam,
  externalTaskWithDefaultParam,
  formDataBasicPassState,
  hasError,
  hasResults,
  resourceTask,
  shouldHaveFailed,
  shouldHavePassed,
  withFormData,
  workspaceTask,
} from './validation-utils-data';

const t = jest.fn((f) => f);
const requiredMessage = 'pipelines-plugin~Required';

describe('Pipeline Build validation schema', () => {
  describe('Form/YAML switcher validation', () => {
    it('should fail when provided an unknown editor type', async () => {
      await validationSchema(t)
        .validate({
          editorType: 'not a real value',
          yamlData: '',
          formData: initialPipelineFormData,
        })
        .then(shouldHaveFailed)
        .catch(
          hasError('editorType', 'editorType must be one of the following values: form, yaml'),
        );
    });

    it('should fail initial values because there are no tasks', async () => {
      await validationSchema(t)
        .validate({
          editorType: EditorType.Form,
          yamlData: '',
          formData: initialPipelineFormData,
        })
        .then(shouldHaveFailed)
        .catch(hasError('formData.tasks', 'pipelines-plugin~Must define at least one Task'));
    });
  });

  describe('Base form validation', () => {
    it('should pass if there is at least one Task', async () => {
      await withFormData(formDataBasicPassState)
        .then(hasResults)
        .catch(shouldHavePassed);
    });

    it('should fail if there is an invalid name', async () => {
      await withFormData({
        ...initialPipelineFormData,
        name: '123NoTaVaLiDnAmE-',
        tasks: [createSafeTask()],
      })
        .then(shouldHaveFailed)
        .catch(
          hasError(
            'formData.name',
            'console-shared~Name must consist of lower-case letters, numbers and hyphens. It must start with a letter and end with a letter or number.',
          ),
        );
    });

    it('should fail if not provided a param name', async () => {
      await withFormData({
        ...formDataBasicPassState,
        params: [{ noName: 'string' }],
      })
        .then(shouldHaveFailed)
        .catch(hasError('formData.params[0].name', requiredMessage));
    });

    it('should pass even if params default and description are empty', async () => {
      await withFormData({
        ...formDataBasicPassState,
        params: [{ name: 'test', default: undefined, description: undefined }],
      })
        .then(hasResults)
        .catch(shouldHavePassed);
    });

    it('should pass when params default and description are provided', async () => {
      await withFormData({
        ...formDataBasicPassState,
        params: [{ name: 'test', default: 'value', description: 'test data' }],
      });
    });

    // TODO: param with default as a string[]

    it('should pass when resource has a valid name and type', async () => {
      await withFormData({
        ...formDataBasicPassState,
        resources: [
          { name: 'git-value', type: 'git' },
          { name: 'image-value', type: 'image' },
          { name: 'cluster-value', type: 'cluster' },
          { name: 'storage-value', type: 'storage' },
        ],
      })
        .then(hasResults)
        .catch(shouldHavePassed);
    });

    it('should fail when provided an unknown resource type', async () => {
      await withFormData({
        ...formDataBasicPassState,
        resources: [{ name: 'invalid', type: 'not a type' }],
      })
        .then(shouldHaveFailed)
        .catch(
          hasError(
            'formData.resources[0].type',
            'formData.resources[0].type must be one of the following values: git, image, cluster, storage',
          ),
        );
    });

    it('should pass when provided with a valid workspace name', async () => {
      await withFormData({
        ...formDataBasicPassState,
        workspaces: [{ name: 'valid-name' }],
      })
        .then(hasResults)
        .catch(shouldHavePassed);
    });

    it('should fail when workspaces do not have a name', async () => {
      await withFormData({
        ...formDataBasicPassState,
        workspaces: [{ notName: 'not-valid' }],
      })
        .then(shouldHaveFailed)
        .catch(hasError('formData.workspaces[0].name', requiredMessage));
    });
  });

  describe('Tasks and ListTasks validation', () => {
    it('should fail if just has a name', async () => {
      await withFormData({
        ...initialPipelineFormData,
        tasks: [{ name: 'test' }],
      })
        .then(shouldHaveFailed)
        .catch(
          hasError('formData.tasks[0]', 'pipelines-plugin~TaskSpec or TaskRef must be provided'),
        );
    });

    it('should pass if provided a taskSpec and name', async () => {
      await withFormData({
        ...initialPipelineFormData,
        tasks: [{ name: 'test', taskSpec: {} }],
      })
        .then(hasResults)
        .catch(shouldHavePassed);
    });

    it('should fail if provided an incomplete taskRef', async () => {
      await withFormData({
        ...initialPipelineFormData,
        tasks: [{ name: 'test', taskRef: {} }],
      })
        .then(shouldHaveFailed)
        .catch(hasError('formData.tasks[0].taskRef.name', requiredMessage));
    });

    it('should pass if provided with a proper taskRef and name', async () => {
      await withFormData({
        ...initialPipelineFormData,
        tasks: [{ name: 'test', taskRef: { name: 'external-task' } }],
      })
        .then(hasResults)
        .catch(shouldHavePassed);
    });

    describe('Validate Run Afters', () => {
      it('should fail if runAfter is a single string', async () => {
        await withFormData({
          ...initialPipelineFormData,
          tasks: [{ name: 'test', runAfter: 'not-an-array', taskRef: { name: 'external-task' } }],
        })
          .then(shouldHaveFailed)
          .catch(
            hasError(
              'formData.tasks[0].runAfter',
              expect.stringContaining('formData.tasks[0].runAfter must be a `array` type'),
            ),
          );
      });

      it('should fail if runAfter is an array of strings that do not match other tasks', async () => {
        await withFormData({
          ...initialPipelineFormData,
          tasks: [
            { name: 'test', runAfter: ['does-not-exist'], taskRef: { name: 'external-task' } },
          ],
        })
          .then(shouldHaveFailed)
          .catch(hasError('formData.tasks[0].runAfter', 'pipelines-plugin~Invalid runAfter'));
      });

      it('should pass if runAfter is an array of strings that match other task names', async () => {
        await withFormData({
          ...initialPipelineFormData,
          tasks: [
            { name: 'first-task', taskRef: { name: 'external-task' } },
            { name: 'second-task', taskRef: { name: 'external-task' }, runAfter: ['first-task'] },
            {
              name: 'third-task',
              taskRef: { name: 'external-task' },
              runAfter: ['first-task', 'second-task'],
            },
          ],
        })
          .then(hasResults)
          .catch(shouldHavePassed);
      });

      it('should fail if runAfter in listTasks does not match other listTasks', async () => {
        await withFormData({
          ...formDataBasicPassState,
          listTasks: [
            { name: 'first-list-task' },
            { name: 'second-list-task', runAfter: ['first-list-task', 'not-a-real-task'] },
          ],
        })
          .then(shouldHaveFailed)
          .catch(hasError('formData.listTasks[1].runAfter', 'pipelines-plugin~Invalid runAfter'));
      });

      it('should fail if runAfter is itself', async () => {
        await withFormData({
          ...initialPipelineFormData,
          tasks: [
            { name: 'first-task', taskRef: { name: 'external-task' }, runAfter: ['first-task'] },
          ],
        })
          .then(shouldHaveFailed)
          .catch(hasError('formData.tasks[0].runAfter', 'pipelines-plugin~Invalid runAfter'));
      });

      it('should pass if runAfter is an array of strings that match listTasks or tasks names', async () => {
        await withFormData({
          ...initialPipelineFormData,
          tasks: [
            { name: 'first-task', taskRef: { name: 'external-task' } },
            {
              name: 'second-task',
              taskRef: { name: 'external-task' },
              runAfter: ['first-task', 'first-list-task'],
            },
          ],
          listTasks: [{ name: 'first-list-task', runAfter: ['first-task'] }],
        })
          .then(hasResults)
          .catch(shouldHavePassed);
      });
    });

    describe('Validate Parameters', () => {
      it('should fail if task params is missing a required param', async () => {
        await withFormData(
          {
            ...initialPipelineFormData,
            tasks: [
              {
                name: 'test-task',
                taskRef: { name: 'external-task', kind: 'ClusterTask' },
                params: [],
              },
            ],
          },
          {
            clusterTasks: [externalTaskNoDefaultParam],
          },
        )
          .then(shouldHaveFailed)
          .catch(
            hasError(
              'formData.tasks[0].params',
              TASK_ERROR_STRINGS[TaskErrorType.MISSING_REQUIRED_PARAMS],
            ),
          );
      });

      it('should fail if task params has no value and also the task lacks a default', async () => {
        await withFormData(
          {
            ...initialPipelineFormData,
            tasks: [
              {
                name: 'test-task',
                taskRef: { name: 'external-task', kind: 'ClusterTask' },
                params: [{ name: 'echo-value' }],
              },
            ],
          },
          {
            clusterTasks: [externalTaskNoDefaultParam],
          },
        )
          .then(shouldHaveFailed)
          .catch(
            hasError(
              'formData.tasks[0].params',
              TASK_ERROR_STRINGS[TaskErrorType.MISSING_REQUIRED_PARAMS],
            ),
          );
      });

      it('should pass if task params has no value but the task has a default', async () => {
        await withFormData(
          {
            ...initialPipelineFormData,
            tasks: [
              {
                name: 'test-task',
                taskRef: { name: 'external-task', kind: 'ClusterTask' },
                params: [{ name: 'echo-value-with-default' }],
              },
            ],
          },
          {
            clusterTasks: [externalTaskWithDefaultParam],
          },
        )
          .then(hasResults)
          .catch(shouldHavePassed);
      });

      it('should pass if the task params has no value but the task default is an empty string', async () => {
        await withFormData(
          {
            ...initialPipelineFormData,
            tasks: [
              {
                name: 'test-task',
                taskRef: { name: 'external-task', kind: 'ClusterTask' },
                params: [{ name: 'echo-value-with-empty-default' }],
              },
            ],
          },
          {
            clusterTasks: [externalTaskWitEmptyDefaultParam],
          },
        )
          .then(hasResults)
          .catch(shouldHavePassed);
      });

      it('should pass if the task params has no value but the task is embedded and not external', async () => {
        await withFormData({
          ...initialPipelineFormData,
          tasks: [
            {
              name: 'test-task',
              taskSpec: embeddedTaskSpec,
              params: [{ name: 'echo-value-no-task-ref' }],
            },
          ],
        })
          .then(hasResults)
          .catch(shouldHavePassed);
      });
    });

    describe('Validate Resources', () => {
      it('should fail if the task does not include resources but the task does', async () => {
        await withFormData(
          {
            ...initialPipelineFormData,
            tasks: [
              {
                name: 'test-task',
                taskRef: { name: 'external-task-with-resources', kind: 'ClusterTask' },
              },
            ],
          },
          {
            clusterTasks: [resourceTask],
          },
        )
          .then(shouldHaveFailed)
          .catch(
            hasError(
              'formData.tasks[0].resources',
              TASK_ERROR_STRINGS[TaskErrorType.MISSING_RESOURCES],
            ),
          );
      });

      it('should fail if the task does not fully include the required resources', async () => {
        await withFormData(
          {
            ...initialPipelineFormData,
            tasks: [
              {
                name: 'test-task',
                taskRef: { name: 'external-task-with-resources', kind: 'ClusterTask' },
                resources: {
                  inputs: [],
                  outputs: [],
                },
              },
            ],
          },
          {
            clusterTasks: [resourceTask],
          },
        )
          .then(shouldHaveFailed)
          .catch(
            hasError(
              'formData.tasks[0].resources',
              TASK_ERROR_STRINGS[TaskErrorType.MISSING_RESOURCES],
            ),
          );
      });

      it('should fail if the task contains some of the required resources', async () => {
        await withFormData(
          {
            ...initialPipelineFormData,
            resources: [{ name: 'resource-git', type: 'git' }],
            tasks: [
              {
                name: 'test-task',
                taskRef: { name: 'external-task-with-resources', kind: 'ClusterTask' },
                resources: {
                  inputs: [{ name: 'source-git', resource: 'resource-git' }],
                  outputs: [],
                },
              },
            ],
          },
          {
            clusterTasks: [resourceTask],
          },
        )
          .then(shouldHaveFailed)
          .catch(
            hasError(
              'formData.tasks[0].resources',
              TASK_ERROR_STRINGS[TaskErrorType.MISSING_RESOURCES],
            ),
          );
      });

      it('should fail early if the task contains some of the required resources and is the wrong type', async () => {
        await withFormData(
          {
            ...initialPipelineFormData,
            resources: [{ name: 'resource-git', type: 'cluster' }],
            tasks: [
              {
                name: 'test-task',
                taskRef: { name: 'external-task-with-resources', kind: 'ClusterTask' },
                resources: {
                  inputs: [{ name: 'source-git', resource: 'resource-git' }],
                  outputs: [],
                },
              },
            ],
          },
          {
            clusterTasks: [resourceTask],
          },
        )
          .then(shouldHaveFailed)
          .catch(
            hasError(
              'formData.tasks[0].resources',
              TASK_ERROR_STRINGS[TaskErrorType.MISSING_RESOURCES],
            ),
          );
      });

      it('should pass if the task contains all of the required resources', async () => {
        await withFormData(
          {
            ...initialPipelineFormData,
            resources: [
              { name: 'resource-git', type: 'git' },
              { name: 'resource-image', type: 'image' },
            ],
            tasks: [
              {
                name: 'test-task',
                taskRef: { name: 'external-task-with-resources', kind: 'ClusterTask' },
                resources: {
                  inputs: [{ name: 'source-git', resource: 'resource-git' }],
                  outputs: [{ name: 'source-image', resource: 'resource-image' }],
                },
              },
            ],
          },
          {
            clusterTasks: [resourceTask],
          },
        )
          .then(hasResults)
          .catch(shouldHavePassed);
      });

      it('should fail if the task contains all of the required resources but the wrong types', async () => {
        await withFormData(
          {
            ...initialPipelineFormData,
            resources: [
              { name: 'resource-git', type: 'cluster' },
              { name: 'resource-image', type: 'cluster' },
            ],
            tasks: [
              {
                name: 'test-task',
                taskRef: { name: 'external-task-with-resources', kind: 'ClusterTask' },
                resources: {
                  inputs: [{ name: 'source-git', resource: 'resource-git' }],
                  outputs: [{ name: 'source-image', resource: 'resource-image' }],
                },
              },
            ],
          },
          {
            clusterTasks: [resourceTask],
          },
        )
          .then(shouldHaveFailed)
          .catch(
            hasError(
              'formData.tasks[0].resources.outputs[0].resource',
              'pipelines-plugin~Resource type has changed, reselect',
            ),
          );
      });

      it('should fail if the task contains all the required resources but a mismatch in name occurs', async () => {
        await withFormData(
          {
            ...initialPipelineFormData,
            resources: [
              { name: 'name-change', type: 'git' },
              { name: 'resource-image', type: 'image' },
            ],
            tasks: [
              {
                name: 'test-task',
                taskRef: { name: 'external-task-with-resources', kind: 'ClusterTask' },
                resources: {
                  inputs: [{ name: 'source-git', resource: 'resource-git' }],
                  outputs: [{ name: 'source-image', resource: 'resource-image' }],
                },
              },
            ],
          },
          {
            clusterTasks: [resourceTask],
          },
        )
          .then(shouldHaveFailed)
          .catch(
            hasError(
              'formData.tasks[0].resources.inputs[0].resource',
              'pipelines-plugin~Resource name has changed, reselect',
            ),
          );
      });
    });

    describe('Validate Workspaces', () => {
      it('should fail if the task does not include workspaces but the task does', async () => {
        await withFormData(
          {
            ...initialPipelineFormData,
            tasks: [
              {
                name: 'test-task',
                taskRef: { name: 'external-task-with-workspace', kind: 'ClusterTask' },
              },
            ],
          },
          {
            clusterTasks: [workspaceTask],
          },
        )
          .then(shouldHaveFailed)
          .catch(
            hasError(
              'formData.tasks[0].workspaces',
              TASK_ERROR_STRINGS[TaskErrorType.MISSING_WORKSPACES],
            ),
          );
      });

      it('should fail if the task contains some of the required workspaces', async () => {
        await withFormData(
          {
            ...initialPipelineFormData,
            workspaces: [{ name: 'workspace' }],
            tasks: [
              {
                name: 'test-task',
                taskRef: { name: 'external-task-with-workspace', kind: 'ClusterTask' },
                workspaces: [{ name: 'output', workspace: 'workspace' }],
              },
            ],
          },
          {
            clusterTasks: [workspaceTask],
          },
        )
          .then(shouldHaveFailed)
          .catch(
            hasError(
              'formData.tasks[0].workspaces',
              TASK_ERROR_STRINGS[TaskErrorType.MISSING_WORKSPACES],
            ),
          );
      });

      it('should pass if the task contains all the required workspaces', async () => {
        await withFormData(
          {
            ...initialPipelineFormData,
            workspaces: [{ name: 'workspace' }, { name: 'workspace2' }],
            tasks: [
              {
                name: 'test-task',
                taskRef: { name: 'external-task-with-workspace', kind: 'ClusterTask' },
                workspaces: [
                  { name: 'output', workspace: 'workspace' },
                  { name: 'second', workspace: 'workspace2' },
                ],
              },
            ],
          },
          {
            clusterTasks: [workspaceTask],
          },
        )
          .then(hasResults)
          .catch(shouldHavePassed);
      });

      it('should fail if the task contains all the required workspaces but a mismatch in name occurs', async () => {
        await withFormData(
          {
            ...initialPipelineFormData,
            workspaces: [{ name: 'name-change' }, { name: 'workspace2' }],
            tasks: [
              {
                name: 'test-task',
                taskRef: { name: 'external-task-with-workspace', kind: 'ClusterTask' },
                workspaces: [
                  { name: 'output', workspace: 'workspace' },
                  { name: 'second', workspace: 'workspace2' },
                ],
              },
            ],
          },
          {
            clusterTasks: [workspaceTask],
          },
        )
          .then(shouldHaveFailed)
          .catch(
            hasError(
              'formData.tasks[0].workspaces[0].workspace',
              'pipelines-plugin~Workspace name has changed, reselect',
            ),
          );
      });
    });
  });
});
