@pipelines
Feature: Create the pipeline from builder page
              As a user, I want to create the pipeline with different set of series & parallel tasks

        Background:
            Given user has created or selected namespace "aut-pipe-builder"


        @smoke
        Scenario: user navigates to pipelines page from Add page on selecting Pipeline card  : A-02-TC01
             When user selects "Pipeline" card from add page
             Then user redirects to Pipelines page


        @regression
        Scenario: Pipeline Builder page : P-03-TC02
            Given user is at pipelines page
             When user clicks Create Pipeline button on Pipelines page
             Then user will be redirected to Pipeline Builder page
              And user is able to see pipeline name with default value "new-pipeline"
              And Tasks, Parameters, Resources and Workspaces sections are displayed
              And Yaml view configuration is displayed
              And Create button is in disabled state


        @regression
        Scenario Outline: Create a pipeline with series tasks : P-07-TC03
            Given user is at Pipeline Builder page
             When user enters pipeline name as "<pipeline_name>"
              And user selects "<task_name>" from Task drop down
              And user adds another task "<task_name_1>" in series
              And user clicks Create button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "<pipeline_name>"

        Examples:
                  | pipeline_name | task_name | task_name_1      |
                  | p-one         | kn        | openshift-client |


        @regression
        Scenario Outline: Create a pipeline with parallel tasks : P-07-TC02
            Given user is at Pipeline Builder page
             When user enters pipeline name as "<pipeline_name>"
              And user selects "<task_name>" from Task drop down
              And user adds another task "<task_name_1>" in parallel
              And user clicks Create button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "<pipeline_name>"

        Examples:
                  | pipeline_name | task_name | task_name_1      |
                  | p-two         | kn        | openshift-client |


        @smoke
        Scenario Outline: Create a basic pipeline from pipeline builder page : P-03-TC08
            Given user is at Pipeline Builder page
             When user enters pipeline name as "<pipeline_name>"
              And user selects "<task_name>" from Task drop down
              And user clicks Create button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "<pipeline_name>"

        Examples:
                  | pipeline_name | task_name |
                  | p-three-1     | kn        |


        Scenario Outline: Create pipeline with "<resource_type>" as resource type from pipeline builder page : "<tc_no>"
            Given user is at Pipeline Builder page
             When user enters pipeline name as "<pipeline_name>"
              And user selects "<task_name>" from Task drop down
              And user adds "<resource_type>" resource with name "<resource_name>" to the "<task_name>"
              And user clicks Create button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "<pipeline_name>"

        Examples:
                  | pipeline_name | task_name        | resource_type | resource_name | tc_no     |
                  | p-git         | openshift-client | Git           | git repo      | P-03-TC11 |
                  | p-img         | task-image       | Image         | image repo    | P-03-TC05 |
                  | p-storage     | task-storage     | Storage       | storage repo  | P-03-TC06 |
                  | p-cluster     | task-cluster     | Cluster       | cluster repo  | P-03-TC07 |


        @regression
        Scenario: Add Parameters to the pipeline in pipeline builder page : P-03-TC04
            Given user is at Pipeline Builder page
             When user enters pipeline name as "pipeline-params"
              And user selects "s2i-nodejs" from Task drop down
              And user adds the parameter details like Name, Description and Default Value
              And user adds the image name to the pipeline task "s2i-nodejs"
              And user clicks Create button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "pipeline-params"


        @regression, @manual
        Scenario: Create the pipeline from yaml editor : P-07-TC01
            Given user is at Pipeline Builder page
             When user selects YAML view
              And user clicks Create button on Pipeline Yaml page
             Then user will be redirected to Pipeline Details page with header name "new-pipeline"


        @regression
        Scenario: Create pipeline with Workspaces
            Given user is at Pipeline Builder page
             When user enters pipeline name as "pipeline-workspace"
              And user selects "git-clone" from Task drop down
              And user selects the "git-clone" node
              And user adds the git url in the url Parameter in cluster task sidebar
              And user clicks on Add workspace
              And user adds the Workspace name as "git"
              And user selects the "git-clone" node
              And user selects the "git" workspace in the Output of Workspaces in cluster task sidebar
              And user clicks Create button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "pipeline-workspace"
              And user will see workspace mentioned as "git" in the Workspaces section of Pipeline Details page


        @regression
        Scenario: Create pipeline with optional Workspaces
            Given user is at Pipeline Builder page
             When user enters pipeline name as "pipeline-workspace"
              And user selects "git-clone" from Task drop down
              And user selects the "git-clone" node
              And user adds the git url in the url Parameter in cluster task sidebar
              And user clicks on Add workspace
              And user adds the Workspace name as "git-opt"
              And user clicks on Optional Workspace checkbox
              And user selects the "git-clone" node
              And user selects the "git" workspace in the Output of Workspaces in cluster task sidebar
              And user clicks Create button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "pipeline-workspace"
              And user will see workspace mentioned as "git-opt (optional)" in the Workspaces section of Pipeline Details page
