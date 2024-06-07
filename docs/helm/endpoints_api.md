**List Helm Releases**
----
  _Returns List installed helm charts in JSON_

* **URL**

     `/api/helm/releases`

* **Method:**

  `GET`

*  **URL Params**

   `ns=[string]` - Namespace
   `limitInfo=[boolean]` - limitInfo

* **Success Response:**

  * **Code:** 200 <br />

* **Error Response:**

  * **Code:** 400 BAD REQUEST <br />
    **Content:** `{ error : "error message" }`


**Get Helm Release**
----
  _Returns installed helm release in JSON_

* **URL**

     `/api/helm/release`

* **Method:**

  `GET`

*  **URL Params**

   `ns=[string]` - Namespace

   `name=[string]` - Helm Release Name

* **Success Response:**

  * **Code:** 200 <br />
  * JSON encoded [Release structure](https://github.com/helm/helm/blob/main/pkg/release/release.go#L22)

* **Error Response:**

  * **Code:** 400 BAD REQUEST <br />
    **Content:** `{ error : "error message" }`



**Get Helm Release History**
----
  _Returns installed helm release history in JSON_

* **URL**

     `/api/helm/release/history`

* **Method:**

  `GET`

*  **URL Params**

   `ns=[string]` - Namespace

   `name=[string]` - Helm Release Name

* **Success Response:**

  * **Code:** 200 <br />
  * JSON encoded array of [Release structure](https://github.com/helm/helm/blob/main/pkg/release/release.go#L22)

* **Error Response:**

  * **Code:** 502 BAD GATEWAY <br />
    **Content:** `{ error : "error message" }`

  * **Code:** 404 NOT FOUND <br />
    **Content:** `{ error : "error message" }`

**Install Helm Release**
----
  _Install Helm release_

* **URL**

    `/api/helm/release`

* **Method:**

  `POST`

*  **Post Data Params**

```
 {
   name: [string],
   namespace: [string]
   chart_url: [string]
   values: map[string]interface{}
  }
```

*  **Example Request**
```
    {
    	"name": "test-helm-release",
    	"namespace": "default",
    	"chart_url": "https://github.com/akashshinde/console/raw/helm_endpoints/pkg/helm/testdata/influxdb-3.0.2.tgz"
        "values": { "service": {"type": "ClusterIP"} }
    }
```

* **Success Response:**

  * **Code:** 200 <br />
  * JSON encoded [Release structure](https://github.com/helm/helm/blob/main/pkg/release/release.go#L22)

* **Error Response:**

  * **Code:** 400 BAD REQUEST <br />
    **Content:** `{ error : "error message" }`


**Uninstall Helm Release**
----
  _Uninstall Helm release_

* **URL**

    `/api/helm/release`

* **Method:**

  `DELETE`

*  **URL Params**

   `ns=[string]` - Namespace

   `name=[string]` - Helm Release Name

* **Success Response:**

  * **Code:** 200 <br />
  * JSON encoded [UninstallReleaseResponse structure](https://github.com/helm/helm/blob/93137abbb4d391accd23dc774eb4d02a36d7a5f9/pkg/release/responses.go#L19)

  * **Code:** 404 NOT FOUND <br />
    **Content:** `{ error : "error message" }`

* **Error Response:**

  * **Code:** 502 BAD GATEWAY <br />
    **Content:** `{ error : "error message" }`


**Upgrade Helm Release**
----
  _Upgrade Helm release_

* **URL**

    `/api/helm/release`

* **Method:**

  `PUT`

*  **Put Data Params**

```
 {
   name: [string],
   namespace: [string]
   chart_url: [string]
   values: map[string]interface{}
  }
```

*  **Example Request**
```
    {
    	"name": "test-helm-release",
    	"namespace": "default",
    	"chart_url": "https://github.com/akashshinde/console/raw/helm_endpoints/pkg/helm/testdata/influxdb-3.0.2.tgz"
        "values": { "service": {"type": "ClusterIP"} }
    }
```

* **Success Response:**

  * **Code:** 200 <br />
  * JSON encoded [Release structure](https://github.com/helm/helm/blob/main/pkg/release/release.go#L22)

* **Error Response:**

  * **Code:** 502 BAD GATEWAY <br />
    **Content:** `{ error : "error message" }`

  * **Code:** 404 NOT FOUND <br />
    **Content:** `{ error : "error message" }`

**Rollback Helm Release**
----
  _Rollback Helm release_

* **URL**

    `/api/helm/release`

* **Method:**

  `PATCH`

*  **Put Data Params**

```
 {
   name: [string],
   namespace: [string]
   version: [int]
  }
```

*  **Example Request**
```
    {
    	"name": "test-helm-release",
    	"namespace": "default",
        "version": 1,
    }
```


* **Success Response:**

  * **Code:** 200 <br />
  * JSON encoded [Release structure](https://github.com/helm/helm/blob/main/pkg/release/release.go#L22)

* **Error Response:**

  * **Code:** 502 BAD GATEWAY <br />
    **Content:** `{ error : "error message" }`

  * **Code:** 404 NOT FOUND <br />
    **Content:** `{ error : "error message" }`

**Render Helm Template/Manifests**
----

  _Simulates helm template command_

* **URL**

    `/api/helm/template`

* **Method:**

  `POST`

*  **Post Data Params**

```
 {
   name: [string],
   namespace: [string]
   chart_url: [string]
   value: map[string]interface{}
  }
```

*  **Example Request**
```
    {
    	"name": "test-helm-release",
    	"namespace": "default",
    	"chart_url": "https://github.com/akashshinde/console/raw/helm_endpoints/pkg/helm/testdata/influxdb-3.0.2.tgz"
        "values": { "service": {"type": "ClusterIP"} }
    }
```

* **Success Response:**

  * **Code:** 200 <br />

* **Error Response:**

  * **Code:** 502 BAD REQUEST <br />
    **Content:** `{ error : "error message" }`

**Retrieve a Chart**
----

_Returns all chart details for the given chart URL_

* **URL**

    `/api/helm/chart`

* **Method:**

  `GET`

*  **URL Params**

   `url=[string]` - Chart URL

* **Success Response:**

  * **Code:** 200 <br />
  * JSON representation of [Chart structure](https://github.com/helm/helm/blob/main/pkg/chart/chart.go#L31)

* **Error Response:**

  * **Code:** 400 BAD REQUEST <br />
    **Content:** `{ error : "error message" }`

**Retrieve Helm Repository Index**
----

_Returns repository index file containing all entries from all configured repositories_

* **URL**

    `/api/helm/charts/index.yaml`

* **Method:**

  `GET`

* **Supported URL Query Parameter:**
    *  `onlyCompatible` - `true`/`false` Setting true would return helm charts which are supported in the provided cluster.
    Default value is set to true if not provided.

* **Success Response:**

  * **Code:** 200 <br />
  * JSON representation of [Index file](https://github.com/helm/helm/blob/main/pkg/repo/index.go#L79)
  * Each entry key is appended with [source repo name](https://github.com/openshift/api/blob/master/helm/v1beta1/types_helm_chart_repository.go#L16).
    Double dash (`--`) serves as the separate between the chart and repo name (e.g. `foo-chart--my-repo`)

* **Error Response:**

  * **Code:** 400 BAD REQUEST <br />
    **Content:** `{ error : "error message" }`

**Verify Chart Url**
----
_Verifies if a Helm chart is compliant with a certain set of independent checks using chart URL_

* **URL**

    `/api/helm/verify`

* **Method:**

  `POST`

*  **Post Data Params**

```
  chart_url: [string]
  value: map[string]interface{}
```

*  **Example Request**

```
  {
    "chart_url": "https://github.com/openshift-helm-charts/charts/releases/download/redhat-redis-sed-1.0.1/redhat-redis-sed-1.0.1.tgz",
    "values":{
	    "provider":"developer-console"
    }
}
```

* **Success Response:**

  * **Code:** 200 <br />
  * JSON encoded [Release structure](https://github.com/redhat-certification/chart-verifier/blob/main/pkg/chartverifier/reportsummary/types.go#L39-43)

* **Error Response:**

  * **Code:** 502 BAD GATEWAY <br />
    **Content:** `{ error : "error message" }`

  * **Code:** 404 NOT FOUND <br />
    **Content:** `{ error : "error message" }`

**Install Helm Release Asynchronously**
----
  _Install Helm release asynchronously_

* **URL**

    `/api/helm/release/async`

* **Method:**

  `POST`

*  **Post Data Params**

```
 {
   name: [string],
   namespace: [string]
   chart_url: [string]
   values: map[string]interface{}
  }
```

*  **Example Request**
```
    {
    	"name": "test-helm-release",
    	"namespace": "default",
    	"chart_url": "https://github.com/akashshinde/console/raw/helm_endpoints/pkg/helm/testdata/influxdb-3.0.2.tgz"
        "values": { "service": {"type": "ClusterIP"} }
    }
```

* **Success Response:**

  * **Code:** 201 <br />
  * JSON encoded [Secret structure](https://github.com/openshift/console/blob/master/vendor/k8s.io/api/core/v1/types.go#L6110)

* **Error Response:**

  * **Code:** 400 BAD REQUEST <br />
    **Content:** `{ error : "error message" }`






**Upgrade Helm Release Asynchronously**
----
  _Upgrade Helm release asynchronously_

* **URL**

    `/api/helm/release/async`

* **Method:**

  `PUT`

*  **Post Data Params**

```
 {
   name: [string],
   namespace: [string]
   chart_url: [string]
   values: map[string]interface{}
  }
```

*  **Example Request**
```
    {
    	"name": "test-helm-release",
    	"namespace": "default",
    	"chart_url": "https://github.com/akashshinde/console/raw/helm_endpoints/pkg/helm/testdata/influxdb-3.0.2.tgz"
        "values": { "service": {"type": "ClusterIP"} }
    }
```

* **Success Response:**

  * **Code:** 201 <br />
  * JSON encoded [Secret structure](https://github.com/openshift/console/blob/master/vendor/k8s.io/api/core/v1/types.go#L6110)

* **Error Response:**

  * **Code:** 400 BAD REQUEST <br />
    **Content:** `{ error : "error message" }`


**Uninstall Helm Release Asynchronously**
----
  _Uninstall Helm release asynchronously_

* **URL**

    `/api/helm/release/async`

* **Method:**

  `DELETE`

*  **URL Params**

   `ns=[string]` - Namespace

   `name=[string]` - Helm Release Name

   `version=[string]` - Helm Release Version

* **Success Response:**

  * **Code:** 204 <br />

  * **Code:** 404 NOT FOUND <br />
    **Content:** `{ error : "error message" }`

* **Error Response:**

  * **Code:** 502 BAD GATEWAY <br />
    **Content:** `{ error : "error message" }`
