export class CreateTicketCategoryDto {
  categoryName: string;
  price: number;
  totalSeats: number;
  description?: string;
}

export class CreateEventDto {
  eventName: string;
  eventCategory: string;
  description?: string;
  eventDate: string; // ISO date string
  location?: string;
  ticketCategories: CreateTicketCategoryDto[];
}

export class UpdateEventDto {
  eventName?: string;
  eventCategory?: string;
  description?: string;
  eventDate?: string; // ISO date string
  location?: string;
  isActive?: boolean;
}

export class ReserveTicketsDto {
  eventId: number;
  categoryId: number;
  quantity: number;
}

export class ReleaseTicketsDto {
  categoryId: number;
  quantity: number;
}
