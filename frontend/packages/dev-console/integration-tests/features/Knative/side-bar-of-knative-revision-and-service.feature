Feature: side bar details
    As a user, I want to see the details of the revision and service in side bar

    Background:
        Given user has installed OpenShift Serverless Operator
        And user is at developer perspective
        And user has selected namespace "aut-knative-side-pane-details"


    @regression
    Scenario: side bar display for knative service : Kn-06-TC01
        Given user has created knative service "nodejs-ex-git"
        When user clicks on the knative service "nodejs-ex-git"
        Then side bar is displayed with heading name same as knative service name "nodejs-ex-git"


    @smoke
    Scenario: side bar details of knative Service : Kn-06-TC02
        Given user has created knative service "nodejs-ex-git"
        When user clicks on the knative service "nodejs-ex-git"
        Then side bar is displayed with heading name as "nodejs-ex-git"
        And Name, Namespace, Labels, Annotations, Created at, Owner fields displayed  in topology details
    # And Name display as "nodejs-ex-git-1" in topology details
    # And Namespace display as "aut-knative-side-pane-details" in topology details
    # And Labels section contain n number of Labels in topology details
    # And Annotations section contain "{number of annotations} Annotations" in topology details
    # And "Created on" field display the date in format "{month date, hour:minutes am/pm}" in topology details
    # And owner field displayed in topology details


    @smoke
    Scenario: side bar details of for knative Revision : Kn-05-TC01, Kn-05-TC02
        Given user has created knative service "nodejs-ex-git"
        When user clicks on the revision of knative service "nodejs-ex-git"
        Then side bar is displayed with heading name as "nodejs-ex-git"
        And Name, Namespace, Labels, Annotations, Created at, Owner fields displayed  in topology details


    Scenario: Resoruce details of knative revision in side bar : Kn-05-TC03
        Given user has created knative service "nodejs-ex-git"
        When user clicks on Resoruces section


    Scenario: links in side bar : Kn-05-TC04
        Given user has created knative service "nodejs-ex-git"
        When user clicks on the revision of knative service "nodejs-ex-git"


    @regression
    Scenario: Actions menu of knative revision in side bar: Kn-05-TC05
        Given user has created knative service "nodejs-ex-git"
        When user clicks on the revision of knative service "nodejs-ex-git"
        And user clicks on Actions dropdown in top right corner of side bar
        Then user able to see the options Edit Labels, Edit Annotations, Edit Revision, Delete Revision


    Scenario: Resoruce details of knative service in side bar : Kn-06-TC03
        Given user has created knative service "nodejs-ex-git"
        When user clicks on the knative service "nodejs-ex-git"
        And user clicks on Resoruces section


    Scenario: links in side bar : Kn-06-TC04
        Given user has created knative service "nodejs-ex-git"
        When user clicks on the revision of knative service "nodejs-ex-git"


    @regression
    Scenario: Actions menu of knative service in side bar: Kn-06-TC05
        Given user has created knative service "nodejs-ex-git"
        When user clicks on the knative service "nodejs-ex-git"
        And user clicks on Actions dropdown in top right corner of side bar
        Then user able to see the options like Edit Application Grouping, Set Traffic Distribution, Edit NameOfWorkLoad, Edit Health Checks, Edit Labels, Edit Annotations, Edit Service, Delete Service
