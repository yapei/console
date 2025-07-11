### Preparation - 1st approach - two additional plugins
- `cp dynamic-demo-plugin foo-plugin`
- `cp dynamic-demo-plugin bar-plugin`

**Make following changes in foo-plugin and bar-plugin folder**

**For foo-plugin:**
- replace all occurance of 9001 to 9002 in foo-plugin folder
- update `consolePlugin` in `foo-plugin/package.json` file with below values
```json 
"consolePlugin": {
    "name": "foo-plugin",
    "version": "1.0.0",
    "disableStaticPlugins": [
      "@console/demo-plugin"
    ],
    "exposedModules": {
      "exampleNavs": "./utils/example-navs"
    }
  }
```
- update `console-extensions.json` file with below values
```json
[
  {
    "type": "console.navigation/section",
    "properties": {
      "id": "foo-section",
      "perspective": "admin",
      "name": "Foo Plugin Section"
    }
  },
  {
    "type": "console.navigation/href",
    "properties": {
      "id": "admin-dynamic-route-1",
      "perspective": "admin",
      "section": "foo-section",
      "name": "%plugin__console-demo-plugin~Dynamic Nav 1%",
      "href": "/dynamic-route-1"
    }
  },
  {
    "type": "console.page/route",
    "properties": {
      "exact": true,
      "path": ["/dynamic-route-1"],
      "component": {
        "$codeRef": "exampleNavs.DynamicPage1"
      }
    }
  }
]
```
- update `src/components` and `src/uitls` folder, to keep only two files
```bash
$ ls -R src/
components	i18n.ts		utils

src/components:
ExamplePage.tsx

src/utils:
example-navs.tsx
```
**For bar-plugin:**
- replace all occurance of 9001 to 9003 in foo-plugin folder
- update `consolePlugin` in `foo-plugin/package.json` file with below values
```json
  "consolePlugin": {
    "name": "bar-plugin",
    "version": "2.0.0",
    "disableStaticPlugins": [
      "@console/demo-plugin"
    ],
    "exposedModules": {
      "exampleNavs": "./utils/example-navs"
    }
  }
```
- update `console-extensions.json` file with below values
```json
[
  {
    "type": "console.navigation/section",
    "properties": {
      "id": "bar-section",
      "perspective": "admin",
      "name": "Bar Plugin Section"
    }
  },
  {
    "type": "console.navigation/href",
    "properties": {
      "id": "admin-dynamic-route-2",
      "perspective": "admin",
      "section": "bar-section",
      "name": "%plugin__console-demo-plugin~Dynamic Nav 2%",
      "href": "/dynamic-route-2"
    }
  },
  {
    "type": "console.page/route",
    "properties": {
      "exact": true,
      "path": ["/dynamic-route-2"],
      "component": {
        "$codeRef": "exampleNavs.DynamicPage2"
      }
    }
  }
]
```
- update `src/components` and `src/uitls` folder, to keep only two files
```bash
$ ls -R src/
components	i18n.ts		utils

src/components:
ExamplePage.tsx

src/utils:
example-navs.tsx
```

### Testing Scenarios - 1st approach
#### 1-1 foo has dependencies on bar, bar is available
[RESULT] both are successfully loaded
```bash
$ ./bin/bridge -plugins foo-plugin=http://localhost:9002 -plugins bar-plugin=http://localhost:9003
```
```bash
$ cat foo-plugin/package.json | jq .consolePlugin
{
  "name": "foo-plugin",
  "version": "1.0.0",
  "disableStaticPlugins": [
    "@console/demo-plugin"
  ],
  "dependencies": {
    "bar-plugin": "~2.0.0"
  },
  "exposedModules": {
    "exampleNavs": "./utils/example-navs"
  }
}
```

