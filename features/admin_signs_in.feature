Feature: Admin signs in to the CRM website
  As the admin account holder
  I can sign in to a privileged area of the website
  So that I can manage the CRM

  John Alan O'Sullivan is the only admin.
  A member login is rejected from this area.
  Members do not see CRM management unless they are the admin.

  Background:
    Given the only admin is "John Alan O'Sullivan"
    And the club knows member "aoife.murphy@example.com"
    And the club knows member "liam.byrne@example.com"

  Scenario: Admin signs in and sees CRM management
    When "admin@stpatrickshk.com" signs in to the CRM with password "changeme"
    Then they are signed in as the admin
    And they see "John Alan O'Sullivan"
    And they see CRM management

  Scenario: Member login is rejected from the CRM
    When "aoife.murphy@example.com" signs in to the CRM with password "green-card-fixture"
    Then they stay signed out
    And they do not see CRM management

  Scenario: Wrong password stays signed out
    When "admin@stpatrickshk.com" signs in to the CRM with password "wrong-password"
    Then they stay signed out
    And they do not see CRM management

  Scenario: Member password does not open the admin account
    When "admin@stpatrickshk.com" signs in to the CRM with password "green-card-fixture"
    Then they stay signed out
    And they do not see CRM management

  Scenario: A member is not the admin
    When "liam.byrne@example.com" signs in to the CRM with password "changeme"
    Then they stay signed out
    And John is the only admin
    And they do not see CRM management
