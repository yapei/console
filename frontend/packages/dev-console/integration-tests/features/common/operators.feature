Feature: Operators
              As a user I want to install or uninstall the operators

        Background:
            Given user is at administrator perspective


        @regression
        Scenario: OpenShift Pipeline operator subscription page : P-01-TC01
            Given user is at Operator Hub page with the header name "OperatorHub"
             When user searches for "OpenShift Pipelines Operator"
              And user clicks OpenShift Pipelines Operator card on Operator Hub page
              And user clicks install button present on the right side bar
             Then OpenShift Pipeline operator subscription page will be displayed


        @smoke
        Scenario: Install the Pipeline Operator from Operator Hub page : P-01-TC02
            Given user executed command "oc apply -f https://gist.githubusercontent.com/nikhil-thomas/f6069b00b0e3b0359ae1cbdb929a04d6/raw/7b19be0c52355d041bf3d6a883db06b578f15f0d/openshift-pipelines-early-release-catalog-source.yaml"
              And user is at OpenShift Pipeline Operator subscription page
             When user installs the pipeline operator with default values
             Then user will see a modal with title "OpenShift Pipelines Operator"
              And user will see a View Operator button


        @smoke
        Scenario: Install the Serverless Operator from Operator Hub page : Kn-01-TC01, Kn-01-TC02
            Given user is at OpenShift Serverless Operator subscription page
             When user installs the OpenShift Serverless operator with default values
             Then user will see a modal with title "OpenShift Serverless Operator"
              And user will see a View Operator button
              And user will see serverless option on left side navigation menu


        @smoke
        Scenario: Install the knative eventing operator : Kn-07-TC01, Kn-07-TC02
            Given user has installed OpenShift Serverless Operator
              And user is on the knative-eventing namespace
             When user navigates to installed operators page in Admin perspective
              And user clicks knative eventing provided api pressent in knative serverless operator
              And user clicks Create knative Eventing button present in knative Eventing tab
              And user clicks create button
             Then Event sources card display in Add page in dev perspective


        @smoke
        Scenario: Install the knative apache camel operator : Kn-08-TC01
            Given user has installed OpenShift Serverless and eventing operator
              And user is at Operator Hub page with the header name "OperatorHub"
             When user search and installs the knative Camel operator with default values
             Then user will see a modal with title "knative Apache Camel Operator"
              And user will see a View Operator button


        @smoke
        Scenario: Install the dynamic event operator : Kn-09-TC01, Kn-09-TC02
            Given user has installed OpenShift Serverless Operator
             When user executes commands from cli as "kubectl apply -f https://github.com/knative/eventing-contrib/releases/download/v0.14.1/github.yaml"
              And user navigates to Add page
              And user clicks on "Event source" card
             Then user will be redirected to Event Sources page
              And GitHub Source is displayed in types section


        @smoke
        Scenario: Install the Che Operator from Operator Hub page : CRW-01-TC01
            Given user is at Eclipse che Operator subscription page
             When user installs the Eclipse che operator with default values
             Then user will see a modal with title "Eclipse Che"
              And user will see a View Operator button


        @smoke
        Scenario: Install OpenShift Virtualization Operator: VM-01-TC01
            Given user is at Operator Hub page with the header name "OperatorHub"
              And user has selected namespace "openshift-cnv"
             When user searches for "OpenShift Virtualization"
              And user clicks on the OpenShift Virtualization Operator card
              And user clicks install button present on the right side bar
              And user installs the OpenShift Virtualization operator with default values
             Then user will see a modal with title "OpenShift Virtualization"
              And user will see a View Operator button


        @smoke
        Scenario: Create OpenShift Virtualization Deployment
            Given user has installed OpenShift Virtualization Operator
              And user is at Installed Operator page
             When user clicks on OpenShift Virtualization Operator
              And user clicks on OpenShift Virtualization Deployment tab
              And user clicks on the Create HyperConverged button
              And user clicks on Create button
             Then user will see a HyperConverged type created


        @smoke
        Scenario: Create HostPathProvisioner Deployment
            Given user has installed OpenShift Virtualization Operator
              And user is at Installed Operator page
             When user clicks on OpenShift Virtualization Operator
              And user clicks on HostPathProvisioner Deployment tab
              And user clicks on the Create HostPathProvisioner button
              And user clicks on Create button
             Then user will see a HostPathProvisioner type created
              And user will see Virtualization item under Workloads


        @regression @smoke
        Scenario: Quay container security operator
            Given user is at Operator Hub page with the header name "OperatorHub"
             When user searches for "quay container security"
              And user clicks on quay container security operator card on Operator Hub page
              And user clicks install button present on the right sidebar
              And user installs the quay container security operator with default values
             Then user will see a quay container security installing modal
              And user will see a View Operator button


        Scenario: Uninstall the knative serverless operator from Operator Hub page
            Given user is at OpenShift Serverless Operator subscription page


        @smoke
        Scenario: Install Web Terminal operator from Operator Hub page
            Given user is at Operator Hub page with the header name "OperatorHub"
             When user searches for "Web Terminal"
              And user clicks on the Web Terminal Operator card
              And user clicks install button present on the right side bar
              And user installs the Web Terminal operator with default values
             Then user will see a modal with title "Web Terminal"
              And user will see a View Operator button


        @smoke
        Scenario: Install Red Hat Integration - Camel K Operator
            Given user has installed OpenShift Serverless Operator
              And user is at Operator Hub page with the header name "OperatorHub"
             When user searches and installs the Red Hat Integration - Camel K Operator with default values
             Then user will see a modal with title "Red Hat Integration - Camel K"
              And user will see a View Operator button


        @smoke
        Scenario: Create Integration Platform CR
            Given user has installed OpenShift Serverless Operator
              And user has installed Red Hat Integration - Camel K Operator
              And user has selected "aut-test-kamelets" namespace
              And user is on Installed Operator page
             When user clicks on Integration Platform link
              And user clicks on Create IntegrationPlatform button
              And user clicks on Create button
             Then user will be redirected to Integration Platform tab with header "IntegrationPlatforms"
              And user will see Integration Platform created with name example


        @smoke
        Scenario: Install Sealed Secrets Operator
            Given user has created namespace "cicd"
              And user is at Operator Hub page with the header name "OperatorHub"
             When user searches for "Sealed Secrets Operator"
              And user clicks on the Sealed Secrets Operator card
              And user clicks install button present on the right side bar
              And user installs the Sealed Secrets Operator with default values
             Then user will see a modal with title "Sealed Secrets Operator"
              And user will see a View Operator button

   
        @smoke
        Scenario: Create SealedSecretController CR
            Given user has installed Sealed Secrets Operator
              And user has selected "cicd" namespace
              And user is on Installed Operator page
             When user clicks on SealedSecretController link
              And user clicks on Create SealedSecretController button
              And user enters name "sealedsecretcontroller"
              And user clicks on Create button
             Then user will be redirected to Sealed Secrets Controller tab with header "SealedSecretControllers"
              And user will see sealedsecretcontroller created with name sealedsecretcontroller

   
        @smoke
        Scenario: Install Argo CD Operator
            Given user has created namespace "argocd"
              And user is at Operator Hub page with the header name "OperatorHub"
             When user searches for "Argo CD"
              And user clicks on the Argo CD card
              And user clicks install button present on the right side bar
              And user installs the Argo CD Operator with default values
             Then user will see a modal with title "Argo CD Operator"
              And user will see a View Operator button


        #Run RHOAS-catalog-source.yaml from dev-console/integration-tests/testData/yamls/operator-installation folder to get redhat version of RHOAS operator
        @smoke
        Scenario: RHOAS operator
            Given user is at Operator Hub page
             When user searches for "RHOAS"
              And user clicks on RHOAS operator card on Operator Hub page
              And user clicks install button present on the right sidebar
              And user installs the RHOAS operator with default values
             Then user will see a RHOAS installing modal
              And user will see a View Operator button


        @smoke
        Scenario: Red Hat Integration - AMQ Streams operator
            Given user is at Operator Hub page
             When user searches for "Red Hat Integration - AMQ Streams"
              And user clicks on Red Hat Integration - AMQ Streams operator card on Operator Hub page
              And user clicks install button present on the right sidebar
              And user installs the Red Hat Integration - AMQ Streams operator with default values
             Then user will see a Red Hat Integration - AMQ Streams installing modal
              And user will see a View Operator button
