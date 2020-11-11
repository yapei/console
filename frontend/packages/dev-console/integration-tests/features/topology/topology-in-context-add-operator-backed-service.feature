Feature: Add in context from the Developer Catalog
    As a user, I want to add operator backed service in the context in topology


    Background:
        Given user is at developer perspective
        And user has installed OpenShift Serverless Operator
        And user has installed Red Hat OpenShift Jaeger Operator
        And user has installed Service Binding Operator
        And user has installed PostgreSQL Operator provided by Red Hat
        And user has created namespace "aut-topology-operator-backed"
        And user is at topology page


    @regression, @manual
    Scenario: Create Operator Backed serivce using visual connector from existing workload
        Given user has created a workload named "hello-openshift"
        When user drags connector from "hello-openshift" workload
        And user drops visual connector on empty graph
        And user clicks on Operator Backed option
        And user searches for Jaeger
        And user clicks on the Jaeger card
        And user clicks on Create button on side bar
        And user clicks on Create button on Create Jaeger page
        Then user will see visual connection between "hello-openshift" and Jaeger operator backed service


    @regression, @manual
    Scenario: Create Operator Backed serivce using visual connector from existing knative service
        Given user has created knative service "knative demo"
        When user drags connector from "knative-demo" workload
        And user drops visual connector on empty graph
        And user clicks on Operator Backed option
        And user searches for Jaeger
        And user clicks on the Jaeger card
        And user clicks on Create button on side bar
        And user clicks on Create button on Create Jaeger page
        Then user will see visual connection between "knative-demo" and Jaeger operator backed service


    @regression, @manual
    Scenario: Create Operator Backed serivce using binding connector from workload
        Given user has created "nodejs-app" workload
        When user drags connector from "nodejs-app" workload
        And user drops visual connector on empty graph
        And user clicks on Operator Backed option
        And user searches for PostgreSQL
        And user clicks on the PostgreSQL provided by Red Hat card
        And user clicks on Create button on side bar
        And user clicks on Create button on Create Database page
        Then user will see binding connection between "nodejs-app" and PostgreSQL operator backed service
