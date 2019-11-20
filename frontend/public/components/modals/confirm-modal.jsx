import * as React from 'react';
import * as PropTypes from 'prop-types';

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { PromiseComponent } from '../utils';

class ConfirmModal extends PromiseComponent {
  constructor(props) {
    super(props);
    this._submit = this._submit.bind(this);
    this._cancel = this.props.cancel.bind(this);
  }

  _submit(event) {
    event.preventDefault();

    this.handlePromise(
      this.props.executeFn(null, {
        supressNotifications: true,
      }),
    ).then(this.props.close);
  }

  render() {
    return (
      <form onSubmit={this._submit} name="form" className="modal-content">
        <ModalTitle>{this.props.title}</ModalTitle>
        <ModalBody>{this.props.message}</ModalBody>
        <ModalSubmitFooter
          errorMessage={this.state.errorMessage}
          inProgress={this.state.inProgress}
          submitText={this.props.btnText || 'Confirm'}
          cancel={this._cancel}
          cancelText={this.props.cancelText || 'Cancel'}
          submitDanger={this.props.submitDanger}
        />
      </form>
    );
  }
}
ConfirmModal.propTypes = {
  btnText: PropTypes.node,
  cancel: PropTypes.func.isRequired,
  cancelText: PropTypes.node,
  close: PropTypes.func.isRequired,
  executeFn: PropTypes.func.isRequired,
  message: PropTypes.node,
  title: PropTypes.node.isRequired,
  submitDanger: PropTypes.bool,
};

export const confirmModal = createModalLauncher(ConfirmModal);
