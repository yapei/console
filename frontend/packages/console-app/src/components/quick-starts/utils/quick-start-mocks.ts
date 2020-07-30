import { QuickStart } from './quick-start-types';

export const mockQuickStarts: QuickStart[] = [
  {
    version: 4.7,
    id: 'serverless-explore',
    name: `Explore Serverless`,
    duration: 10,
    iconURL:
      '/api/kubernetes/apis/packages.operators.coreos.com/v1/namespaces/openshift-marketplace/packagemanifests/3scale-community-operator/icon?resourceVersion=3scale-community-operator.threescale-2.8.3scale-community-operator.v0.5.1',
    description: `Install the Serverless Operator to enable containers, microservices and functions to run "serverless"`,
    prerequisites: `Release requirements if any Install X number of resources`,
    introduction: `The Red Hat® OpenShift® Serverless provides an enterprise-grade serverless platform. Based on the open source Knative project, it provides a solution for efficient application development supporting dynamic scale and providing a reliable and secure event-driven mechanism to connect on-cluster and off-cluster event producers, bringing portability and consistency across hybrid and multi-cloud environments.
        Run anywhereUse Kubernetes and OpenShift to build, scale, and manage serverless applications in any cloud, on-premise, or hybrid environment.
        Integrate with legacyBuild modern, serverless applications and support legacy apps by using event sources. Manage all of your applications in one place: Red Hat OpenShift.
        Focus on businessKnative allows app teams to focus on building products. Knative installs on OpenShift using Operators, simplifying installation and automating updates and management.
        Operations friendlyKnative uses Kubernetes to achieve greater consistency and more granular scalability across applications and teams.`,
    tasks: [
      {
        title: `Install Serverless Operator`,
        description:
          '### To install the Serverless Operator:\n  1. Go to the OperatorHub from the Operators section of the navigation.\n  2. Use the filter at the top of the page to search for the OpenShift Serverless Operator.\n  3. Click on the tile to open the Operator details.\n 4. At the top of the side panel, click Install.\n 5. Fill out the Operator Subscription form and click Install. You can leave all of the prefilled options if you&#39;d like.\n  6. After a few minutes, the OpenShift Serverless Operator should appear in your Installed Operators list.\n   1. Wait for the Operator to completely install. When prompted, click View Operator to view the OpenShift Serverless Operator details.\n  7. Click it to see its details.',
        review: {
          instructions: `To verify that the Serverless Operator was successfully installed:
            1. Go to the Installed Operators page from the Operators section of the navigation.
            2. Find OpenShift Serverless Operator in the list.
            3. Find the Status column and check the status of the OpenShift Serverless Operator.

            Is the status Succeeded?`,
          taskHelp: `Try walking through the steps again to properly install Serverless Operator`,
        },
        recapitulation: {
          success: `You've just installed the Serverless Operator! Next, we'll install the required CR's for this Operator to run.`,
          failed: 'Check your work to make sure that ',
        },
      },
      {
        title: `Create knative-serving API`,
        description: `The first CR you create is Knative Serving.
            Knative-serving offers a request-driven model that serves containerized workloads. These workloads auto-scale based on demand and can scale to zero.
            To create the knative-serving API:
            1. Open the project dropdown in the secondary masthead and click Create Project.
            2. In the Name field, type &quot;knative-serving&quot;.
            3. Click Create.
            4. Make sure you&#39;re still on the Installed Operators page.
            5. Click OpenShift Serverless Operator.
            6. Click on the Knative Serving tile to create an instance of the API.
            7. Click Create.`,

        review: {
          instructions: `To verify that the knative-serving API was installed successfully:
            1. Make sure that you are on the Knative Serving tab of the OpenShift Serverless Operator.

            Is there a knative-serving resource in the list?`,
          taskHelp: `Try walking through the steps again to properly create an instance of knative-eventing`,
        },
        recapitulation: {
          success: `You've just created an instance of knative-serving! Next, we'll create an instance of knative-eventing`,
          failed:
            'Check your work to make sure that the instance of knative-eventing is properly created',
        },
      },
      {
        title: `create knative-eventing API`,
        description: `The second CR you create is Knative Eventing.
            Knative Eventing creates a common infrastructure for consuming and producing events. Serverless uses this infrastructure to do… something. infraststractuire to stimulate applications.
            To create the knative-eventing API:
            1. Open the project dropdown in the secondary masthead and click Create Project.
            2. In the Name field, type &quot;knative-eventing&quot;.
            3. Click Create.
            4. Make sure you&#39;re still on the Installed Operators page.
            5. Click OpenShift Serverless Operator.
            6. Click on the Knative Eventing tile to create an instance of the API.
            7. Click Create.`,
        review: {
          instructions: `To verify that the knative-eventing API was installed successfully:

            1. Make sure that you are on the Knative Eventing tab of the OpenShift Serverless Operator.

            Is there a knative-eventing resource in the list?`,
          taskHelp: `Try walking through the steps again to properly create knative-eventing resource`,
        },

        recapitulation: {
          success: `You've just created a knative-eventing! resource`,
          failed: `Check your work to make sure that the knative-eventing resource is properly created`,
        },
      },
    ],
    conclusion: `Your Serverless Operator is ready! If you want to learn how to deploy a serverless application, take the Serverless Application tour.`,
    nextQuickStart: `serverless-application`,
  },
  {
    iconURL:
      '/api/kubernetes/apis/packages.operators.coreos.com/v1/namespaces/openshift-marketplace/packagemanifests/serverless-operator/icon?resourceVersion=serverless-operator.4.3.serverless-operator.v1.7.1',
    altIcon: 'KNative',
    id: 'serverless-applications',
    name: 'Serverless Aplications',
    duration: 10,
    description: 'Learn how to create a serverless application',
    prerequisites: 'Complete "Explore Serverless" tour',
    introduction: `The Red Hat® OpenShift® Serverless provides an enterprise-grade serverless platform. Based on the open source Knative project, it provides a solution for efficient application development supporting dynamic scale and providing a reliable and secure event-driven mechanism to connect on-cluster and off-cluster event producers, bringing portability and consistency across hybrid and multi-cloud environments.
    Run anywhereUse Kubernetes and OpenShift to build, scale, and manage serverless applications in any cloud, on-premise, or hybrid environment.
    Integrate with legacyBuild modern, serverless applications and support legacy apps by using event sources. Manage all of your applications in one place: Red Hat OpenShift.
    Focus on businessKnative allows app teams to focus on building products. Knative installs on OpenShift using Operators, simplifying installation and automating updates and management.
    Operations friendlyKnative uses Kubernetes to achieve greater consistency and more granular scalability across applications and teams.`,
    tasks: [
      {
        title: `Create Serverless Application`,
        description: `#### To create the Serverless Application:

        1. Go to the Import from Git flow.

        1. Choose Serverless as option while creating the application.
        `,

        review: {
          instructions: `To verify that the Serverless Operator was successfully installed:
            1. Go to the Topology.
            2. Check for an application with Knative icon.

            Is the status Succeeded?`,
          taskHelp: `Try walking through the steps again to properly create the Serverless Application`,
        },

        recapitulation: {
          success: `You've just create the Serverless Application!`,
          failed: `Check your work to make sure that the Serverless application is properly created`,
        },
      },
      {
        title: `Create knative-serving API`,
        description: `#### The first Application you create is Knative Nodejs.
        Some description and steps for application -

        1. Some step 1.

        1. Some step 2.`,

        review: {
          instructions: `To verify that the knative nodejs application was installed successfully:
            1. Some step to review serverless application.

            Is there a knative nodejs resource in the list?`,
          taskHelp: `Try walking through the steps again to properly create the instance of knative-serving`,
        },
        recapitulation: {
          success: `You've just created an instance of knative nodejs!`,
          failed: `Check your work to make sure that the instance of knative nodejs is properly created`,
        },
      },
    ],
    conclusion: `Your Serverless Application is ready! If you want to learn how to deploy a openshift pipeline, take the Pipeline Builds tour.`,
    nextQuickStart: 'pipelines-build',
  },
  {
    iconURL:
      '/api/kubernetes/apis/packages.operators.coreos.com/v1/namespaces/openshift-marketplace/packagemanifests/serverless-operator/icon?resourceVersion=serverless-operator.4.3.serverless-operator.v1.7.1',
    altIcon: 'TKN',
    id: 'pipelines-build',
    name: 'Build Pipelines',
    duration: 15,
    description: 'Release requirement if any installs x number of resources',
    prerequisites: 'Installs x number of resources',
    introduction: `OpenShift Pipelines is a cloud-native, continuous integration and continuous delivery (CI/CD) solution based on Kubernetes resources. It uses Tekton building blocks to automate deployments across multiple platforms by abstracting away the underlying implementation details. Tekton introduces a number of standard Custom Resource Definitions (CRDs) for defining CI/CD pipelines that are portable across Kubernetes distributions.`,
    tasks: [
      {
        title: `Create Openshift Pipeline`,
        description: `To create the openshift pipeline build:
            1. Go to the Import from Git flow.
            2. Choose Pipelines as option while creating the application.
            `,

        review: {
          instructions: `To verify that the pipeline was successfully created:
            1. Go to the Pipelines.
            2. Check for an pipeline in the list.

            Is the status Succeeded?`,
          taskHelp: `Try walking through the steps again to properly create the pipeline`,
        },
        recapitulation: {
          success: `You've just create the pipeline!`,
          failed: `Check your work to make sure that the pipeline is properly created`,
        },
      },
    ],
    conclusion: `Your Pipeline build is ready!`,
  },
];
