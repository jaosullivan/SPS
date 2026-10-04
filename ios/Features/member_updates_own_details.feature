Feature: Member updates their details on iPhone
  As a signed-in member
  I can view and update my own details
  So that the club has current information

  The member can change their own phone and contact details.
  They cannot edit another member.
  John is the only admin. A member session never shows CRM admin tools.

  Background:
    Given the club knows member "aoife.murphy@example.com"
    And the club knows member "liam.byrne@example.com"
    And the only admin is "John Alan O'Sullivan"
    And "aoife.murphy@example.com" signs in with password "green-card-fixture"

  Scenario: Signed-in member sees their own phone and contact details
    Then they see their own account "Aoife Murphy"
    And they see their own email "aoife.murphy@example.com"
    And they see their own phone "+852 5550 1001"
    And they see their own company "Independent"
    And they see their own green card "GC-1001"
    And they do not see "Liam Byrne"
    And they are not an admin
    And the member session does not show CRM admin tools

  Scenario: Signed-in member changes their own phone
    When they change their own phone to "+852 5550 1999"
    Then the change is saved
    And their phone is "+852 5550 1999"
    And they see their own account "Aoife Murphy"
    And member "liam.byrne@example.com" has no phone
    And the member session does not show CRM admin tools

  Scenario: Signed-in member changes their own contact details
    When they change their own email to "aoife@harbour.example"
    And they change their own company to "Harbour Office"
    Then the change is saved
    And their email is "aoife@harbour.example"
    And their company is "Harbour Office"
    And their phone is still "+852 5550 1001"
    And their name is still "Aoife Murphy"
    And their green card is still "GC-1001"
    And they are not an admin
    And John is the only admin

  Scenario: Member cannot edit another member
    When they try to change the phone of "liam.byrne@example.com" to "+852 5550 2002"
    Then the change is denied
    And member "liam.byrne@example.com" has no phone
    And their phone is still "+852 5550 1001"
    And they are not an admin
    And John is the only admin
    And the member session does not show CRM admin tools
