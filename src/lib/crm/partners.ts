import type { MembersActor } from "./access";

export type PartnerKind = "bar" | "restaurant";

/**
 * Sample rewards venues. This repo and the older CRM name gala sponsors,
 * not partner bars or restaurants, so these places are fixtures only.
 */
export type PartnerPlace = {
  name: string;
  kind: PartnerKind;
  offer: string;
  sample: true;
};

export const SAMPLE_PARTNER_PLACES: readonly PartnerPlace[] = [
  {
    name: "Sample Harbour Bar",
    kind: "bar",
    offer: "Sample offer: 10% off food and drink for Green Card holders.",
    sample: true,
  },
  {
    name: "Sample Lantern Restaurant",
    kind: "restaurant",
    offer: "Sample offer: a complimentary soft drink with a main course.",
    sample: true,
  },
];

export function samplePartner(name: string): PartnerPlace | undefined {
  return SAMPLE_PARTNER_PLACES.find((place) => place.name === name);
}

export type PartnerPlacesScreen = {
  phase: "open" | "closed" | "notImplemented";
  showsCrmManagement: boolean;
  showsPointsBalance: boolean;
  visibleSections: readonly string[];
  places: readonly PartnerPlace[];
};

const CLOSED_PARTNER_PLACES: PartnerPlacesScreen = {
  phase: "closed",
  showsCrmManagement: false,
  showsPointsBalance: false,
  visibleSections: [],
  places: [],
};

export function openPartnerPlaces(actor: MembersActor): PartnerPlacesScreen {
  if (actor.role !== "member" || actor.account.isAdmin) {
    return CLOSED_PARTNER_PLACES;
  }
  return {
    phase: "open",
    showsCrmManagement: false,
    showsPointsBalance: false,
    visibleSections: ["Partner places"],
    places: SAMPLE_PARTNER_PLACES,
  };
}
