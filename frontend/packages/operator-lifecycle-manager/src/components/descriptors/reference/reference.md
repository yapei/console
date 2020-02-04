# OLM Descriptor Reference

specDescriptors:
  1. [podCount](#1-podcount)
  2. [resourceRequirements](#2-resourcerequirements)
  3. [Kubernetes Object](#3-kubernetes-object)
  4. [booleanSwitch](#4-booleanswitch)
  5. [Checkbox](#5-checkbox)
  6. [Text Input](#6-text-input)
  7. [Number Input](#7-number-input)
  8. [Password Input](#8-password-input)
  9. [Update Strategy](#9-update-strategy)
  10. [Image Pull Policy](#10-image-pull-policy)
  11. [Node Affinity](#11-node-affinity)
  12. [Pod Affinity](#12-pod-affinity)
  13. [Pod Anti-affinity](#13-pod-anti-affinity)
  14. [Selector](#14-selector)
  15. [Field Group](#15-field-group)
  16. [Array Field Group](#16-array-field-group)
  17. [Select](#17-select)
  18. [Advanced](#18-advanced)
  19. [Endpoint List](#19-endpoint-list)
  20. [Field Dependency](#20-field-dependency)
  21. [DEPRECATED Descriptors](#21-deprecated-descriptors)

statusDescriptors:
  - [ToDo]

## specDescriptors

### 1. podCount

**x-descriptors**

This descriptor allows you to specify the number of pods for your instance. See example from [[CSV] etcd Operator](https://github.com/operator-framework/community-operators/blob/master/upstream-community-operators/etcd/etcdoperator.v0.9.4.clusterserviceversion.yaml#L243-L247)[**:**](https://github.com/operator-framework/community-operators/blob/master/upstream-community-operators/etcd/etcdoperator.v0.9.4.clusterserviceversion.yaml#L243-L247)

```yaml
…
- displayName: Size
  description: The desired number of member Pods for the etcd cluster.
  path: size
  x-descriptors:
  - 'urn:alm:descriptor:com.tectonic.ui:podCount'
…
```

**UI**
<table style="width:100%">
  <tr>
    <td width="50%" style="vertical-align:top">CREATION VIEW
      <img src="img/1-1_pod-new.png" /></td>
    <td width="50%" style="vertical-align:top">DISPLAY VIEW
      <img src="img/1-2_pod-dis.png" /></td>
  </tr>
  <tr>
    <td width="50%" style="vertical-align:top">MODIFY VIEW
      <img src="img/1-3_pod-mod.png" /></td>
  </tr>
</table>


### 2. resourceRequirements

**x-descriptors**

This descriptor allows you to specify the mini/max amount of compute resources required/allowed. See example from [[CSV] etcd Operator:](https://github.com/operator-framework/community-operators/blob/master/upstream-community-operators/etcd/etcdoperator.v0.9.4.clusterserviceversion.yaml#L248-L252)

```yaml
…
- displayName: Size
  description: Limits describes the minimum/maximum amount of compute resources required/allowed
  path: pod.resources
  x-descriptors:
    - 'urn:alm:descriptor:com.tectonic.ui:resourceRequirements'
…
```

**UI**
<table style="width:100%">
  <tr>
    <td width="50%" style="vertical-align:top">CREATION VIEW
      <img src="img/2-1_resrc-req-new.png" /></td>
    <td width="50%">DISPLAY VIEW
      <img src="img/2-2_resrc-req-dis.png" /></td>
  </tr>
  <tr>
    <td width="50%" style="vertical-align:top">MODIFY VIEW - Resource Limits
      <img src="img/2-3_resrc-req-mod.png" /></td>
    <td width="50%" style="vertical-align:top">MODIFY VIEW - Resource Requests
      <img src="img/2-4_resrc-req-mod.png" /></td>
  </tr>
</table>


### 3. Kubernetes Object

**x-descriptors**

This descriptor allows you to specify the prerequisite kubernetes object (e.g. _Secrets, ServiceAccount, Service, ConfigMap, Namespace, etc_) for your instance. See example from Couchbase Operator:

```yaml
…
- displayName: Server TLS Secret
  description: The name of the secret object that stores the server's TLS certificate.
  path: tls.static.member.serverSecret
  x-descriptors:
    - 'urn:alm:descriptor:io.kubernetes:Secret'
…
```

**UI**
<table style="width:100%">
  <tr>
    <td width="50%" style="vertical-align:top">CREATION VIEW
      <img src="img/3-1_k8s-obj-new.png" /></td>
    <td width="50%" style="vertical-align:top">DISPLAY VIEW
      <img src="img/3-2_k8s-obj-dis.png" /></td>
  </tr>
  <tr>
    <td colspan="2" style="vertical-align:top">MODIFY VIEW
      <p><small><b>* </b><i> Currently, this descriptor does not provide “Modify View”. Users would have to edit the content of the actual kubernetes object being specified.</i></small></p>
      </td>
  </tr>
</table>


### 4. booleanSwitch

**x-descriptors**

This descriptor allows you to specify the _true_ or _false_ value for the configuration. See example from Couchbase Operator:

```yaml
…
- displayName: Paused
  description: Specifies if the Operator will manage this cluster.
  path: paused
  x-descriptors:
    - 'urn:alm:descriptor:com.tectonic.ui:booleanSwitch'
…
```

**UI**
<table style="width:100%">
  <tr>
    <td width="50%" style="vertical-align:top">CREATION VIEW
      <img src="img/4-1_switch-new.png" /></td>
    <td width="50%" style="vertical-align:top">DISPLAY VIEW
      <img src="img/4-2_switch-dis.png" /></td>
  </tr>
  <tr style="vertical-align:top">
    <td width="50%">MODIFY VIEW
      <img src="img/4-3_switch-mod.png" /></td>
  </tr>
</table>


### 5. Checkbox

**x-descriptors**

This descriptor allows you to specify the _true_ or _false_ value for the configuration. See example for Business Automation Operator:

```yaml
…
- displayName: ImageRegistry Insecure
  description: A flag used to indicate the specified registry is insecure.
  path: imageRegistry.insecure
  x-descriptors:
    - 'urn:alm:descriptor:com.tectonic.ui:checkbox'
…
```

**UI**
<table style="width:100%">
  <tr style="vertical-align:top">
    <td width="50%">CREATION VIEW
      <img src="img/5-1_checkbox-new.png" /></td>
    <td width="50%">DISPLAY VIEW
      <img src="img/5-2_checkbox-dis.png" /></td>
  </tr>
  <tr style="vertical-align:top">
    <td colspan="2">MODIFY VIEW
      <p><small><i> * Display View also serves as the Modify view.</i></small></p>
      </td>
  </tr>
</table>


### 6. Text Input

**x-descriptors**

This descriptor allows you to specify a text input for a _string_ data type. See example for Portworx Operator:

```yaml
…
- displayName: Image
  description: The docker image name and version of Portworx Enterprise.
  path: image
  x-descriptors:
    - 'urn:alm:descriptor:com.tectonic.ui:text'
…
```

**UI**
<table style="width:100%">
  <tr style="vertical-align:top">
    <td width="50%">CREATION VIEW
      <img src="img/6-1_text-new.png" /></td>
    <td width="50%">DISPLAY VIEW
      <img src="img/6-2_text-dis.png" /></td>
  </tr>
  <tr style="vertical-align:top">
    <td colspan="2">MODIFY VIEW
      <p><small><b>* </b><i> Currently, this descriptor does not provide “Modify View”. Users would have to edit the content with YAML editor.</i></small></p>
      </td>
  </tr>
</table>


### 7. Number Input

**x-descriptors**

This descriptor allows you to specify a number input for a _number_ data type. See example for Portworx Operator:

```yaml
…
- displayName: Start Port
  description: The Start Port of Portworx
  path: startPort
  x-descriptors:
    - 'urn:alm:descriptor:com.tectonic.ui:number'
…
```

**UI**
<table style="width:100%">
  <tr style="vertical-align:top">
    <td width="50%">CREATION VIEW
      <img src="img/7-1_num-new.png" /></td>
    <td width="50%">DISPLAY VIEW
      <img src="img/7-2_num-dis.png" /></td>
  </tr>
  <tr style="vertical-align:top">
    <td colspan="2">MODIFY VIEW
      <p><small><b>* </b><i> Currently, this descriptor does not provide “Modify View”. Users would have to edit the content with YAML editor.</i></small></p>
      </td>
  </tr>
</table>


### 8. Password Input

**x-descriptors**

This descriptor allows you to specify a number input for a _password_ data type. See example for Grafana Operator:

```yaml
…
- displayName: Admin Password
  description: The Admin Password of Grafana.
  path: adminPassword
  x-descriptors:
    - 'urn:alm:descriptor:com.tectonic.ui:password'
…
```

**UI**
<table style="width:100%">
  <tr style="vertical-align:top">
    <td width="50%">CREATION VIEW
      <img src="img/8-1_passwd-new.png" /></td>
    <td width="50%">DISPLAY VIEW
      <img src="img/8-2_passwd-dis.png" />
      <img src="img/8-3_passwd-dis.png" /></td>
  </tr>
  <tr style="vertical-align:top">
    <td colspan="2">MODIFY VIEW
      <p><small><b>* </b><i> Currently, this descriptor does not provide “Modify View”. Users would have to edit the content with YAML editor.</i></small></p>
      </td>
  </tr>
</table>


### 9. Update Strategy

**x-descriptors**

This descriptor allows you to specify the strategy of your pods being replaced when a new version of the deployment exist. See example for Portworx Operator:

```yaml
…
- displayName: Update Strategy
  description: The update strategy of the deployment
  path: updateStrategy
  x-descriptors:
    - 'urn:alm:descriptor:com.tectonic.ui:updateStrategy'
…
```

**UI**
<table style="width:100%">
  <tr style="vertical-align:top">
    <td width="50%">CREATION VIEW
      <img src="img/9-1_updatestrategy-new.png" /></td>
    <td width="50%">DISPLAY VIEW
      <img src="img/9-2_updatestrategy-dis.png" />
      <p><small><b>[TODO]</b><i> Missing the display of "Max Unavailable" and "Max Surge"</small></i></p>
  </tr>
  <tr style="vertical-align:top">
    <td width="50%">MODIFY VIEW
      <img src="img/9-3_updatestrategy-mod.png" /></td>
  </tr>
</table>


### 10. Image Pull Policy

**x-descriptors**

This descriptor allows you to specify the policy for pulling your container image. See example from Appsody Operator:

```yaml
…
- displayName: Pull Policy
  description: image pull policy for container image
  path: pullPolicy
  x-descriptors:
    - 'urn:alm:descriptor:com.tectonic.ui:imagePullPolicy'
…
```

**UI**
<table style="width:100%">
  <tr style="vertical-align:top">
    <td width="50%">CREATION VIEW
      <img src="img/10-1_imgpullpolicy-new.png" /></td>
    <td width="50%">DISPLAY VIEW
      <img src="img/10-2_imgpullpolicy-dis.png" /></td>
  </tr>
  <tr style="vertical-align:top">
    <td colspan="2">MODIFY VIEW
      <p><small><b>[TODO]</b><i> * Currently Missing - The DISPLAY VIEW should be a text link to be able to access MODIFY VIEW that renders widget on the modal.
</i></small></p>
      </td>
  </tr>
</table>


### 11. Node Affinity

**x-descriptors**

This descriptor allows you to specify which nodes your pod is eligible to be scheduled on based on _labels on the node_. See example for Prometheus Operator:

```yaml
…
- displayName: Node Affinity
  description: Node affinity is a group of node affinity scheduling
  path: affinity.nodeAffinity
  x-descriptors:    
    - 'urn:alm:descriptor:com.tectonic.ui:nodeAffinity'
…
```

**UI**
<table style="width:100%">
  <tr style="vertical-align:top">
    <td width="50%">CREATION VIEW
      <img src="img/11-1_nodeaff-new.png" />
      <p><small><b>[TODO]</b><i> the dropdown for "OPERATOR" field is not wide enough to display "NotIn", "Exists", "DoesNotExist" (only as "...") when collapsed.</small></i></p></td>
    <td width="50%">DISPLAY VIEW
      <img src="img/11-2_nodeaff-dis.png" />
      <p><small><b>[TODO]</b><i> cannot display the configuration</small></i></p></td>
  </tr>
  <tr style="vertical-align:top">
    <td colspan="2">MODIFY VIEW
      <p><small><b>[TODO]</b><i> * Currently Missing - The DISPLAY VIEW should be a text link to be able to access MODIFY VIEW that renders widget on the modal.
</i></small></p>
      </td>
  </tr>
</table>


### 12. Pod Affinity

**x-descriptors**

This descriptor allows you to specify which nodes your pod is eligible to be scheduled based on _labels on pods_ that are already running on the node. See example for Prometheus Operator:

```yaml
…
- displayName: Pod Affinity
  description: Pod affinity is a group of inter pod affinity scheduling rules.
  path: affinity.podAntiAffinity
  x-descriptors:     
    - 'urn:alm:descriptor:com.tectonic.ui:podAffinity'
…
```

**UI**
<table style="width:100%">
  <tr style="vertical-align:top">
    <td width="50%">CREATION VIEW
      <img src="img/12-1_podaff-new.png" />
      <p><small><b>[TODO]</b><i> the dropdown for "OPERATOR" field is not wide enough to display "NotIn", "Exists", "DoesNotExist" (only as "...") when collapsed.</small></i></p></td>
    <td width="50%">DISPLAY VIEW
      <img src="img/12-2_podaff-dis.png" />
      <p><small><b>[TODO]</b><i> cannot display the configuration</small></i></p></td>
  </tr>
  <tr style="vertical-align:top">
    <td colspan="2">MODIFY VIEW
      <p><small><b>[TODO]</b><i> * Currently Missing - The DISPLAY VIEW should be a text link to be able to access MODIFY VIEW that renders widget on the modal.
</i></small></p>
      </td>
  </tr>
</table>


### 13. Pod Anti-affinity

**x-descriptors**

This descriptor allows you to specify which nodes your pod is eligible to be scheduled based on _labels on pods_ that are already running on the node. See example for Prometheus Operator:

```yaml
…
- displayName: Pod Anti Affinity
  description: Pod anti affinity is a group of inter pod anti affinity scheduling rules.
  path: affinity.podAntiAffinity
  x-descriptors:
    - 'urn:alm:descriptor:com.tectonic.ui:podAntiAffinity'
…
```

**UI**
<table style="width:100%">
  <tr style="vertical-align:top">
    <td width="50%">CREATION VIEW
      <img src="img/13-1_podantiaff-new.png" />
      <p><small><b>[TODO]</b><i> the dropdown for "OPERATOR" field is not wide enough to display "NotIn", "Exists", "DoesNotExist" (only as "...") when collapsed.</small></i></p></td>
    <td width="50%">DISPLAY VIEW
      <img src="img/13-2_podantiaff-dis.png" />
      <p><small><b>[TODO]</b><i> cannot display the configuration</small></i></p></td>
  </tr>
  <tr style="vertical-align:top">
    <td colspan="2">MODIFY VIEW
      <p><small><b>[TODO]</b><i> * Currently Missing - The DISPLAY VIEW should be a text link to be able to access MODIFY VIEW that renders widget on the modal.
</i></small></p>
      </td>
  </tr>
</table>


### 14. Selector

**x-descriptors**

This descriptor allows you to specify labels for identifying a set of objects via a _label selector_ (The label selector is the core grouping primitive in Kubernetes). See example from [[CSV] Prometheus Operator](https://github.com/operator-framework/community-operators/blob/master/upstream-community-operators/prometheus/prometheusoperator.0.27.0.clusterserviceversion.yaml#L231-L235):

```yaml
…
- displayName: Rule Config Map Selector
  description: A selector for the ConfigMaps from which to load rule files
  path: ruleSelector
  x-descriptors:
    - 'urn:alm:descriptor:com.tectonic.ui:selector:core:v1:ConfigMap'
…
```

**UI**
<table style="width:100%">
  <tr style="vertical-align:top">
    <td width="50%">CREATION VIEW
        <p><small><b>[TODO]</b><i> * Currently Missing - The CREATION VIEW should allow users to define “a set of labels” for “matchLabels”, similar to Console’s “Search” view.
        </i></small></p></td>
    <td width="50%">DISPLAY VIEW
      <img src="img/14-2_selector-dis.png" /></td>
  </tr>
  <tr style="vertical-align:top">
    <td colspan="2">MODIFY VIEW
      <p><small><b>[TODO]</b><i> Currently Missing</i></small></p>
      </td>
  </tr>
</table>

See Kubernetes doc for details in
[resources-that-support-set-based-requirement](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/#resources-that-support-set-based-requirements).


### 15. Field Group

**x-descriptors**

This descriptor allows you to specify a set of fields together as a _group_. Nested fields will automatically be grouped using the CRD&#39;s OpenAPI validation. See example for Portworx Operator:

```yaml
…
- displayName: Enabled
  description: Specifies if Stork is enabled.
  path: stork.enabled
  x-descriptors:
    - 'urn:alm:descriptor:com.tectonic.ui:fieldGroup:Stork'
    - 'urn:alm:descriptor:com.tectonic.ui:booleanSwitch'
- displayName: Image
  description: The docker image name and version of Stork.
  path: stork.image
  x-descriptors:
    - 'urn:alm:descriptor:com.tectonic.ui:fieldGroup:stork'
    - 'urn:alm:descriptor:com.tectonic.ui:text'
…
```

**UI**
<table style="width:100%">
  <tr style="vertical-align:top">
    <td width="50%">CREATION VIEW
      <img src="img/15-1_fieldgroup-new.png" />
    <td width="50%">DISPLAY VIEW
      <img src="img/15-2_fieldgroup-dis.png" />
      <p><small><b>[TODO]</b><i> Cannot display fields in a group</small></i></p></td>
  </tr>
  <tr style="vertical-align:top">
    <td colspan="2">MODIFY VIEW
      <p><small><b>[TODO]</b><i> * boolean toggles are not displayed as toggle so cannot edit the config</i></small></p>
      </td>
  </tr>
</table>


### 16. Array Field Group

**x-descriptors**

This descriptor allows you to specify a set of fields together as an _array item_. Nested fields of an array item will automatically be grouped using the CRD&#39;s OpenAPI validation. See example for Strimzi Operator:

```yaml
…
- description: The Broker ID to be assigned with the specified Storage Class.
  displayName: Broker ID
  path: kafka.storage.overrides[0].broker
  x-descriptors:
    - 'urn:alm:descriptor:com.tectonic.ui:arrayFieldGroup:overrides'
    - 'urn:alm:descriptor:com.tectonic.ui:number'
- description: The Storage Class to be assigned.
  displayName: Storage Class
  path: kafka.storage.overrides[0].class
  x-descriptors:
    - 'urn:alm:descriptor:com.tectonic.ui:arrayFieldGroup:overrides'
    - 'urn:alm:descriptor:io.kubernetes:StorageClass'
…
```

**UI**
<table style="width:100%">
  <tr style="vertical-align:top">
    <td width="50%">CREATION VIEW
      <img src="img/16-1_arrayfieldgroup-new.png" />
      <p><small><b>[TODO]</b><i> Currently the widget doesn't support add/remove item</i></p></td>
    <td width="50%">DISPLAY VIEW
      <img src="img/16-2_arrayfieldgroup-dis.png" />
      <p><small><b>[TODO]</b><i> Cannot display fields in a group</small></i></p></td>
  </tr>
  <tr style="vertical-align:top">
    <td colspan="2">MODIFY VIEW
      <p><small><b>* </b><i> Currently Missing.</i></small></p>
      </td>
  </tr>
</table>


### 17. Select

**x-descriptors**

This descriptor allows you to specify a set of predefined options (e.g. `enum:` type) for a dropdownUI component. See example for Strimzi Apache Kafka Operator:

```yaml
…
 - displayName: Kafka storage
   description: The type of storage used by Kafka brokers
   path: kafka.storage.type
   x-descriptors:
     - 'urn:alm:descriptor:com.tectonic.ui:select:ephemeral'
     - 'urn:alm:descriptor:com.tectonic.ui:select:persistent-claim'
     - 'urn:alm:descriptor:com.tectonic.ui:select:jbod'
…
```

**UI**
<table style="width:100%">
  <tr style="vertical-align:top">
    <td width="50%">CREATION VIEW
      <img src="img/17-1_select-new.png" /></td>
    <td width="50%">DISPLAY VIEW
      <img src="img/17-2_select-dis.png" /></td>
  </tr>
  <tr style="vertical-align:top">
    <td colspan="2">MODIFY VIEW
      <p><small><b>* </b><i> Currently, this descriptor does not provide “Modify View”. Users would have to edit the content of the actual kubernetes object being specified.</i></small></p>
      </td>
  </tr>
</table>


### 18. Advanced

**x-descriptors**

This descriptor allows you to specify fields as &quot;Advanced&quot; options and will be displayed at the latter section of the form. See example for Business Automation Operator:

```yaml
…
- description: Selected if the image registry is insecure.
  displayName: Insecure
  path: imageRegistry.insecure
  x-descriptors:
    - 'urn:alm:descriptor:com.tectonic.ui:booleanSwitch'
    - 'urn:alm:descriptor:com.tectonic.ui:advanced'
- description: >- Image registry's base 'url:port'. e.g. registry.example.com:5000.
        Defaults to 'registry.redhat.io'.
  displayName: Registry
  path: imageRegistry.registry
  x-descriptors:
    - 'urn:alm:descriptor:com.tectonic.ui:text'
    - 'urn:alm:descriptor:com.tectonic.ui:advanced'
…
```

**UI**
<table style="width:100%">
  <tr style="vertical-align:top">
    <td width="50%">CREATION VIEW
      <img src="img/18-1_advanced-new.png" /></td>
    <td width="50%">DISPLAY VIEW
      <img src="img/18-2_advanced-dis.png" />
      <p><small><b>[TODO]</b><i> * Currently Missing.</i></small></p></td>
  </tr>
  <tr style="vertical-align:top">
    <td colspan="2">MODIFY VIEW
      <p><small><b>* </b><i> Currently, this descriptor does not provide “Modify View”.</i></small></p></td>
  </tr>
</table>


### 19. Endpoint List

**x-descriptors**

This descriptor is created specifically for Prometheus Operator to specify a list of endpoints allowed for the ServiceMonitor it manages. See example from [[CSV] Prometheus Operator](https://github.com/operator-framework/community-operators/blob/master/upstream-community-operators/prometheus/prometheusoperator.0.27.0.clusterserviceversion.yaml#L270-L274):

```yaml
…
- displayName: Endpoints
  description: A list of endpoints allowed as part of this ServiceMonitor
  path: endpoints
  x-descriptors:
    - 'urn:alm:descriptor:com.tectonic.ui:endpointList'
…
```

**UI**
<table style="width:100%">
  <tr style="vertical-align:top">
    <td width="50%">CREATION VIEW
      <p><small><b>* </b><i> Currently, this descriptor does not provide “Creation View”.</small></i></p></td>
    <td width="50%">DISPLAY VIEW
      <img src="img/19-2_endpoints-dis.png" /></td>
  </tr>
  <tr style="vertical-align:top">
    <td colspan="2">MODIFY VIEW
      <p><small><b>* </b><i> Currently, this descriptor does not provide “Modify View”. Users would have to edit the content with YAML editor.</i></small></p>
      </td>
  </tr>
</table>


### 20. Field Dependency

**x-descriptors**

This descriptor allows you to specify a field as the dependent of a Control Field and shows the field when the current value of the Control Field is equal to the expected value:
```yaml
'urn:alm:descriptor:com.tectonic.ui:fieldDependency:CONTROL_FIELD_PATH:EXPECTED_VALUE'
```

**Usage**
1. Add “fieldDependency” to 'x-descriptors' array of the Dependent Field(s).
2. Replace “CONTROL_FIELD_PATH” with the 'path' property of the Control Field object.
3. Replace “EXPECTED_VALUE” with the actual expected value.

The Dependent Field(s) will be displayed only when the current value of the Control Field is equal to the expected value.

**Example**
```yaml
…
- displayName: Enable Upgrades
  description:  >-
      Set true to enable automatic micro version product upgrades, it is disabled by default.
  path: upgrades.enabled
  x-descriptors:
      - 'urn:alm:descriptor:com.tectonic.ui:booleanSwitch'
- displayName: Include minor version upgrades
  description: >-
      Set true to enable automatic minor product version upgrades, it is
      disabled by default. Requires spec.upgrades.enabled to be true.
  path: upgrades.minor
  x-descriptors:
      - 'urn:alm:descriptor:com.tectonic.ui:fieldDependency:upgrades.enabled:true'
      - 'urn:alm:descriptor:com.tectonic.ui:booleanSwitch'
…
```

**UI**
<table style="width:100%">
  <tr style="vertical-align:top">
    <td width="50%">CREATION VIEW
      <img src="img/20-1_fielddependency-new.png" />
      <br>
      <small><b>* </b><i> When "Enable Upgrades" (CONTROL FIELD) is TRUE:</i></small>
      <img src="img/20-2_fielddependency-new.png" />
      </td></td>
    <td width="50%">DISPLAY VIEW
      <img src="img/20-2_fielddependency-dis.png" /></td>
  </tr>
  <tr style="vertical-align:top">
    <td colspan="2">MODIFY VIEW
      <p><small><b>* </b><i>Currently, this descriptor does not provide “Modify View”.</i></small></p>
      </td>
  </tr>
</table>


### 21. DEPRECATED Descriptors

#### Label **[DEPRECATED]**

**x-descriptors**
```yaml
…
x-descriptors:
    - 'urn:alm:descriptor:com.tectonic.ui:label'
…
```
* Use [Text Input](#text-input) instead for `string` data type input/output.


#### namespaceSelector **[DEPRECATED]**

**x-descriptors**
```yaml
…
x-descriptors:
    'urn:alm:descriptor:com.tectonic.ui:namespaceSelector'
…
```
* Use [Kubernetes Object](#kubernetes-object) instead.
