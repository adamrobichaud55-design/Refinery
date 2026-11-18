// One listing, one file. Everything the page says about the property and the agent is here: change it, save, done.
//
// The tour in this demo is built from a freely available capture of a real apartment (see CREDITS.md), so that it
// looks like the finished thing. That apartment is NOT for sale: the address, price and every detail below are made
// up. For a real listing, put in its details, and build the tour from the client's own video or photographs.
window.SITE = {
  listing: {
    address: '5B, 12 Example Street',
    town: 'Riverton',
    status: 'For sale',
    price: 729000,
    currency: '$',
    id: 'Listing ID 000000',
    summary: 'A bright pre-war two-bedroom with a separate office, high above the street.',
    facts: [['2', 'Bedrooms'], ['1', 'Bathroom'], ['1,150', 'Square feet'], ['5th', 'Floor'], ['1928', 'Built']],
    description: [
      'A classic pre-war layout: every room opens off a central hallway, with oak floors, high ceilings and tall windows throughout. The living room faces south and takes the sun all afternoon.',
      'The kitchen has been opened to the dining room, there is a separate home office by the entrance, and both bedrooms sit at the quiet end of the hall.',
    ],
    features: ['Original oak floors', 'South-facing living room', 'Kitchen open to the dining room', 'Separate home office', 'Two bedrooms at the quiet end', 'Lift building'],
    rooms: [['Living room', '5th', '19 × 14 ft'], ['Kitchen', '5th', '12 × 9 ft'], ['Dining room', '5th', '13 × 11 ft'], ['Main bedroom', '5th', '15 × 12 ft'], ['Second bedroom', '5th', '12 × 10 ft'], ['Home office', '5th', '11 × 9 ft']],
    photos: ['photos/1.webp', 'photos/2.webp', 'photos/3.webp', 'photos/4.webp', 'photos/5.webp', 'photos/6.webp', 'photos/7.webp', 'photos/8.webp'],
    photoNote: 'Sample pictures from the Zip-NeRF "nyc" capture (Barron et al., Google Research). The apartment is not for sale. The address, price and details on this page are made up.',
    photoCredit: 'Tour and pictures: Zip-NeRF dataset',
    openHouse: 'Open house Saturday, 2:00 to 4:00 pm',
    mapQuery: 'Riverton',
  },

  agent: { name: 'Agent Name', brokerage: 'Example Realty', phone: '(555) 010-0163', email: 'agent@example.com', licence: 'Licensed sales representative' },

  accent: '#9fd8c0',

  hero: { cta: 'Book a viewing', hint: 'Scroll to walk through' },

  // The words for the tour. The tour itself is in walk/ (built from the client's video or photographs). When it is
  // built from a video, the rooms along it are named automatically; give each name its words here. A name with no
  // entry is shown on its own. (A tour built by build_tour.py can instead be given words in order, under "tour".)
  rooms: {
    'home office': { label: 'Home office', title: 'A room to work in.', body: 'Just off the entrance, with its own window and a door that closes.' },
    'hallway': { label: 'Hallway', title: 'Every room opens off the hall.', body: 'The classic pre-war plan: no room is a corridor to another.' },
    'living room': { label: 'Living room', title: 'Sun all afternoon.', body: 'Three tall south-facing windows and room for a proper sofa.' },
    'kitchen': { label: 'Kitchen', title: 'A kitchen you can cook in.', body: 'Stone counters, full-size appliances and space for two.' },
    'dining room': { label: 'Dining room', title: 'Open to the kitchen.', body: 'A table for six by the windows, with shelving along the wall.' },
    'bedroom': { label: 'Bedroom', title: 'Quiet at the end of the hall.', body: 'Both bedrooms face away from the street.' },
    'bathroom': { label: 'Bathroom', title: 'A windowed bathroom.', body: 'Full bath with the original tile.' },
  },

  // The payment estimate. "semi-annual" compounding is the Canadian convention for fixed mortgages; use "monthly" elsewhere.
  mortgage: { title: 'What it costs a month', compounding: 'semi-annual', rate: 5.25, down: 20, years: [20, 25, 30], startYears: 25, taxPerYear: 4800,
    note: 'An estimate of principal and interest plus property tax. Ask a lender for an exact figure.' },

  contact: { title: 'Book a viewing', sub: 'Call or text the agent, or leave your details and a time that suits.', endpoint: '' },
};
