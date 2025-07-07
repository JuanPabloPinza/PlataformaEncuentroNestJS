// Test scenarios for Events API
// These can be used with REST clients like Postman or Insomnia

export const testScenarios = {
  // 1. Create a sample event
  createEvent: {
    method: 'POST',
    url: 'http://localhost:3000/api/events',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    },
    body: {
      eventName: "JavaScript Conference 2025",
      eventCategory: "Technology",
      description: "Annual JavaScript conference with industry experts",
      eventDate: "2025-10-15T09:00:00Z",
      location: "Convention Center, San Francisco",
      ticketCategories: [
        {
          categoryName: "Early Bird",
          price: 199.99,
          totalSeats: 100,
          description: "Limited early bird pricing"
        },
        {
          categoryName: "Regular",
          price: 299.99,
          totalSeats: 500,
          description: "Regular admission"
        },
        {
          categoryName: "VIP",
          price: 499.99,
          totalSeats: 50,
          description: "VIP access with networking dinner"
        }
      ]
    }
  },

  // 2. Get all events
  getAllEvents: {
    method: 'GET',
    url: 'http://localhost:3000/api/events',
    headers: {
      'Content-Type': 'application/json'
    }
  },

  // 3. Get upcoming events
  getUpcomingEvents: {
    method: 'GET',
    url: 'http://localhost:3000/api/events/upcoming',
    headers: {
      'Content-Type': 'application/json'
    }
  },

  // 4. Get events by category
  getEventsByCategory: {
    method: 'GET',
    url: 'http://localhost:3000/api/events/category/Technology',
    headers: {
      'Content-Type': 'application/json'
    }
  },

  // 5. Get specific event
  getEventById: {
    method: 'GET',
    url: 'http://localhost:3000/api/events/1',
    headers: {
      'Content-Type': 'application/json'
    }
  },

  // 6. Get ticket categories for an event
  getTicketCategories: {
    method: 'GET',
    url: 'http://localhost:3000/api/events/1/tickets',
    headers: {
      'Content-Type': 'application/json'
    }
  },

  // 7. Reserve tickets
  reserveTickets: {
    method: 'POST',
    url: 'http://localhost:3000/api/events/tickets/reserve',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    },
    body: {
      eventId: 1,
      categoryId: 1,
      quantity: 2
    }
  },

  // 8. Update event
  updateEvent: {
    method: 'PUT',
    url: 'http://localhost:3000/api/events/1',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    },
    body: {
      eventName: "Updated JavaScript Conference 2025",
      description: "Updated description with new speakers",
      location: "Updated location"
    }
  },

  // 9. Release tickets
  releaseTickets: {
    method: 'POST',
    url: 'http://localhost:3000/api/events/tickets/release',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    },
    body: {
      categoryId: 1,
      quantity: 1
    }
  }
};

// Sample test flow
export const testFlow = [
  "1. First register a user: POST /api/auth/register",
  "2. Login to get JWT token: POST /api/auth/login",
  "3. Create an event: POST /api/events (with JWT token)",
  "4. Get all events: GET /api/events",
  "5. Get specific event: GET /api/events/{id}",
  "6. Get ticket categories: GET /api/events/{id}/tickets",
  "7. Reserve tickets: POST /api/events/tickets/reserve (with JWT token)",
  "8. Check updated availability: GET /api/events/{id}/tickets",
  "9. Release some tickets: POST /api/events/tickets/release (with JWT token)",
  "10. Update event: PUT /api/events/{id} (with JWT token)"
];

export const sampleEventData = {
  musicFestival: {
    eventName: "Summer Music Festival 2025",
    eventCategory: "Music",
    description: "Three-day music festival featuring top artists",
    eventDate: "2025-07-20T17:00:00Z",
    location: "Central Park, New York",
    ticketCategories: [
      { categoryName: "Platinum", price: 399.99, totalSeats: 50, description: "Backstage access + VIP lounge" },
      { categoryName: "Gold", price: 249.99, totalSeats: 200, description: "Premium seating + drinks" },
      { categoryName: "Silver", price: 149.99, totalSeats: 500, description: "Great view + parking" },
      { categoryName: "General", price: 79.99, totalSeats: 2000, description: "General admission" }
    ]
  },

  techConference: {
    eventName: "AI & Machine Learning Summit 2025",
    eventCategory: "Technology",
    description: "Leading AI conference with industry experts",
    eventDate: "2025-09-10T09:00:00Z",
    location: "Convention Center, Seattle",
    ticketCategories: [
      { categoryName: "Conference + Workshop", price: 599.99, totalSeats: 100, description: "Full access + hands-on workshops" },
      { categoryName: "Conference Only", price: 299.99, totalSeats: 500, description: "Conference sessions only" },
      { categoryName: "Student", price: 99.99, totalSeats: 100, description: "Student discount rate" }
    ]
  },

  sportsEvent: {
    eventName: "Championship Football Game",
    eventCategory: "Sports",
    description: "Final championship game of the season",
    eventDate: "2025-12-15T18:00:00Z",
    location: "Stadium Arena, Dallas",
    ticketCategories: [
      { categoryName: "Field Level", price: 199.99, totalSeats: 100, description: "Closest to the action" },
      { categoryName: "Lower Bowl", price: 149.99, totalSeats: 500, description: "Excellent view" },
      { categoryName: "Upper Bowl", price: 79.99, totalSeats: 1000, description: "Good view, great value" },
      { categoryName: "Nosebleeds", price: 39.99, totalSeats: 2000, description: "Affordable option" }
    ]
  }
};
