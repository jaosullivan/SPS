import type { CrmAccess, MembersActor } from "./access";
import { samplePartner } from "./partners";

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

const DENIED: EarnOfferResult = {
  outcome: "denied",
  showsPointsBalance: false,
  showsCrmManagement: false,
};

export class OfferEarnings {
  private readonly rewards: EarnedOffer[] = [];

  earn(
    access: CrmAccess,
    actor: MembersActor,
    memberId: number,
    placeName: string,
  ): EarnOfferResult {
    if (actor.role !== "member" || actor.account.isAdmin || actor.account.id !== memberId) {
      return DENIED;
    }
    const known = access.members.find((member) => member.account.id === memberId);
    if (!known) {
      return DENIED;
    }
    const place = samplePartner(placeName);
    if (!place) {
      return DENIED;
    }
    const card = (known.account.greenCardNumber ?? "").trim();
    if (place.offer.toLowerCase().includes("green card") && card.length === 0) {
      return DENIED;
    }
    const existing = this.rewards.find(
      (reward) => reward.memberId === memberId && reward.placeName === place.name,
    );
    if (existing) {
      return {
        outcome: "earned",
        reward: existing,
        showsPointsBalance: false,
        showsCrmManagement: false,
      };
    }
    const reward: EarnedOffer = {
      memberId,
      placeName: place.name,
      offer: place.offer,
      sample: true,
    };
    this.rewards.push(reward);
    return {
      outcome: "earned",
      reward,
      showsPointsBalance: false,
      showsCrmManagement: false,
    };
  }

  forMember(memberId: number): readonly EarnedOffer[] {
    return this.rewards.filter((reward) => reward.memberId === memberId);
  }
}

const earningsStore = globalThis as typeof globalThis & {
  __spsWebsiteEarnings?: OfferEarnings;
};

/** In-memory earned offers for the running website. Tests use `new OfferEarnings()`. */
export function websiteEarnings(): OfferEarnings {
  const existing = earningsStore.__spsWebsiteEarnings;
  if (
    existing &&
    typeof existing.earn === "function" &&
    typeof existing.forMember === "function"
  ) {
    return existing;
  }
  const created = new OfferEarnings();
  earningsStore.__spsWebsiteEarnings = created;
  return created;
}
