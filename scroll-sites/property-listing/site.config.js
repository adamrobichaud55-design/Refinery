// One listing, one file. Everything the page says about the property and the agent is here: change it, save, done.
//
// This demo uses real photographs of a real house so that it looks like the finished thing: the Paul Schweikher
// House in Schaumburg, Illinois, photographed by Warren LeMay and used under CC BY-SA 2.0 (see originals/CREDITS.md).
// The house is a museum and is NOT for sale: the address, price and every detail below are made up. For a real
// listing, put in its details and the agent's own photographs.
//
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
    // The photographs for the gallery (the walk-through has its own, under "tour" below).
    photos: ['photos/01-exterior-lawn.webp', 'photos/03-living-room.webp', 'photos/04-living-room-sofa.webp', 'photos/06-kitchen.webp', 'photos/05-living-room-windows.webp', 'photos/08-main-bedroom.webp', 'photos/09-guest-room.webp',
      'photos/07-dining-shelves.webp', 'photos/10-bedroom.webp', 'photos/11-bathroom.webp', 'photos/02-arrival-carport.webp', 'photos/12-exterior-garden.webp'],
    photoNote: 'Sample photographs: the Paul Schweikher House, Schaumburg, Illinois, by Warren LeMay (CC BY-SA 2.0, Wikimedia Commons). The house is a museum and is not for sale. The address, price and details on this page are made up.',
    photoCredit: 'Photographs: Warren LeMay, CC BY-SA 2.0',
    openHouse: 'Open house Saturday, 2:00 to 4:00 pm',
    mapQuery: '12 Example Lane, Riverton',       // opens in the visitor's maps app
  },

  agent: { name: 'Agent Name', brokerage: 'Example Realty', phone: '(555) 010-0163', email: 'agent@example.com', licence: 'Licensed sales representative' },

  accent: '#9fd8c0',

  hero: { cta: 'Book a viewing', hint: 'Scroll to walk through' },

  // The words for the tour. The rooms themselves are in walk/ (made from the photographs by
  // tools/recon/build_tour.py, which lists them in walk/tour.json); give each one its words here, in the same order.
  tour: [
    { label: 'Arrival', title: 'Come in under the carport.', body: 'A long, low house of redwood and brick, set back from the road.' },
    { label: 'Living room', title: 'A living room built round the fire.', body: 'Brick, redwood and exposed beams, with a wall of windows onto the garden.' },
    { label: 'Foyer', title: 'Light from the garden side.', body: 'The foyer opens off the living room, under the same beamed ceiling.' },
    { label: 'Dining room', title: 'Through to the dining room.', body: 'Built-in shelving divides it from the kitchen behind.' },
    { label: 'Kitchen', title: 'Morning light in the kitchen.', body: 'A breakfast table under the windows.' },
    { label: 'Hallway', title: 'A glazed hallway to the bedrooms.', body: 'Windows down one side, built-in storage down the other.' },
    { label: 'Main bedroom', title: 'A fireplace of its own.', body: 'A brick hearth and a wall of fitted drawers.' },
    { label: 'Second bedroom', title: 'A second fireside room.', body: 'Day bed, hearth and redwood walls.' },
    { label: 'Third bedroom', title: 'Twin beds under the windows.', body: 'A long shelf, a reading lamp and a view to the courtyard.' },
    { label: 'Bathroom', title: 'A bathroom like no other.', body: 'Redwood walls and a deep soaking tub.' },
    { label: 'Garden', title: 'And out to the garden.', body: 'Come and walk it yourself this Saturday.', cta: 'Book a viewing' },
  ],

  // The payment estimate. "semi-annual" compounding is the Canadian convention for fixed mortgages; use "monthly" elsewhere.
  mortgage: { title: 'What it costs a month', compounding: 'semi-annual', rate: 5.25, down: 20, years: [20, 25, 30], startYears: 25, taxPerYear: 4800,
    note: 'An estimate of principal and interest plus property tax. Ask a lender for an exact figure.' },

  contact: { title: 'Book a viewing', sub: 'Call or text the agent, or leave your details and a time that suits.', endpoint: '' },
};
