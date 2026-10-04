Feature: Member signs in on the website
  As a club member
  I can sign in on the website with the same account as the iPhone app
  So that I see my own account without CRM admin access

  The website uses the member email and password already stored on the club
  member record. John Alan O'Sullivan remains the only admin. A member session
  does not show CRM management.

  Background:
    Given the club knows member "aoife.murphy@example.com"
    And the club knows member "liam.byrne@example.com"
    And the only admin is "John Alan O'Sullivan"

  Scenario: Known member with valid details sees their own account
    When "aoife.murphy@example.com" signs in on the website with password "green-card-fixture"
    Then they are signed in on the website
    And they see their own account "Aoife Murphy"
    And they see their own email "aoife.murphy@example.com"
    And they see their own green card "GC-1001"
    And they do not see "Liam Byrne"
    And they are not an admin
    And the member session does not show CRM management

  Scenario: Wrong password stays signed out
    When "aoife.murphy@example.com" signs in on the website with password "wrong-password"
    Then they stay signed out
    And they do not see an account

  Scenario: Unknown email stays signed out
    When "stranger@example.com" signs in on the website with password "green-card-fixture"
    Then they stay signed out
    And they do not see an account

  Scenario: The admin account is not a member session
    When "admin@stpatrickshk.com" signs in on the website with password "changeme"
    Then they stay signed out
    And they do not see an account
    And John is the only admin

  Scenario: A member session does not open the CRM
    When "aoife.murphy@example.com" signs in on the website with password "green-card-fixture"
    Then they are signed in on the website
    And they open the members screen
    And the members screen stays closed
    And the member session does not show CRM management
