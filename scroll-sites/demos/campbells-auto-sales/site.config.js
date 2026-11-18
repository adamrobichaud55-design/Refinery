// CONCEPT DEMO for Campbell's Auto Sales, Moncton, New Brunswick: a mock-up to show the dealership what a
// scroll-driven site could look like. It is not their website and must not be put online as if it were.
//
// What is real here: the business name and city (from public business directories).
// What is NOT confirmed and must be checked with the dealership before any real use:
//   - the street address (directories mostly give 160 Baig Blvd, but not all agree)
//   - the phone number and opening hours (directories disagree, so placeholders are used)
//   - "over 200 used vehicles" (reported as a claim on their own site, which could not be opened from here)
//   - every car, price and finance figure below: SAMPLE STOCK, not their inventory
window.SITE = {
  concept: "Concept design for Campbell's Auto Sales. Not the dealership's website.",

  business: {
    name: "Campbell's Auto Sales",
    short: "Campbell's Auto",
    phone: '(506) 000-0000',                    // PLACEHOLDER: put the dealership's real number here
    email: 'sales@example.com',                 // PLACEHOLDER
    address: '160 Baig Blvd, Moncton, NB',      // to confirm
    licence: 'Moncton, New Brunswick',
    hours: [['Mon to Fri', 'Hours to confirm'], ['Saturday', 'Hours to confirm'], ['Sunday', 'Closed']],
  },

  accent: '#ff5a36',

  hero: {
    kicker: 'Used vehicles · Financing · Trade-ins',
    title: 'Walk the lot from your sofa.',
    sub: 'Over 200 used vehicles in Moncton, priced and ready to drive away.',
    cta: 'See the stock',
    hint: 'Scroll to walk the lot',
  },

  chapters: [
    { id: 'lot', frames: [44, 66], label: 'The lot', title: 'One straight price on every windshield.', body: 'No haggling and no hidden fees. The price you see is the price you pay, plus HST.' },
    { id: 'car1', frames: [84, 114], label: 'On the turntable', stock: 0, anchor: 'car1' },
    { id: 'car2', frames: [132, 164], label: 'On the turntable', stock: 1, anchor: 'car2' },
    { id: 'car3', frames: [182, 208], label: 'On the turntable', stock: 2, anchor: 'car3' },
    { id: 'close', frames: [218, 240], label: 'Baig Blvd, Moncton', title: 'Come and drive one.', body: 'Test drives whenever we are open, no appointment needed. Bring your licence.', cta: 'Find my car' },
  ],

  // SAMPLE STOCK with made-up vehicles: replace with the dealership's real inventory and photographs.
  stock: [
    { name: 'City Hatch 1.2', year: 2021, body: 'Hatchback', price: 17900, miles: 45700, fuel: 'Gas', gearbox: 'Manual', economy: 4.5, img: 'stock/0.webp', line: 'One owner, full history, cheap to insure.' },
    { name: 'Family SUV 2.0 AWD', year: 2022, body: 'SUV', price: 32500, miles: 31900, fuel: 'Hybrid', gearbox: 'Automatic', economy: 5.3, img: 'stock/1.webp', line: 'Five seats, a big trunk and all-wheel drive for winter.' },
    { name: 'Work Truck 2.8', year: 2020, body: 'Truck', price: 29900, miles: 74400, fuel: 'Diesel', gearbox: 'Automatic', economy: 7.6, img: 'stock/2.webp', line: 'Tow package, box liner and a one-tonne payload.' },
    { name: 'Sedan 1.8 Hybrid', year: 2021, body: 'Sedan', price: 22750, miles: 53300, fuel: 'Hybrid', gearbox: 'Automatic', economy: 4.1, img: 'stock/3.webp', line: 'Quiet, frugal and easy on the highway.' },
    { name: 'Seven-seat SUV 2.2', year: 2019, body: 'SUV', price: 25400, miles: 94800, fuel: 'Diesel', gearbox: 'Automatic', economy: 6.2, img: 'stock/4.webp', line: 'Room for seven and a year of warranty.' },
    { name: 'Sport Hatch 1.6 Turbo', year: 2020, body: 'Hatchback', price: 19300, miles: 67100, fuel: 'Gas', gearbox: 'Manual', economy: 5.5, img: 'stock/5.webp', line: 'Quick, tidy and just serviced.' },
    { name: 'Executive Sedan 2.0', year: 2019, body: 'Sedan', price: 20200, miles: 100300, fuel: 'Diesel', gearbox: 'Automatic', economy: 4.8, img: 'stock/6.webp', line: 'Leather, heated seats and remote start.' },
    { name: 'Crew-cab Truck 3.0', year: 2022, body: 'Truck', price: 41800, miles: 23300, fuel: 'Diesel', gearbox: 'Automatic', economy: 8.1, img: 'stock/7.webp', line: 'Five seats and a full-size box.' },
  ],
  currency: '$', distance: 'km',
  economy: { unit: 'L/100 km', better: 'lower' },

  finder: { title: 'Find my car', sub: 'Tell us the shape and the budget. We show what is on the lot today.' },
  compare: { title: 'Pick two. Settle it.', sub: 'Side by side, with the stronger figure marked on each line.' },

  // EXAMPLE finance figures: replace with the dealership's real lender terms and wording.
  finance: {
    title: 'What the payments look like', apr: 8.9, terms: [36, 48, 60, 72, 84], startTerm: 72, startDeposit: 2000,
    frequency: ['Bi-weekly', 'Monthly'],
    note: 'An illustration at a fixed rate, on approved credit. Prices exclude HST and fees. Not an offer of credit.',
  },

  stockTitle: 'On the lot now',

  contact: { title: 'Come and drive one', sub: 'Call, drop in, or leave your details and we will hold the vehicle for you.', endpoint: '' },
};
