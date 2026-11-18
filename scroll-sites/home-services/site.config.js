// Everything a client's site says lives in this one file. Change the words, the phone number and the colour,
// save, and the page updates. Nothing here needs a programmer.
//
// "frames" under each chapter says which part of the film that text belongs to (the film has 240 frames).
window.SITE = {
  business: {
    name: 'Acme Home Services',                 // placeholder: the client's trading name
    short: 'Acme',                              // used in the small top bar
    phone: '(555) 010-0142',                    // shown as text and as a tap-to-call link
    email: 'hello@example.com',
    area: 'Serving Riverton and 15 miles around',
    licence: 'Licence no. 000000 · Fully insured',
    hours: [['Mon to Fri', '7:00 to 18:00'], ['Saturday', '8:00 to 14:00'], ['Emergencies', '24 hours, every day']],
  },

  accent: '#ffbe73',                            // the one brand colour: buttons, links, highlights

  hero: {
    kicker: 'Heating · Cooling · Plumbing · Electrical',
    title: 'Everything behind your walls, looked after.',
    sub: 'One local team for the systems that keep a house warm, dry and switched on.',
    cta: 'Book a visit',
    hint: 'Scroll to look inside',
  },

  chapters: [
    { id: 'inside', frames: [48, 86], label: 'How we work', title: 'We start by looking properly.',
      body: 'Every visit begins with a full look at how the house is put together, not just the part that failed.' },
    { id: 'hvac', frames: [100, 126], label: 'Heating and cooling', color: '#ff7a2e', title: 'Warm in winter. Cool in summer.',
      body: 'Furnace and heat-pump servicing, new systems, duct repairs and same-day breakdown calls.',
      callouts: [{ anchor: 'furnace', text: 'Furnace · serviced yearly' }, { anchor: 'condenser', text: 'Outdoor unit' }] },
    { id: 'plumbing', frames: [136, 160], label: 'Plumbing', color: '#39a8ff', title: 'Hot water, and nowhere it should not be.',
      body: 'Leaks, water heaters, blocked drains, bathroom and kitchen fit-outs.',
      callouts: [{ anchor: 'heater', text: 'Water heater' }, { anchor: 'bath', text: 'Bathroom supply' }] },
    { id: 'electrical', frames: [171, 194], label: 'Electrical', color: '#ffd034', title: 'Safe power in every room.',
      body: 'Panel upgrades, rewiring, lighting, EV chargers and safety inspections.',
      callouts: [{ anchor: 'panel', text: 'Main panel' }] },
    { id: 'close', frames: [216, 240], label: 'Done properly', title: 'Lights on. Job done. Guaranteed.',
      body: 'Fixed quotes before we start and a 12-month guarantee on all work.', cta: 'Get a guide price' },
  ],

  services: {
    title: 'What we do',
    items: [
      { name: 'Heating and cooling', text: 'Servicing, repairs and full replacements for furnaces, heat pumps and air conditioning.', from: 'from $129', color: '#ff7a2e' },
      { name: 'Plumbing', text: 'Leaks, drains, water heaters, taps and toilets, bathrooms and kitchens.', from: 'from $95', color: '#39a8ff' },
      { name: 'Electrical', text: 'Fault finding, panels, sockets and lighting, EV chargers, safety certificates.', from: 'from $110', color: '#ffd034' },
      { name: 'Emergency call-out', text: 'No heat, no water or no power. A real person answers, day or night.', from: '24 hours', color: '#ffbe73' },
    ],
  },

  // The guide-price tool. These figures are EXAMPLES: replace them with the client's real rates.
  estimator: {
    title: 'Get a guide price',
    note: 'A guide only. We confirm a fixed price on site before any work starts.',
    currency: '$',
    jobs: [
      { name: 'Annual service', base: [120, 180], perSqFt: 0 },
      { name: 'Repair visit', base: [150, 420], perSqFt: 0.02 },
      { name: 'New water heater', base: [1400, 2200], perSqFt: 0.05 },
      { name: 'New heating system', base: [4200, 6800], perSqFt: 1.1 },
      { name: 'Full rewire', base: [3800, 5200], perSqFt: 2.4 },
    ],
    size: { label: 'Home size', unit: 'sq ft', min: 600, max: 4000, step: 50, start: 1800 },
    urgent: { label: 'Out-of-hours visit', multiplier: 1.35 },
  },

  steps: {
    title: 'How a visit works',
    items: [
      ['You call or book online', 'Tell us what is wrong. We give you a two-hour arrival window, usually the same or next day.'],
      ['We look before we quote', 'The engineer inspects the whole system and explains what they find in plain words.'],
      ['Fixed price, agreed first', 'You get the price in writing before any work starts. No call-out surprises.'],
      ['Done, tested, guaranteed', 'We test everything, clean up and leave you with a 12-month guarantee.'],
    ],
  },

  // SAMPLE TEXT: swap these for real customer reviews before the site goes live.
  reviews: {
    title: 'What customers say',
    items: [
      { text: 'Sample review. Replace with a real customer quote about a heating repair.', who: 'Customer name, suburb' },
      { text: 'Sample review. Replace with a real customer quote about a plumbing job.', who: 'Customer name, suburb' },
      { text: 'Sample review. Replace with a real customer quote about electrical work.', who: 'Customer name, suburb' },
    ],
  },

  contact: {
    title: 'Book a visit',
    sub: 'Call, or leave your details and we will ring you back within one working hour.',
    // Where the booking form sends requests: a form service address (Formspree, Basin, Netlify Forms) or the
    // client's own. Leave empty and the form shows a notice instead of sending.
    endpoint: '',
  },
};
