// One holiday home, one file. Everything the page says about the stay is here: change it, save, done.
// It is the host's own direct-booking page, to use beside (or instead of) a listing on a booking platform.
// The details and pictures below are SAMPLES for a made-up house: replace them with the real stay and the
// host's own photographs.
//
// "frames" under each chapter says which part of the film that text belongs to (the film has 240 frames).
window.SITE = {
  stay: {
    name: 'The Lane House',
    place: 'Riverton',
    kind: 'Entire home',
    summary: 'A whole house to yourselves, ten minutes from the river.',
    facts: [['6', 'Guests'], ['3', 'Bedrooms'], ['4', 'Beds'], ['2', 'Bathrooms']],
    description: [
      'A bright two-storey house at the end of a quiet lane, set up for families and small groups. The main floor is one open room from the front window to the patio doors, with the kitchen in the middle.',
      'Upstairs are the bedrooms and a full bath. Park on the drive, let yourselves in with the door code, and the house is yours.',
    ],
    amenities: ['Fast Wi-Fi and a desk', 'Full kitchen', 'Heat pump: warm in winter, cool in summer', 'Washer and dryer', 'Free parking for three cars', 'Electric car charger', 'Back patio and hedged garden', 'Self check-in with a door code'],
    rules: [['Check in', 'From 4:00 pm'], ['Check out', 'By 11:00 am'], ['Pets', 'Welcome, on request'], ['Smoking', 'Not in the house'], ['Parties', 'No']],
    photos: ['photos/1.webp', 'photos/2.webp', 'photos/3.webp', 'photos/4.webp', 'photos/5.webp', 'photos/6.webp'],
    mapQuery: 'Riverton',
  },

  host: { name: 'Host Name', phone: '(555) 010-0191', email: 'stay@example.com', line: 'Replies within the hour' },
  // A link to the same stay on a booking platform, if the host has one. Leave empty to hide it.
  platformLink: { label: 'Also listed on a booking platform', url: '' },

  accent: '#b9a7ff',

  hero: { cta: 'Check dates', hint: 'Scroll to look inside' },

  chapters: [
    { id: 'inside', frames: [48, 86], label: 'The house', title: 'Three bedrooms over two floors.', body: 'Open living space downstairs, bedrooms and a full bath upstairs. Room for six without anyone on a sofa.' },
    { id: 'warm', frames: [100, 126], label: 'Comfort', color: '#ff7a2e', title: 'Warm in December.', body: 'A ducted heat pump reaches every room, so it is as good a stay in winter as in summer.', callouts: [{ anchor: 'furnace', text: 'Heating to every room' }] },
    { id: 'water', frames: [136, 160], label: 'Bathrooms', color: '#39a8ff', title: 'Two bathrooms, plenty of hot water.', body: 'One on each floor, with a big tank that keeps up with six people.', callouts: [{ anchor: 'bath', text: 'Upstairs bathroom' }, { anchor: 'heater', text: 'Hot water for six' }] },
    { id: 'power', frames: [171, 194], label: 'Stay connected', color: '#ffd034', title: 'Fast Wi-Fi and a charger for the car.', body: 'Work from the desk upstairs and plug the car in on the drive overnight.', callouts: [{ anchor: 'panel', text: 'Car charger' }] },
    { id: 'close', frames: [216, 240], label: 'Arrive any time', title: 'Lights on when you get here.', body: 'Check yourselves in with the door code. We are a phone call away if you need anything.', cta: 'Check dates' },
  ],

  // Prices and booked nights. EXAMPLES: put in the host's real rates, and keep "booked" up to date
  // (each entry is a first night and a last night, year-month-day).
  booking: {
    title: 'Check dates and price',
    currency: '$', nightly: 220, weekendNightly: 260, cleaning: 95, taxPercent: 15, minNights: 2, maxGuests: 6,
    booked: [['2026-12-05', '2026-12-08'], ['2026-12-19', '2026-12-27'], ['2026-12-31', '2027-01-02'], ['2027-01-15', '2027-01-18']],
    start: '2026-12',                            // the first month the calendar shows
    note: 'Booking direct with the host: no platform fees. You pay nothing until the host confirms.',
  },

  // SAMPLE TEXT: swap these for real guest reviews before the site goes live.
  reviews: { title: 'What guests say', items: [
    { text: 'Sample review. Replace with a real guest quote about the house.', who: 'Guest name, month of stay' },
    { text: 'Sample review. Replace with a real guest quote about the location.', who: 'Guest name, month of stay' },
    { text: 'Sample review. Replace with a real guest quote about the host.', who: 'Guest name, month of stay' },
  ] },

  contact: { endpoint: '' },                     // where booking requests are sent (Formspree, Basin, Netlify Forms)
};
