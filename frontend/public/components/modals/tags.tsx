import * as _ from 'lodash-es';
import * as React from 'react';

import { k8sPatch, K8sResourceKind, K8sKind } from '../../module/k8s';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { NameValueEditorPair, withHandlePromise } from '../utils';
import { AsyncComponent } from '../utils/async';

/**
 * Set up an AsyncComponent to wrap the name-value-editor to allow on demand loading to reduce the
 * vendor footprint size.
 */
const NameValueEditorComponent = (props) => (
  <AsyncComponent
    loader={() => import('../utils/name-value-editor').then((c) => c.NameValueEditor)}
    {...props}
  />
);

export const TagsModal = withHandlePromise((props: TagsModalProps) => {
  // Track tags as an array instead of an object / Map so we can preserve the order during editing and so we can have
  // duplicate keys during editing. However, the ordering and any duplicate keys are lost when the form is submitted.
  const [tags, setTags] = React.useState(
    _.isEmpty(props.tags) ? [['', '']] : _.toPairs(props.tags),
  );
  const [errorMessage, setErrorMessage] = React.useState(props.errorMessage);

  const submit = (e) => {
    e.preventDefault();

    // We just throw away any rows where the key is blank
    const usedTags = _.reject(tags, (t) => _.isEmpty(t[NameValueEditorPair.Name]));

    const keys = usedTags.map((t) => t[NameValueEditorPair.Name]);
    if (_.uniq(keys).length !== keys.length) {
      setErrorMessage('Duplicate keys found.');
      return;
    }
    // Make sure to 'add' if the path does not already exist, otherwise the patch request will fail
    const op = props.tags ? 'replace' : 'add';
    const patch = [{ path: props.path, op, value: _.fromPairs(usedTags) }];
    const promise = k8sPatch(props.kind, props.resource, patch);
    props.handlePromise(promise).then(props.close);
  };

  return (
    <form onSubmit={submit} className="modal-content">
      <ModalTitle>{props.title}</ModalTitle>
      <ModalBody>
        <NameValueEditorComponent
          nameValuePairs={tags}
          submit={submit}
          updateParentData={({ nameValuePairs }) => setTags(nameValuePairs)}
        />
      </ModalBody>
      <ModalSubmitFooter
        submitText="Save"
        cancel={props.cancel}
        errorMessage={props.errorMessage || errorMessage}
        inProgress={props.inProgress}
      />
    </form>
  );
});

export const annotationsModal = createModalLauncher((props: AnnotationsModalProps) => (
  <TagsModal
    path="/metadata/annotations"
    tags={props.resource.metadata.annotations}
    title="Edit Annotations"
    {...props}
  />
));

type TagsModalProps = {
  tags?: { [key: string]: string };
  path: string;
  title: string;
  kind: K8sKind;
  resource: K8sResourceKind;
  handlePromise: <T>(promise: Promise<T>) => Promise<T>;
  inProgress: boolean;
  errorMessage: string;
  cancel?: () => void;
  close?: () => void;
};

type AnnotationsModalProps = Omit<TagsModalProps, 'path' | 'tags' | 'title'>;

TagsModal.displayName = 'TagsModal';
