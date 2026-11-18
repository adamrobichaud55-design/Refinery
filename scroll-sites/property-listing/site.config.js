// One listing, one file. Everything the page says about the property and the agent is here: change it, save, done.
//
// This demo uses real photographs of a real house so that it looks like the finished thing: the Paul Schweikher
// House in Schaumburg, Illinois, photographed by Warren LeMay and used under CC BY-SA 2.0 (see originals/CREDITS.md).
// The house is a museum and is NOT for sale: the address, price and every detail below are made up. For a real
// listing, put in its details and the agent's own photographs.
//
// "frames" under each chapter says which part of the film that text belongs to, on a scale of 0 to 240.
window.SITE = {
  listing: {
    address: '12 Example Lane',
    town: 'Riverton',
    status: 'For sale',
    price: 649000,
    currency: '$',
    id: 'Listing ID 000000',
    summary: 'A redwood and brick mid-century home among mature oaks.',
    facts: [['3', 'Bedrooms'], ['2', 'Bathrooms'], ['2,400', 'Square feet'], ['1.2', 'Acre lot'], ['1938', 'Built']],
    description: [
      'A single-level mid-century home in redwood and brick, set back from the road among mature oaks. The living room is the heart of it: a brick fireplace wall, exposed beams and a run of windows to the garden.',
      'The bedrooms sit along a glazed hallway, each with built-in storage. A covered carport, a paved courtyard and a separate studio wing complete the plan.',
    ],
    features: ['Redwood interior throughout', 'Brick fireplaces in the living room and main bedroom', 'Garden windows in every room', 'Separate studio wing', 'Covered carport and paved courtyard', 'Grounds with mature oaks'],
    rooms: [['Living room', 'Main', '28 × 18 ft'], ['Kitchen', 'Main', '12 × 10 ft'], ['Dining room', 'Main', '14 × 12 ft'], ['Main bedroom', 'Main', '16 × 14 ft'], ['Guest room', 'Main', '18 × 12 ft'], ['Bedroom', 'Main', '14 × 11 ft'], ['Bathroom', 'Main', '10 × 8 ft']],
    // The photographs, in walk-through order. The same pictures make the film: after changing them, run
    //   node tools/photos-to-film.mjs property-listing --photos property-listing/originals/land --port-photos property-listing/originals/port --frames 120 --quality 40 --scale 0.8
    photos: ['photos/01-exterior-lawn.webp', 'photos/03-living-room.webp', 'photos/04-living-room-sofa.webp', 'photos/06-kitchen.webp', 'photos/05-living-room-windows.webp', 'photos/08-main-bedroom.webp', 'photos/09-guest-room.webp',
      'photos/07-dining-shelves.webp', 'photos/10-bedroom.webp', 'photos/11-bathroom.webp', 'photos/02-arrival-carport.webp', 'photos/12-exterior-garden.webp'],
    photoNote: 'Sample photographs: the Paul Schweikher House, Schaumburg, Illinois, by Warren LeMay (CC BY-SA 2.0, Wikimedia Commons). The house is a museum and is not for sale. The address, price and details on this page are made up.',
    photoCredit: 'Photographs: Warren LeMay, CC BY-SA 2.0',
    openHouse: 'Open house Saturday, 2:00 to 4:00 pm',
    mapQuery: '12 Example Lane, Riverton',       // opens in the visitor's maps app
  },

  agent: { name: 'Agent Name', brokerage: 'Example Realty', phone: '(555) 010-0163', email: 'agent@example.com', licence: 'Licensed sales representative' },

  accent: '#9fd8c0',

  hero: { cta: 'Book a viewing', hint: 'Scroll to look inside' },

  // The film is made from the photographs (twelve, each on screen for a twelfth of the scroll), so it fills the screen.
  film: { fit: 'cover' },

  chapters: [
    { id: 'living', frames: [46, 96], label: 'Living room', title: 'A living room built round the fire.', body: 'Brick, redwood and exposed beams, with a wall of windows onto the garden.' },
    { id: 'kitchen', frames: [104, 136], label: 'Kitchen and dining', title: 'Morning light in the kitchen.', body: 'A breakfast table under the windows, and built-in shelving in the dining room.' },
    { id: 'beds', frames: [144, 196], label: 'Bedrooms', title: 'Three quiet bedrooms.', body: 'The main bedroom has its own fireplace. The guest room looks straight out into the trees.' },
    { id: 'bath', frames: [203, 217], label: 'Bathroom', title: 'A bathroom like no other.', body: 'Redwood walls and a deep soaking tub.' },
    { id: 'close', frames: [223, 240], label: 'See it', title: 'Open house this Saturday.', body: 'Come and walk through, or book a private viewing at a time that suits.', cta: 'Book a viewing' },
  ],

  // The payment estimate. "semi-annual" compounding is the Canadian convention for fixed mortgages; use "monthly" elsewhere.
  mortgage: { title: 'What it costs a month', compounding: 'semi-annual', rate: 5.25, down: 20, years: [20, 25, 30], startYears: 25, taxPerYear: 4800,
    note: 'An estimate of principal and interest plus property tax. Ask a lender for an exact figure.' },

  contact: { title: 'Book a viewing', sub: 'Call or text the agent, or leave your details and a time that suits.', endpoint: '' },
};
