// One listing, one file. Everything the page says about the property and the agent is here: change it, save, done.
//
// This demo uses real photographs of a real house so that it looks like the finished thing: the Paul Schweikher
// House in Schaumburg, Illinois, photographed by Warren LeMay and used under CC BY-SA 2.0 (see originals/CREDITS.md).
// The house is a museum and is NOT for sale: the address, price and every detail below are made up. For a real
// listing, put in its details and the agent's own photographs.
//
// "frames" under each chapter says which part of the walk that text belongs to, on a scale of 0 to 240
// (with twelve photographs, photograph number k is centred on frame 14 + 19.3 x (k - 1)).
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
    // The photographs for the gallery (the walk-through's own list is under "film" below).
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

  // The walk through the photographs. Each shot is a photograph, its depth map (made by tools/depth.py) and "to":
  // the spot the camera heads for, as fractions across and down the photograph. "push" (default 1) makes the camera
  // travel more or less far in that shot: lower it where things close to the camera get pulled out of shape. "land" is for wide screens and
  // "port" for upright ones (phones): the same rooms in the same order.
  film: {
    land: [
      { src: 'photos/01-exterior-lawn.webp', depth: 'depth/land-01-exterior-lawn.png', to: [0.45, 0.5] },
      { src: 'photos/02-arrival-carport.webp', depth: 'depth/land-02-arrival-carport.png', to: [0.3, 0.45] },
      { src: 'photos/03-living-room.webp', depth: 'depth/land-03-living-room.png', to: [0.6, 0.5] },
      { src: 'photos/04-living-room-sofa.webp', depth: 'depth/land-04-living-room-sofa.png', to: [0.88, 0.425] },
      { src: 'photos/05-living-room-windows.webp', depth: 'depth/land-05-living-room-windows.png', to: [0.57, 0.54] },
      { src: 'photos/06-kitchen.webp', depth: 'depth/land-06-kitchen.png', to: [0.45, 0.425] },
      { src: 'photos/07-dining-shelves.webp', depth: 'depth/land-07-dining-shelves.png', to: [0.15, 0.5] },
      { src: 'photos/08-main-bedroom.webp', depth: 'depth/land-08-main-bedroom.png', to: [0.72, 0.575] },
      { src: 'photos/09-guest-room.webp', depth: 'depth/land-09-guest-room.png', to: [0.5, 0.46] },
      { src: 'photos/10-bedroom.webp', depth: 'depth/land-10-bedroom.png', to: [0.5, 0.35] },
      { src: 'photos/11-bathroom.webp', depth: 'depth/land-11-bathroom.png', to: [0.22, 0.5] },
      { src: 'photos/12-exterior-garden.webp', depth: 'depth/land-12-exterior-garden.png', to: [0.55, 0.55] },
    ],
    port: [
      { src: 'photos-upright/01-exterior-studio-wing.webp', depth: 'depth/port-01-exterior-studio-wing.png', to: [0.45, 0.55] },
      { src: 'photos-upright/02-arrival-walkway.webp', depth: 'depth/port-02-arrival-walkway.png', to: [0.45, 0.42] },
      { src: 'photos-upright/03-living-room-piano.webp', depth: 'depth/port-03-living-room-piano.png', to: [0.653, 0.56] },
      { src: 'photos-upright/04-living-room-chairs.webp', depth: 'depth/port-04-living-room-chairs.png', to: [0.53, 0.2] },
      { src: 'photos-upright/05-hallway.webp', depth: 'depth/port-05-hallway.png', to: [0.512, 0.42] },
      { src: 'photos-upright/06-dining-shelves.webp', depth: 'depth/port-06-dining-shelves.png', to: [0.5, 0.55], push: 0.6 },
      { src: 'photos-upright/07-dining-cabinet.webp', depth: 'depth/port-07-dining-cabinet.png', to: [0.5, 0.5] },
      { src: 'photos-upright/08-main-bedroom-fireplace.webp', depth: 'depth/port-08-main-bedroom-fireplace.png', to: [0.389, 0.82] },
      { src: 'photos-upright/09-guest-room-window-seat.webp', depth: 'depth/port-09-guest-room-window-seat.png', to: [0.377, 0.5] },
      { src: 'photos-upright/10-bedroom.webp', depth: 'depth/port-10-bedroom.png', to: [0.653, 0.42] },
      { src: 'photos-upright/11-bathroom.webp', depth: 'depth/port-11-bathroom.png', to: [0.469, 0.42] },
      { src: 'photos-upright/12-exterior-studio-wing-lawn.webp', depth: 'depth/port-12-exterior-studio-wing-lawn.png', to: [0.45, 0.5] },
    ],
  },

  chapters: [
    { id: 'living', frames: [47, 97], label: 'Living room', title: 'A living room built round the fire.', body: 'Brick, redwood and exposed beams, with a wall of windows onto the garden.' },
    { id: 'kitchen', frames: [105, 136], label: 'Kitchen and dining', title: 'Morning light in the kitchen.', body: 'A breakfast table under the windows, and built-in shelving in the dining room.' },
    { id: 'beds', frames: [144, 194], label: 'Bedrooms', title: 'Three quiet bedrooms.', body: 'The main bedroom has its own fireplace. The guest room looks straight out into the trees.' },
    { id: 'bath', frames: [201, 213], label: 'Bathroom', title: 'A bathroom like no other.', body: 'Redwood walls and a deep soaking tub.' },
    { id: 'close', frames: [221, 240], label: 'See it', title: 'Open house this Saturday.', body: 'Come and walk through, or book a private viewing at a time that suits.', cta: 'Book a viewing' },
  ],

  // The payment estimate. "semi-annual" compounding is the Canadian convention for fixed mortgages; use "monthly" elsewhere.
  mortgage: { title: 'What it costs a month', compounding: 'semi-annual', rate: 5.25, down: 20, years: [20, 25, 30], startYears: 25, taxPerYear: 4800,
    note: 'An estimate of principal and interest plus property tax. Ask a lender for an exact figure.' },

  contact: { title: 'Book a viewing', sub: 'Call or text the agent, or leave your details and a time that suits.', endpoint: '' },
};
