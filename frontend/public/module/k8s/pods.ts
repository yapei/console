/* eslint-disable no-undef */

import * as _ from 'lodash';

const getRestartPolicy = pod => _.find({
  Always: {
    // A unique id to identify the type, used as the value when communicating with the API.
    id: 'Always',
    // What is shown in the UI.
    label: 'Always Restart',
    // Ordering weight.
    weight: 100,
    // Description in the UI.
    description: 'If the container restarts for any reason, restart it. ' +
      'Useful for stateless services that may fail from time to time.',
    // Default selection for new pods.
    default: true,
  },
  OnFailure: {
    id: 'OnFailure',
    label: 'Restart On Failure',
    weight: 200,
    description: 'If the container exits with a non-zero status code, restart it.',
  },
  Never: {
    id: 'Never',
    label: 'Never Restart',
    weight: 300,
    description: 'Never restart the container. ' +
      'Useful for containers that exit when they have completed a specific job, like a data import daemon.',
  },
}, {id: _.get<any, string>(pod, 'spec.restartPolicy')});

export const VolumeSource = {
  emptyDir: {
    weight: 100,
    id: 'emptyDir',
    label: 'Container Volume',
    description: 'Temporary directory that shares a pod\'s lifetime.',
  },
  hostPath: {
    weight: 200,
    id: 'hostPath',
    label: 'Host Directory',
    description: 'Pre-existing host file or directory, ' +
        'generally for privileged system daemons or other agents tied to the host.',
  },
  gitRepo: {
    weight: 300,
    id: 'gitRepo',
    label: 'Git Repo',
    description: 'Git repository at a particular revision.',
  },
  nfs: {
    weight: 400,
    id: 'nfs',
    label: 'NFS',
    description: 'NFS volume that will be mounted in the host machine.',
  },
  secret: {
    weight: 500,
    id: 'secret',
    label: 'Secret',
    description: 'Secret to populate volume.',
  },
  gcePersistentDisk: {
    weight: 600,
    id: 'gcePersistentDisk',
    label: 'GCE Persistent Disk',
    description: 'GCE disk resource attached to the host machine on demand.',
  },
  awsElasticBlockStore: {
    weight: 700,
    id: 'awsElasticBlockStore',
    label: 'AWS Elastic Block Store',
    description: 'AWS disk resource attached to the host machine on demand.',
  },
  glusterfs: {
    weight: 800,
    id: 'glusterfs',
    label: 'Gluster FS',
    description: 'GlusterFS volume that will be mounted on the host machine.',
  },
  iscsi: {
    weight: 900,
    id: 'iscsi',
    label: 'iSCSI',
    description: 'iSCSI disk attached to host machine on demand',
  },
  configMap: {
    weight: 1000,
    id: 'configMap',
    label: 'ConfigMap',
    description: 'ConfigMap to be consumed in volume.',
  },
};

export const getVolumeType = volume => {
  if (!volume) {
    return null;
  }
  return _.find(VolumeSource, function(v) {
    return !!volume[v.id];
  });
};

const genericFormatter = volInfo => {
  const keys = Object.keys(volInfo).sort();
  const parts = keys.map(function(key) {
    if (key === 'readOnly') {
      return '';
    }
    return volInfo[key];
  });
  if (keys.indexOf('readOnly') !== -1) {
    parts.push(volInfo.readOnly ? 'ro' : 'rw');
  }
  return parts.join(' ') || null;
};

export const getVolumeLocation = volume => {
  const vtype = getVolumeType(volume);
  if (!vtype) {
    return null;
  }

  const typeID = vtype.id;
  const info = volume[typeID];
  switch (typeID) {
    // Override any special formatting cases.
    case VolumeSource.gitRepo.id:
      return `${info.repository}:${info.revision}`;
    case VolumeSource.configMap.id:
    case VolumeSource.emptyDir.id:
    case VolumeSource.secret.id:
      return null;
    // Defaults to space separated sorted keys.
    default:
      return genericFormatter(info);
  }
};


export const getRestartPolicyLabel = pod => _.get(getRestartPolicy(pod), 'label', '');

export type PodReadiness = string;
export type PodPhase = string;

export const getVolumeMountPermissions = v => {
  if (!v) {
    return null;
  }

  return v.readOnly ? 'Read-only' : 'Read/Write';
};

export const getVolumeMountsByPermissions = pod => {
  if (!pod || !pod.spec) {
    return [];
  }

  const volumes = pod.spec.volumes.reduce((p, v) => {
    p[v.name] = v;
    return p;
  }, {});

  const m = {};
  _.forEach(pod.spec.containers, (c: any) => {
    _.forEach(c.volumeMounts, (v: any) => {
      let k = `${v.name}_${v.readOnly ? 'ro' : 'rw'}`;
      let mount = {container: c.name, mountPath: v.mountPath};
      if (k in m) {
        return m[k].mounts.push(mount);
      }
      m[k] = {mounts: [mount], name: v.name, readOnly: !!v.readOnly, volume: volumes[v.name]};
    });
  });

  return _.values(m);
};


// This logic (at this writing, Kubernetes 1.2.2) is replicated in kubeconfig
// (See https://github.com/kubernetes/kubernetes/blob/v1.3.0-alpha.2/pkg/kubectl/resource_printer.go#L574 )
export const podPhase = (pod): PodPhase => {
  if (!pod || !pod.status) {
    return '';
  }

  if (pod.metadata.deletionTimestamp) {
    return 'Terminating';
  }

  let ret = pod.status.phase;
  if (pod.status.reason) {
    ret = pod.status.reason;
  }

  if (pod.status.containerStatuses) {
    pod.status.containerStatuses.forEach(function(container) {
      if (container.state.waiting && container.state.waiting.reason) {
        ret = container.state.waiting.reason;
      } else if (container.state.terminated && container.state.terminated.reason) {
        ret = container.state.terminated.reason;
      }
      // kubectl has code here that populates the field if
      // terminated && !reason, but at this writing there appears to
      // be no codepath that will produce that sort of output inside
      // of the kubelet.
    });
  }

  return ret;
};

export const podReadiness = ({status}): PodReadiness => {
  if (_.isEmpty(status.conditions)) {
    return null;
  }

  let allReady = true;
  const conditions = _.map(status.conditions, (c: any) => {
    if (c.status !== 'True') {
      allReady = false;
    }
    return Object.assign({time: new Date(c.lastTransitionTime)}, c);
  });

  if (allReady) {
    return 'Ready';
  }

  let earliestNotReady = null;
  _.each(conditions, c => {
    if (c.status === 'True') {
      return;
    }
    if (!earliestNotReady) {
      earliestNotReady = c;
      return;
    }
    if (c.time < earliestNotReady.time) {
      earliestNotReady = c;
    }
  });

  return earliestNotReady.reason || earliestNotReady.type;
};
