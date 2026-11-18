// One listing, one file. Everything the page says about the property and the agent is here: change it, save, done.
// The figures and photos below are SAMPLES for a made-up address: replace them with the real listing's details
// and the agent's own photographs (photos taken from a listings portal belong to someone else).
//
// "frames" under each chapter says which part of the film that text belongs to (the film has 240 frames).
window.SITE = {
  listing: {
    address: '12 Example Lane',
    town: 'Riverton',
    status: 'For sale',
    price: 649000,
    currency: '$',
    id: 'Listing ID 000000',
    summary: 'Four bedrooms on a quiet lane, ten minutes from the river.',
    facts: [['4', 'Bedrooms'], ['2', 'Bathrooms'], ['2,150', 'Square feet'], ['0.4', 'Acre lot'], ['1998', 'Built']],
    description: [
      'A bright two-storey family home at the end of a quiet lane. The main floor runs open from the front window to the patio doors, with the kitchen at the centre.',
      'Upstairs are the bedrooms and a full bath. The attached garage has inside entry, and the heating, hot water and electrical service have all been renewed in the last three years.',
    ],
    features: ['Ducted heat pump (2022)', 'Hot water tank (2023)', '200-amp electrical service', 'Attached single garage', 'Back patio, fully hedged garden', 'Paved drive for three cars'],
    rooms: [['Living room', 'Main', '18 × 14 ft'], ['Kitchen', 'Main', '14 × 12 ft'], ['Dining area', 'Main', '12 × 10 ft'], ['Primary bedroom', 'Upper', '15 × 13 ft'], ['Bedroom', 'Upper', '12 × 11 ft'], ['Bathroom', 'Upper', '10 × 7 ft']],
    photos: ['photos/1.webp', 'photos/2.webp', 'photos/3.webp', 'photos/4.webp', 'photos/5.webp', 'photos/6.webp'],
    openHouse: 'Open house Saturday, 2:00 to 4:00 pm',
    mapQuery: '12 Example Lane, Riverton',       // opens in the visitor's maps app
  },

  agent: { name: 'Agent Name', brokerage: 'Example Realty', phone: '(555) 010-0163', email: 'agent@example.com', licence: 'Licensed sales representative' },

  accent: '#9fd8c0',

  hero: { cta: 'Book a viewing', hint: 'Scroll to look inside' },

  chapters: [
    { id: 'inside', frames: [48, 86], label: 'Step inside', title: 'Two floors, lifted apart.', body: 'The main floor is open from the front window to the patio doors. Upstairs: the bedrooms and a full bath.' },
    { id: 'heat', frames: [100, 126], label: 'Comfort', color: '#ff7a2e', title: 'Heat pump, new in 2022.', body: 'Ducted heating and cooling to every room on both floors.', callouts: [{ anchor: 'furnace', text: 'Air handler' }, { anchor: 'condenser', text: 'Heat pump' }] },
    { id: 'water', frames: [136, 160], label: 'Water', color: '#39a8ff', title: 'New hot water tank, updated plumbing.', body: 'Replaced in 2023, with a full bath upstairs and a kitchen on the main floor.', callouts: [{ anchor: 'heater', text: 'Hot water tank · 2023' }] },
    { id: 'power', frames: [171, 194], label: 'Power', color: '#ffd034', title: '200-amp service, ready for a car charger.', body: 'The panel is in the garage, where a charger would go.', callouts: [{ anchor: 'panel', text: '200-amp panel' }] },
    { id: 'close', frames: [216, 240], label: 'See it', title: 'Lights on this Saturday.', body: 'Come to the open house, or book a private viewing at a time that suits.', cta: 'Book a viewing' },
  ],

  // The payment estimate. "semi-annual" compounding is the Canadian convention for fixed mortgages; use "monthly" elsewhere.
  mortgage: { title: 'What it costs a month', compounding: 'semi-annual', rate: 5.25, down: 20, years: [20, 25, 30], startYears: 25, taxPerYear: 4800,
    note: 'An estimate of principal and interest plus property tax. Ask a lender for an exact figure.' },

  contact: { title: 'Book a viewing', sub: 'Call or text the agent, or leave your details and a time that suits.', endpoint: '' },
};
