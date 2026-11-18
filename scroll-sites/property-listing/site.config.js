// One listing, one file. Everything the page says about the property and the agent is here: change it, save, done.
// The figures below are SAMPLES for a made-up address, and the pictures are original 3D renders made for this
// concept, so the whole demo is ours to show. For a real listing, put in its details and the agent's photographs.
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
    // The photographs, in walk-through order. The same pictures make the film: after changing them, run
    //   node tools/photos-to-film.mjs property-listing --photos property-listing/originals
    photos: ['photos/01-front.webp', 'photos/04-living-room.webp', 'photos/07-kitchen.webp', 'photos/06-dining.webp', 'photos/05-living-to-kitchen.webp', 'photos/08-main-bedroom.webp', 'photos/09-second-bedroom.webp',
      'photos/10-bathroom.webp', 'photos/03-front-door.webp', 'photos/11-back-patio.webp', 'photos/12-drive-garage.webp', 'photos/02-from-above.webp'],
    photoNote: 'Original 3D pictures made for this concept. Replace them with photographs of the property.',
    openHouse: 'Open house Saturday, 2:00 to 4:00 pm',
    mapQuery: '12 Example Lane, Riverton',       // opens in the visitor's maps app
  },

  agent: { name: 'Agent Name', brokerage: 'Example Realty', phone: '(555) 010-0163', email: 'agent@example.com', licence: 'Licensed sales representative' },

  accent: '#9fd8c0',

  hero: { cta: 'Book a viewing', hint: 'Scroll to look inside' },

  // The film is made from the photographs (12 of them, 20 frames each), so it fills the screen.
  film: { fit: 'cover' },

  chapters: [
    { id: 'door', frames: [42, 58], label: 'Welcome', title: 'Step inside.', body: 'A covered porch, a wide front door and parking right outside.' },
    { id: 'living', frames: [63, 97], label: 'Main floor', title: 'One open room, front to back.', body: 'The living room runs from the big front window through to the stairs and the kitchen.' },
    { id: 'kitchen', frames: [103, 137], label: 'Kitchen and dining', title: 'The kitchen is the middle of the house.', body: 'An island with seating, and a table for six beside the garden doors.' },
    { id: 'beds', frames: [143, 177], label: 'Upstairs', title: 'Quiet bedrooms under the roof.', body: 'The primary bedroom faces the garden. The second takes a double bed and a desk.' },
    { id: 'bath', frames: [183, 197], label: 'Bathroom', title: 'A full bath upstairs.', body: 'Tub, vanity and a window for daylight.' },
    { id: 'close', frames: [204, 240], label: 'See it', title: 'Lights on this Saturday.', body: 'Come to the open house, or book a private viewing at a time that suits.', cta: 'Book a viewing' },
  ],

  // The payment estimate. "semi-annual" compounding is the Canadian convention for fixed mortgages; use "monthly" elsewhere.
  mortgage: { title: 'What it costs a month', compounding: 'semi-annual', rate: 5.25, down: 20, years: [20, 25, 30], startYears: 25, taxPerYear: 4800,
    note: 'An estimate of principal and interest plus property tax. Ask a lender for an exact figure.' },

  contact: { title: 'Book a viewing', sub: 'Call or text the agent, or leave your details and a time that suits.', endpoint: '' },
};
