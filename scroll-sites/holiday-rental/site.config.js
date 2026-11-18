// One holiday home, one file. Everything the page says about the stay is here: change it, save, done.
// It is the host's own direct-booking page, to use beside (or instead of) a listing on a booking platform.
// The apartment in the 3D walkthrough is a made-up one, built in code (tour-src/tour3d.js). The details below
// are SAMPLES to match it: replace them with the real stay, and have the walkthrough rebuilt from its floor
// plan and photographs.
//
// "frames" under each chapter says which part of the walkthrough that text belongs to, on a scale of 0 to 240:
// 0 front door, 30 kitchen, 60 living room, 102 balcony, 124 along the balcony, 162 bedroom, 198 bathroom,
// 240 looking down on the whole plan.
window.SITE = {
  stay: {
    name: 'The Sea Room',
    place: 'Riverton Beach',
    kind: 'Entire apartment',
    summary: 'A one-bedroom apartment ten floors above the water. Walk through it before you book.',
    facts: [['4', 'Guests'], ['1', 'Bedroom'], ['2', 'Beds'], ['1', 'Bathroom']],
    description: [
      'A bright corner apartment with glass along the whole sea side. The kitchen, dining table and sofa share one open room, and every seat in it faces the water.',
      'The bedroom has its own door to the balcony. Let yourselves in with the door code, drop your bags, and the place is yours.',
    ],
    amenities: ['Sea view from every room', 'Balcony with two loungers', 'Full kitchen with an island', 'King bed, and a sofa bed in the living room', 'Walk-in shower', 'Fast Wi-Fi', 'Air conditioning', 'Self check-in with a door code'],
    rules: [['Check in', 'From 4:00 pm'], ['Check out', 'By 11:00 am'], ['Pets', 'Sorry, no'], ['Smoking', 'On the balcony only'], ['Parties', 'No']],
    photos: ['photos/1.webp', 'photos/2.webp', 'photos/3.webp', 'photos/4.webp', 'photos/5.webp', 'photos/6.webp', 'photos/7.webp', 'photos/8.webp'],
    photoNote: 'Pictures from the 3D walkthrough. Replace or add to them with photographs of the stay.',
    mapQuery: 'Riverton Beach',
  },

  host: { name: 'Host Name', phone: '(555) 010-0191', email: 'stay@example.com', line: 'Replies within the hour' },
  // A link to the same stay on a booking platform, if the host has one. Leave empty to hide it.
  platformLink: { label: 'Also listed on a booking platform', url: '' },

  accent: '#b9a7ff',

  hero: { cta: 'Check dates', hint: 'Scroll to walk through' },

  // The 3D walkthrough: the time of day it opens at (0 midday, 0.42 late afternoon, 0.55 sunset, 1 night).
  tour: { time: 0.42, times: [['Day', 0.08], ['Sunset', 0.55], ['Night', 1]] },

  chapters: [
    { id: 'kitchen', frames: [22, 40], label: 'Kitchen', title: 'Cook with the sea in the corner of your eye.', body: 'A full kitchen with a marble island, three stools and everything you need for more than toast.' },
    { id: 'living', frames: [52, 74], label: 'Living room', title: 'Sink into the sofa. Watch the light change.', body: 'Glass from wall to wall, a table for four, and a sofa that turns into a second bed.' },
    { id: 'balcony', frames: [94, 128], label: 'Balcony', title: 'Ten floors up, with nothing in front of you but water.', body: 'Two loungers, a table for breakfast, and the best seat for sunset.' },
    { id: 'bedroom', frames: [148, 170], label: 'Bedroom', title: 'Wake up to it.', body: 'A king bed that faces the sea, built-in wardrobes, and its own door to the balcony.' },
    { id: 'bath', frames: [188, 204], label: 'Bathroom', title: 'A walk-in shower and room to unpack.', body: 'Stone, brass and a big round mirror, just off the bedroom.' },
    { id: 'plan', frames: [226, 240], label: 'The whole place', title: 'One bedroom, 68 square metres, all yours.', body: 'Pick your dates below. You pay nothing until the host says yes.', cta: 'Check dates' },
  ],

  // Prices and booked nights. EXAMPLES: put in the host's real rates, and keep "booked" up to date
  // (each entry is a first night and a last night, year-month-day).
  booking: {
    title: 'Check dates and price',
    currency: '$', nightly: 185, weekendNightly: 225, cleaning: 80, taxPercent: 15, minNights: 2, maxGuests: 4,
    booked: [['2026-12-05', '2026-12-08'], ['2026-12-19', '2026-12-27'], ['2026-12-31', '2027-01-02'], ['2027-01-15', '2027-01-18']],
    start: '2026-12',                            // the first month the calendar shows
    note: 'Booking direct with the host: no platform fees. You pay nothing until the host confirms.',
  },

  // SAMPLE TEXT: swap these for real guest reviews before the site goes live.
  reviews: { title: 'What guests say', items: [
    { text: 'Sample review. Replace with a real guest quote about the apartment.', who: 'Guest name, month of stay' },
    { text: 'Sample review. Replace with a real guest quote about the location.', who: 'Guest name, month of stay' },
    { text: 'Sample review. Replace with a real guest quote about the host.', who: 'Guest name, month of stay' },
  ] },

  contact: { endpoint: '' },                     // where booking requests are sent (Formspree, Basin, Netlify Forms)
};
