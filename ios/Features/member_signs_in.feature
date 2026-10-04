Feature: Member signs in on iPhone
  As a club member
  I can sign in on the iPhone app
  So that I see my own account

  A known member with valid details gets in. Wrong details stay out.
  John is the only admin. A member session never shows CRM admin tools.

  Background:
    Given the club knows member "aoife.murphy@example.com"
    And the club knows member "liam.byrne@example.com"
    And the only admin is "John Alan O'Sullivan"

  Scenario: Known member with valid details sees their own account
    When "aoife.murphy@example.com" signs in with password "green-card-fixture"
    Then they are signed in
    And they see their own account "Aoife Murphy"
    And they see their own email "aoife.murphy@example.com"
    And they see their own green card "GC-1001"
    And they do not see "Liam Byrne"
    And the member session does not show CRM admin tools

  Scenario: Wrong password stays signed out
    When "aoife.murphy@example.com" signs in with password "wrong-password"
    Then they stay signed out
    And they do not see an account

  Scenario: Unknown email stays signed out
    When "stranger@example.com" signs in with password "green-card-fixture"
    Then they stay signed out
    And they do not see an account

  Scenario: A member session never shows CRM admin tools
    When "aoife.murphy@example.com" signs in with password "green-card-fixture"
    Then they are signed in
    And they are not an admin
    And John is the only admin
    And the member session does not show CRM admin tools
