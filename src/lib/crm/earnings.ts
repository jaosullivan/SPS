import type { CrmAccess, MembersActor } from "./access";

/** One place's existing offer, recorded for one member. Not a points balance. */
export type EarnedOffer = {
  memberId: number;
  placeName: string;
  offer: string;
  sample: true;
};

export type EarnOfferResult =
  | {
      outcome: "earned";
      reward: EarnedOffer;
      showsPointsBalance: false;
      showsCrmManagement: false;
    }
  | { outcome: "denied"; showsPointsBalance: false; showsCrmManagement: false }
  | { outcome: "notImplemented" };

export class OfferEarnings {
  earn(
    access: CrmAccess,
    actor: MembersActor,
    memberId: number,
    placeName: string,
  ): EarnOfferResult {
    void access;
    void actor;
    void memberId;
    void placeName;
    return { outcome: "notImplemented" };
  }

  forMember(memberId: number): readonly EarnedOffer[] {
    void memberId;
    return [];
  }
}
