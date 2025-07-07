// Example usage of Events Service
// This shows how to create events with different ticket categories

export const exampleEventData = {
  eventName: "Summer Music Festival 2025",
  eventCategory: "Music",
  description: "A spectacular outdoor music festival featuring top artists from around the world.",
  eventDate: new Date("2025-08-15T18:00:00Z"),
  location: "Central Park, New York",
  ticketCategories: [
    {
      categoryName: "Platinum",
      price: 299.99,
      totalSeats: 100,
      description: "Premium experience with backstage access and VIP lounge"
    },
    {
      categoryName: "Gold",
      price: 199.99,
      totalSeats: 500,
      description: "Excellent view with priority seating and complimentary drinks"
    },
    {
      categoryName: "Silver",
      price: 99.99,
      totalSeats: 1000,
      description: "Great view with comfortable seating"
    },
    {
      categoryName: "General",
      price: 49.99,
      totalSeats: 2000,
      description: "Standard admission with good view of the stage"
    }
  ]
};

// Example of how to reserve tickets
export const exampleReservation = {
  eventId: 1,
  categoryId: 2, // Gold category
  quantity: 2,
  userId: 123 // Optional: ID of the user making the reservation
};