Browser Console logs:
```bash
Dynamic plugins: [foo-plugin, bar-plugin]
Loading plugin manifest from http://localhost:9000/api/plugins/foo-plugin/plugin-manifest.json
Loading plugin manifest from http://localhost:9000/api/plugins/bar-plugin/plugin-manifest.json
Resolving dependencies for plugin bar-plugin@2.0.0  //make sure Bar is loaded first then Foo
Resolving dependencies for plugin foo-plugin@1.0.0
Loading scripts of plugin bar-plugin@2.0.0  
Loading plugin script from http://localhost:9000/api/plugins/bar-plugin/plugin-entry.js?cacheBuster=a98lan
Added plugin bar-plugin@2.0.0
Loading scripts of plugin foo-plugin@1.0.0  //make sure Bar is loaded first then Foo
Loading plugin script from http://localhost:9000/api/plugins/foo-plugin/plugin-entry.js?cacheBuster=oay31d
Plugin bar-plugin@2.0.0 is now enabled
Added plugin foo-plugin@1.0.0
Plugin foo-plugin@1.0.0 is now enabled
```
[1-1-foo-has-dependency-on-bar-bar-available screenshot](https://drive.google.com/file/d/1XnFgw-w06vfMhE8VozD4f3NUTjznjr1U/view)

#### 1-2 foo has dependencies on bar, bar is NOT available
[RESULT] foo is NOT loaded
```bash
$ ./bin/bridge -plugins foo-plugin=http://localhost:9002
```
foo-plugin/package.json same as above

Browser Console logs:
```bash
Dynamic plugins: [foo-plugin]
Loading plugin manifest from http://localhost:9000/api/plugins/foo-plugin/plugin-manifest.json
Resolving dependencies for plugin foo-plugin@1.0.0
Failed to resolve dependencies of plugin foo-plugin Error: Required plugins are not available: bar-plugin
```
[1-2-foo-has-dependency-on-bar-bar-NOT-available screenshot](https://drive.google.com/file/d/1EsXTjTe8STATTKmXtMt1iV8cHxAgrUj2/view)

#### 1-3 foo has optionalDependencies on bar, bar is available
[RESULT] both are successfully loaded
```bash
$ ./bin/bridge -plugins foo-plugin=http://localhost:9002 -plugins bar-plugin=http://localhost:9003
```
```bash
$ cat foo-plugin/package.json | jq .consolePlugin
{
  "name": "foo-plugin",
  "version": "1.0.0",
  "disableStaticPlugins": [
    "@console/demo-plugin"
  ],
  "optionalDependencies": {
    "bar-plugin": "~2.0.0"
  },
  "exposedModules": {
    "exampleNavs": "./utils/example-navs"
  }
}
```

Browser Console logs:
```bash
Dynamic plugins: [foo-plugin, bar-plugin]
Loading plugin manifest from http://localhost:9000/api/plugins/foo-plugin/plugin-manifest.json
Loading plugin manifest from http://localhost:9000/api/plugins/bar-plugin/plugin-manifest.json
Resolving dependencies for plugin foo-plugin@1.0.0
Resolving dependencies for plugin bar-plugin@2.0.0
Loading scripts of plugin bar-plugin@2.0.0  // make sure Bar is loaded first then Foo
Loading plugin script from http://localhost:9000/api/plugins/bar-plugin/plugin-entry.js?cacheBuster=x3axus
Added plugin bar-plugin@2.0.0
Loading scripts of plugin foo-plugin@1.0.0  // make sure Bar is loaded first then Foo
Loading plugin script from http://localhost:9000/api/plugins/foo-plugin/plugin-entry.js?cacheBuster=1f2w8w
Plugin bar-plugin@2.0.0 is now enabled
Added plugin foo-plugin@1.0.0
Plugin foo-plugin@1.0.0 is now enabled
```
[1-3-foo-has-optionalDependency-on-bar-bar-available screenshot](https://drive.google.com/file/d/1ea56E7pmpCB0XE0iRG4xSK4beQzysmjz/view)

#### 1-4 foo has optionalDependencies on bar, bar is available, version incorrect
[RESULT] only bar is loaded
```bash
$ ./bin/bridge -plugins foo-plugin=http://localhost:9002 -plugins bar-plugin=http://localhost:9003
```
```bash
$ cat foo-plugin/package.json | jq .consolePlugin
{
  "name": "foo-plugin",
  "version": "1.0.0",
  "disableStaticPlugins": [
    "@console/demo-plugin"
  ],
  "optionalDependencies": {
    "bar-plugin": "~5.0.0"
  },
  "exposedModules": {
    "exampleNavs": "./utils/example-navs"
  }
}
```

Browser Console logs:
```bash
Dynamic plugins: [foo-plugin, bar-plugin]
Loading plugin manifest from http://localhost:9000/api/plugins/foo-plugin/plugin-manifest.json
Loading plugin manifest from http://localhost:9000/api/plugins/bar-plugin/plugin-manifest.json
Resolving dependencies for plugin foo-plugin@1.0.0
Resolving dependencies for plugin bar-plugin@2.0.0
Loading scripts of plugin bar-plugin@2.0.0  // make sure Bar is loaded first then Foo
Loading plugin script from http://localhost:9000/api/plugins/bar-plugin/plugin-entry.js?cacheBuster=fy7o6j
Added plugin bar-plugin@2.0.0
Failed to resolve dependencies of plugin foo-plugin UnmetPluginDependenciesError: Unmet dependencies on plugins: bar-plugin: required ~5.0.0, current 2.0.0
```
[1-4-foo-has-optionalDependency-on-bar-version-incorrect screenshot](https://drive.google.com/file/d/1ygGYMmr4vh6oo2jNrahmhl-9n1jjDjGl/view)

#### 1-5 foo has optionalDependencies on bar, bar is NOT available
[RESULT] foo can be loaded successfully
```bash
$ ./bin/bridge -plugins foo-plugin=http://localhost:9002
```
```bash
$ cat foo-plugin/package.json | jq .consolePlugin
{
  "name": "foo-plugin",
  "version": "1.0.0",
  "disableStaticPlugins": [
    "@console/demo-plugin"
  ],
  "optionalDependencies": {
    "bar-plugin": "~2.0.0"
  },
  "exposedModules": {
    "exampleNavs": "./utils/example-navs"
  }
}
```

Browser Console logs:
```bash
Dynamic plugins: [foo-plugin]
Loading plugin manifest from http://localhost:9000/api/plugins/foo-plugin/plugin-manifest.json
Resolving dependencies for plugin foo-plugin@1.0.0
Loading scripts of plugin foo-plugin@1.0.0
Loading plugin script from http://localhost:9000/api/plugins/foo-plugin/plugin-entry.js?cacheBuster=0chasj
Added plugin foo-plugin@1.0.0
Plugin foo-plugin@1.0.0 is now enabled
```
[1-5-foo-has-optionalDependency-on-bar-bar-NOT-available screenshot](https://drive.google.com/file/d/128v50zA5acWvdzhqz23rwgDCbj7Helvu/view)

#### 1-6 foo has dependencies and optionalDependencies on bar
[RESULT] foo can NOT be built successfully
```bash
$ cat foo-plugin/package.json | jq .consolePlugin
{
  "name": "foo-plugin",
  "version": "1.0.0",
  "disableStaticPlugins": [
    "@console/demo-plugin"
  ],
  "dependencies": {
    "bar-plugin": "~2.0.0"
  },
  "optionalDependencies": {
    "bar-plugin": "~2.0.0"
  },
  "exposedModules": {
    "exampleNavs": "./utils/example-navs"
  }
}
```
unable to build foo-plugin successfully
```bash
$ yarn build-dev
yarn run v1.22.22
$ yarn clean && yarn ts-node node_modules/.bin/webpack
$ rm -rf dist
$ ts-node -O '{"module":"commonjs"}' node_modules/.bin/webpack
[webpack-cli] Failed to load '/Users/yapei/go/src/github.com/openshift/vojtechszocs-console/foo-plugin/webpack.config.ts' config
[webpack-cli] Error: Detected overlap between dependencies and optionalDependencies: bar-plugin
    at new ConsoleRemotePlugin (/Users/yapei/go/src/github.com/openshift/vojtechszocs-console/foo-plugin/node_modules/@openshift-console/dynamic-plugin-sdk-webpack/lib/webpack/ConsoleRemotePlugin.js:136:19)
    at Object.<anonymous> (/Users/yapei/go/src/github.com/openshift/vojtechszocs-console/foo-plugin/webpack.config.ts:49:5)
    at Module._compile (node:internal/modules/cjs/loader:1734:14)
    at Module.m._compile (/Users/yapei/go/src/github.com/openshift/vojtechszocs-console/foo-plugin/node_modules/ts-node/src/index.ts:1618:23)
    at loadTS (node:internal/modules/cjs/loader:1826:10)
    at Object.require.extensions.<computed> [as .ts] (/Users/yapei/go/src/github.com/openshift/vojtechszocs-console/foo-plugin/node_modules/ts-node/src/index.ts:1621:12)
    at Module.load (node:internal/modules/cjs/loader:1469:32)
    at Function._load (node:internal/modules/cjs/loader:1286:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
error Command failed with exit code 2.
info Visit https://yarnpkg.com/en/docs/cli/run for documentation about this command.
error Command failed with exit code 2.
info Visit https://yarnpkg.com/en/docs/cli/run for documentation about this command.
```
[1-6-build-error screenshot](https://drive.google.com/file/d/13n1HRqUwK_QriIMKDrgxo-wX_brfeQGM/view)

#### 1-7 foo, bar, console-demo-plugin all are independant
[RESULT] all loaded successfully
```bash
$ ./bin/bridge -plugins console-demo-plugin=http://localhost:9001 -plugins foo-plugin=http://localhost:9002 -plugins bar-plugin=http://localhost:9003
```
```bash
$ cat foo-plugin/package.json | jq .consolePlugin
{
  "name": "foo-plugin",
  "version": "1.0.0",
  "disableStaticPlugins": [
    "@console/demo-plugin"
  ],
  "exposedModules": {
    "exampleNavs": "./utils/example-navs"
  }
}
$ cat bar-plugin/package.json | jq .consolePlugin
{
  "name": "bar-plugin",
  "version": "2.0.0",
  "disableStaticPlugins": [
    "@console/demo-plugin"
  ],
  "exposedModules": {
    "exampleNavs": "./utils/example-navs"
  }
}
```
[1-7-foo-bar-console-demo-plugin-all-independent screenshot](https://drive.google.com/file/d/1Rk6iOcUZCGz3J6OJCwawpqX2pcLVkh_H/view)

#### 1-8 foo, bar, console-demo-plugin, foo has dependency on bar, bar has dependency on console-demo-plugin, console-demo-plugin NOT available
[RESULT] neither got loaded
```bash
$ ./bin/bridge -plugins foo-plugin=http://localhost:9002 -plugins bar-plugin=http://localhost:9003
```
```bash
$ cat foo-plugin/package.json | jq .consolePlugin
{
  "name": "foo-plugin",
  "version": "1.0.0",
  "disableStaticPlugins": [
    "@console/demo-plugin"
  ],
  "dependencies": {
    "bar-plugin": "~2.0.0"
  },
  "exposedModules": {
    "exampleNavs": "./utils/example-navs"
  }
}
$ cat bar-plugin/package.json | jq .consolePlugin
{
  "name": "bar-plugin",
  "version": "2.0.0",
  "disableStaticPlugins": [
    "@console/demo-plugin"
  ],
  "dependencies": {
    "console-demo-plugin": "~0.0.0"
  },
  "exposedModules": {
    "exampleNavs": "./utils/example-navs"
  }
}
```

Browser Console logs:
```bash
Dynamic plugins: [foo-plugin, bar-plugin]
Loading plugin manifest from http://localhost:9000/api/plugins/foo-plugin/plugin-manifest.json
Loading plugin manifest from http://localhost:9000/api/plugins/bar-plugin/plugin-manifest.json
Resolving dependencies for plugin foo-plugin@1.0.0
Resolving dependencies for plugin bar-plugin@2.0.0
Failed to resolve dependencies of plugin bar-plugin Error: Required plugins are not available: console-demo-plugin
Failed to resolve dependencies of plugin foo-plugin Error: Dependent plugins failed to load: bar-plugin
```
[1-8-foo-bar-console-demo-plugin-dependency-chain screenshot](https://drive.google.com/file/d/1lZVNzXsZ0V84aONZOudws3qjOdmDrdSw/view)

#### 1-9 foo, bar, console-demo-plugin, foo has optionalDependencies on bar, bar has dependency on console-demo-plugin, console-demo-plugin NOT available
[RESULT] neither got loaded
```bash
$ ./bin/bridge -plugins foo-plugin=http://localhost:9002 -plugins bar-plugin=http://localhost:9003
```
```bash
$ cat foo-plugin/package.json | jq .consolePlugin
{
  "name": "foo-plugin",
  "version": "1.0.0",
  "disableStaticPlugins": [
    "@console/demo-plugin"
  ],
  "optionalDependencies": {
    "bar-plugin": "~2.0.0"
  },
  "exposedModules": {
    "exampleNavs": "./utils/example-navs"
  }
}
$ cat bar-plugin/package.json | jq .consolePlugin
{
  "name": "bar-plugin",
  "version": "2.0.0",
  "disableStaticPlugins": [
    "@console/demo-plugin"
  ],
  "dependencies": {
    "console-demo-plugin": "~0.0.0"
  },
  "exposedModules": {
    "exampleNavs": "./utils/example-navs"
  }
}
```

Browser Console logs:
```bash
Dynamic plugins: [foo-plugin, bar-plugin]
Loading plugin manifest from http://localhost:9000/api/plugins/foo-plugin/plugin-manifest.json
Loading plugin manifest from http://localhost:9000/api/plugins/bar-plugin/plugin-manifest.json
Resolving dependencies for plugin foo-plugin@1.0.0
Resolving dependencies for plugin bar-plugin@2.0.0
Failed to resolve dependencies of plugin bar-plugin Error: Required plugins are not available: console-demo-plugin
Failed to resolve dependencies of plugin foo-plugin Error: Dependent plugins failed to load: bar-plugin
```
[1-9-foo-bar-console-demo-plugin-optional-dependency screenshot](https://drive.google.com/file/d/1yA1r7eltpM9UhCDM5_-FPrJQSJbtUqAV/view)

### My questions
- What determines the dependency resolving order? 3 plugins(all are independant), enabled order not changed, but browser console logs show different order when resovling
  - Answer: plugin resolving/loading is simulataneously (asynchronously) in the background, so every time the order may be different
- When plugin dependencies and optionalDependencies on one plugin, is dependencies taking higher priority
  - Answer: dependencies and optionalDependencies keys must be mutually exclusive
- foo and bar plugin adds additional nav section, why didn't they appear in UI?
  - Answer: because there is no secondary menu, if we add secondary menu, the nav section will show up
- in local testing, "plugin not available" means we didn't pass it in bridge command, that is it will not be present in SERVER_FLAGS.consolePlugins
- [for all test cases] if Foo has a dependency on Bar and Bar is available, load order must be Bar first and Foo second
