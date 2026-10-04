Feature: Admin views and updates member records
  As the admin
  I can see club members and update their records from the website
  So that the club records stay current

  John Alan O'Sullivan is the only admin.
  Members cannot open this screen.
  A member session must not see CRM management.

  Background:
    Given the only admin is "John Alan O'Sullivan"
    And the club knows member "aoife.murphy@example.com"
    And the club knows member "liam.byrne@example.com"
    And the admin is signed in to the CRM

  Scenario: Admin sees club members
    When they open the members screen
    Then they see member "Aoife Murphy"
    And they see email "aoife.murphy@example.com"
    And they see phone "+852 5550 1001"
    And they see company "Independent"
    And they see status "active"
    And they see green card "GC-1001"
    And they see member "Liam Byrne"
    And they see email "liam.byrne@example.com"
    And they see green card "GC-1002"
    And they do not see a member "John Alan O'Sullivan"

  Scenario: Admin updates a member record
    When they update member "aoife.murphy@example.com"
    And they set the phone to "+852 5550 1999"
    And they set the company to "Harbour Office"
    And they set the status to "lapsed"
    And they set the green card to "GC-1001A"
    And they save the member record
    Then the change is saved
    And member "aoife.murphy@example.com" has phone "+852 5550 1999"
    And member "aoife.murphy@example.com" has company "Harbour Office"
    And member "aoife.murphy@example.com" has status "lapsed"
    And member "aoife.murphy@example.com" has green card "GC-1001A"
    And member "aoife.murphy@example.com" has email "aoife.murphy@example.com"
    And member "liam.byrne@example.com" has no phone
    And member "liam.byrne@example.com" has green card "GC-1002"

  Scenario: Admin changes a member's name and email
    When they update member "liam.byrne@example.com"
    And they set the first name to "William"
    And they set the last name to "Byrne"
    And they set the email to "william.byrne@example.com"
    And they save the member record
    Then the change is saved
    And they see member "William Byrne"
    And member "william.byrne@example.com" has email "william.byrne@example.com"
    And member "liam.byrne@example.com" is no longer listed
    And member "aoife.murphy@example.com" has email "aoife.murphy@example.com"

  Scenario: Member cannot open the members screen
    Given a member session for "aoife.murphy@example.com"
    When they open the members screen
    Then the members screen stays closed
    And they do not see member "Liam Byrne"
    And the member session does not show CRM management

  Scenario: Member cannot update a club record
    Given a member session for "aoife.murphy@example.com"
    When they update member "liam.byrne@example.com"
    And they set the phone to "+852 5550 2002"
    And they save the member record
    Then the change is denied
    And member "liam.byrne@example.com" has no phone
    And member "aoife.murphy@example.com" has phone "+852 5550 1001"
    And the member session does not show CRM management
