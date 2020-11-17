import { PipelineModel, PipelineRunModel } from '../../models';
import {
  stopPipelineRun,
  rerunPipelineAndRedirect,
  reRunPipelineRun,
  startPipeline,
  getPipelineKebabActions,
  editPipeline,
} from '../pipeline-actions';
import { mockPipelinesJSON } from './pipeline-test-data';
import { pipelineTestData, PipelineExampleNames, DataState } from '../../test-data/pipeline-data';

const samplePipeline = pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE].pipeline;
const samplePipelineRun =
  pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE].pipelineRuns[DataState.SUCCESS];
const i18nNS = 'pipelines-plugin';

describe('PipelineAction testing rerunPipeline create correct labels and callbacks', () => {
  it('expect label to be "Start Last Run" when latestRun is available', () => {
    const rerunAction = rerunPipelineAndRedirect(PipelineRunModel, samplePipelineRun);
    expect(rerunAction.labelKey).toBe(`${i18nNS}~Start Last Run`);
    expect(rerunAction.callback).not.toBeNull();
  });
});

describe('PipelineAction testing reRunPipelineRun create correct labels and callbacks', () => {
  it('expect label to be "Rerun" when latestRun is available', () => {
    const rerunAction = reRunPipelineRun(PipelineRunModel, samplePipelineRun);
    expect(rerunAction.labelKey).toBe(`${i18nNS}~Rerun`);
    expect(rerunAction.callback).not.toBeNull();
  });
});

describe('PipelineAction testing startPipeline create correct labels and callbacks', () => {
  it('expect label to be "Start" when latestRun is available', () => {
    const rerunAction = startPipeline(PipelineModel, samplePipeline);
    expect(rerunAction.labelKey).toBe(`${i18nNS}~Start`);
    expect(rerunAction.callback).not.toBeNull();
  });
});

describe('PipelineAction testing stopPipelineRun create correct labels and callbacks', () => {
  it('expect label to be "Stop" with hidden flag as false when latest Run is running', () => {
    const stopAction = stopPipelineRun(PipelineRunModel, {
      ...samplePipelineRun,
      status: {
        conditions: [
          {
            ...samplePipelineRun.status.conditions[0],
            status: 'Unknown',
          },
        ],
      },
    });
    expect(stopAction.labelKey).toBe(`${i18nNS}~Stop`);
    expect(stopAction.callback).not.toBeNull();
    expect(stopAction.hidden).toBeFalsy();
  });

  it('expect label to be "Stop" with hidden flag as true when latest Run is not running', () => {
    const stopAction = stopPipelineRun(PipelineRunModel, samplePipelineRun);
    expect(stopAction.labelKey).toBe(`${i18nNS}~Stop`);
    expect(stopAction.callback).not.toBeNull();
    expect(stopAction.hidden).not.toBeFalsy();
  });
});

describe('getPipelineKebabActions', () => {
  it('expect Remove Trigger option is present', () => {
    const pipelineKebabActions = getPipelineKebabActions(samplePipelineRun, true);
    expect(pipelineKebabActions.length).toBe(8);
    expect(pipelineKebabActions[3](PipelineModel, samplePipeline).labelKey).toBe(
      `${i18nNS}~Remove Trigger`,
    );
  });
  it('expect Remove Trigger option is not present', () => {
    const pipelineKebabActions = getPipelineKebabActions(samplePipelineRun, false);
    expect(pipelineKebabActions.length).toBe(7);
    expect(pipelineKebabActions[3](PipelineModel, samplePipeline).labelKey).not.toBe(
      `${i18nNS}~Remove Trigger`,
    );
  });
  it('expect Start Last Run option is present', () => {
    const pipelineKebabActions = getPipelineKebabActions(samplePipelineRun, false);
    expect(pipelineKebabActions.length).toBe(7);
    expect(pipelineKebabActions[1](PipelineRunModel, samplePipelineRun).labelKey).toBe(
      `${i18nNS}~Start Last Run`,
    );
  });
  it('expect Start Last Run option is not present', () => {
    const pipelineKebabActions = getPipelineKebabActions(undefined, false);
    expect(pipelineKebabActions.length).toBe(6);
    expect(pipelineKebabActions[1](PipelineRunModel, samplePipelineRun).labelKey).not.toBe(
      `${i18nNS}~Start Last Run`,
    );
  });
  it('expect Edit Pipeline option should be hidden when pipeline has inline taskSpec', () => {
    const editPipelineAction = editPipeline(PipelineModel, mockPipelinesJSON[2]);
    expect(editPipelineAction.labelKey).toBe(`${i18nNS}~Edit Pipeline`);
    expect(editPipelineAction.callback).not.toBeNull();
    expect(editPipelineAction.hidden).toBeTruthy();
  });
});
