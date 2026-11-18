// Everything the dealer's site says lives in this one file: the name, the phone number, the stock list and the
// finance rate. Change it, save, and the page updates. Nothing here needs a programmer.
//
// "frames" under each chapter says which part of the film that text belongs to (the film has 240 frames).
window.SITE = {
  business: {
    name: 'Acme Motors',                        // placeholder: the dealer's trading name
    short: 'Acme Motors',
    phone: '(555) 010-0177',
    email: 'sales@example.com',
    address: '100 Example Road, Riverton',
    licence: 'Dealer licence no. 000000',
    hours: [['Mon to Fri', '9:00 to 20:00'], ['Saturday', '9:00 to 18:00'], ['Sunday', '11:00 to 16:00']],
  },

  accent: '#ff5a36',                            // the one brand colour: buttons, prices, highlights

  hero: {
    kicker: 'Used cars · Finance · Part exchange',
    title: 'Walk the lot from your sofa.',
    sub: 'Every car we have, priced and ready to drive away today.',
    cta: 'See the stock',
    hint: 'Scroll to walk the lot',
  },

  // A chapter with "stock" shows that car's name and price from the stock list below.
  chapters: [
    { id: 'lot', frames: [44, 66], label: 'The lot', title: 'One straight price on every screen.', body: 'No haggling and no hidden fees. The price on the windscreen is the price you pay.' },
    { id: 'car1', frames: [84, 114], label: 'On the turntable', stock: 0, anchor: 'car1' },
    { id: 'car2', frames: [132, 164], label: 'On the turntable', stock: 1, anchor: 'car2' },
    { id: 'car3', frames: [182, 208], label: 'On the turntable', stock: 2, anchor: 'car3' },
    { id: 'close', frames: [218, 240], label: 'Open late', title: 'Lights on until eight.', body: 'Test drives every day, no appointment needed. Bring your licence.', cta: 'Find my car' },
  ],

  // SAMPLE STOCK: replace with the dealer's real cars. "img" is a photo in the stock/ folder.
  stock: [
    { name: 'City Hatch 1.2', year: 2021, body: 'Hatchback', price: 14900, miles: 28400, fuel: 'Petrol', gearbox: 'Manual', mpg: 52, img: 'stock/0.webp', line: 'One owner, full history, cheap to insure.' },
    { name: 'Family SUV 2.0 AWD', year: 2022, body: 'SUV', price: 27500, miles: 19800, fuel: 'Hybrid', gearbox: 'Automatic', mpg: 44, img: 'stock/1.webp', line: 'Five seats, a big boot and four-wheel drive.' },
    { name: 'Work Pickup 2.8', year: 2020, body: 'Pickup', price: 24900, miles: 46200, fuel: 'Diesel', gearbox: 'Automatic', mpg: 31, img: 'stock/2.webp', line: 'Tow bar, load liner and a one-tonne payload.' },
    { name: 'Saloon 1.8 Hybrid', year: 2021, body: 'Saloon', price: 18750, miles: 33100, fuel: 'Hybrid', gearbox: 'Automatic', mpg: 58, img: 'stock/3.webp', line: 'Quiet, frugal and easy on long drives.' },
    { name: 'Seven-seat SUV 2.2', year: 2019, body: 'SUV', price: 21400, miles: 58900, fuel: 'Diesel', gearbox: 'Automatic', mpg: 38, img: 'stock/4.webp', line: 'Room for seven and a year of warranty.' },
    { name: 'Sport Hatch 1.6 Turbo', year: 2020, body: 'Hatchback', price: 16300, miles: 41700, fuel: 'Petrol', gearbox: 'Manual', mpg: 43, img: 'stock/5.webp', line: 'Quick, tidy and just serviced.' },
    { name: 'Executive Saloon 2.0', year: 2019, body: 'Saloon', price: 17200, miles: 62300, fuel: 'Diesel', gearbox: 'Automatic', mpg: 49, img: 'stock/6.webp', line: 'Leather, heated seats and a motorway cruiser.' },
    { name: 'Crew-cab Pickup 3.0', year: 2022, body: 'Pickup', price: 33800, miles: 14500, fuel: 'Diesel', gearbox: 'Automatic', mpg: 29, img: 'stock/7.webp', line: 'Five seats and a full-size load bed.' },
  ],
  currency: '$', distance: 'miles',
  economy: { unit: 'mpg', better: 'higher' },   // or { unit: 'L/100 km', better: 'lower' } with an "economy" figure on each car

  finder: { title: 'Find my car', sub: 'Tell us the shape and the budget. We show what is on the lot today.' },
  compare: { title: 'Pick two. Settle it.', sub: 'Side by side, with the stronger figure marked on each line.' },

  // EXAMPLE finance figures: replace with the dealer's real lender terms and wording.
  finance: {
    title: 'What it costs a month', apr: 8.9, terms: [24, 36, 48, 60], startTerm: 48, startDeposit: 2000,
    frequency: ['Monthly'],                     // add 'Bi-weekly' to let visitors switch (the first one is shown first)
    note: 'An illustration at a fixed rate, not an offer of credit. Finance is subject to status.',
  },

  stockTitle: 'On the lot now',

  contact: {
    title: 'Come and drive one',
    sub: 'Call, drop in, or leave your details and we will hold the car for you.',
    endpoint: '',                               // where the form sends requests (Formspree, Basin, Netlify Forms)
  },
};
