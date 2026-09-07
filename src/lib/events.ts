export type SocietyEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  venue: string;
  address?: string;
  summary: string;
  href?: string;
};

/**
 * Upcoming society events. Leave empty for the polished empty state.
 * Add objects here when the committee publishes the next gathering.
 */
export const upcomingEvents: SocietyEvent[] = [];
