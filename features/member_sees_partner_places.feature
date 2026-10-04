Feature: Member sees partner places
  As a signed-in member
  I can see which bars and restaurants are in the rewards program
  And what each place offers

  This is a list of specific places, not a points balance.
  The places below are sample fixtures, not real partner businesses.
  Earning a reward is out of scope.
  A signed-out visitor does not see the list.
  A member session does not show CRM management.
  John Alan O'Sullivan remains the only admin.

  Background:
    Given the rewards program lists sample partner "Sample Harbour Bar"
    And the rewards program lists sample partner "Sample Lantern Restaurant"
    And the club knows member "aoife.murphy@example.com"
    And the only admin is "John Alan O'Sullivan"

  Scenario: Signed-in member sees each place and its offer
    Given "aoife.murphy@example.com" signs in on the website with password "green-card-fixture"
    When they open the partner places
    Then they see partner "Sample Harbour Bar"
    And that place is a "bar"
    And they see the offer "Sample offer: 10% off food and drink for Green Card holders."
    And they see partner "Sample Lantern Restaurant"
    And that place is a "restaurant"
    And they see the offer "Sample offer: a complimentary soft drink with a main course."
    And they do not see a points balance
    And every place is marked as a sample
    And they are not an admin
    And the member session does not show CRM management

  Scenario: A signed-out visitor does not see partner places
    When they open the partner places
    Then the partner list stays closed
    And they do not see partner "Sample Harbour Bar"
    And they do not see partner "Sample Lantern Restaurant"
    And they do not see a points balance

  Scenario: A member session does not open the CRM
    Given "aoife.murphy@example.com" signs in on the website with password "green-card-fixture"
    When they open the partner places
    Then they see partner "Sample Harbour Bar"
    And they open the members screen
    And the members screen stays closed
    And the member session does not show CRM management
