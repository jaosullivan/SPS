Feature: Member earns a partner offer
  As a signed-in member
  I can qualify at a specific partner place
  And earn the reward that place already offers

  This is that place's offer for that member, not a points balance.
  Redeeming at the venue is out of scope.
  The places are the existing sample fixtures, not real partners.
  A signed-out visitor cannot earn an offer.
  A member cannot earn an offer for another member.
  A member session does not show CRM management.
  John Alan O'Sullivan remains the only admin.

  Background:
    Given the rewards program lists sample partner "Sample Harbour Bar"
    And the rewards program lists sample partner "Sample Lantern Restaurant"
    And the club knows member "aoife.murphy@example.com"
    And the club knows member "liam.byrne@example.com"
    And the only admin is "John Alan O'Sullivan"

  Scenario: Green Card holder earns the Harbour Bar offer
    Given "aoife.murphy@example.com" signs in on the website with password "green-card-fixture"
    When they earn the offer at "Sample Harbour Bar"
    Then the offer is earned
    And they have earned "Sample offer: 10% off food and drink for Green Card holders." at "Sample Harbour Bar"
    And they have not earned an offer at "Sample Lantern Restaurant"
    And they do not see a points balance
    And they are not an admin
    And John is the only admin
    And the member session does not show CRM management

  Scenario: Member without a green card does not earn the Harbour Bar offer
    Given member "liam.byrne@example.com" has no green card
    And "liam.byrne@example.com" signs in on the website with password "green-card-fixture"
    When they earn the offer at "Sample Harbour Bar"
    Then the offer is denied
    And they have not earned an offer at "Sample Harbour Bar"
    And they do not see a points balance

  Scenario: Signed-in member earns the Lantern Restaurant offer
    Given member "liam.byrne@example.com" has no green card
    And "liam.byrne@example.com" signs in on the website with password "green-card-fixture"
    When they earn the offer at "Sample Lantern Restaurant"
    Then the offer is earned
    And they have earned "Sample offer: a complimentary soft drink with a main course." at "Sample Lantern Restaurant"
    And they have not earned an offer at "Sample Harbour Bar"
    And they do not see a points balance
    And the member session does not show CRM management

  Scenario: A signed-out visitor cannot earn an offer
    When they earn the offer at "Sample Harbour Bar"
    Then the offer is denied
    And they have not earned an offer at "Sample Harbour Bar"
    When they earn the offer at "Sample Lantern Restaurant"
    Then the offer is denied
    And they have not earned an offer at "Sample Lantern Restaurant"

  Scenario: A member cannot earn an offer for another member
    Given "aoife.murphy@example.com" signs in on the website with password "green-card-fixture"
    When they try to earn the offer at "Sample Harbour Bar" for "liam.byrne@example.com"
    Then the offer is denied
    And member "liam.byrne@example.com" has not earned an offer at "Sample Harbour Bar"
    And they have not earned an offer at "Sample Harbour Bar"
    And they do not see a points balance
    And the member session does not show CRM management
