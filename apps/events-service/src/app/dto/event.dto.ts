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
  eventDate: Date;
  location?: string;
  ticketCategories: CreateTicketCategoryDto[];
}

export class UpdateEventDto {
  eventName?: string;
  eventCategory?: string;
  description?: string;
  eventDate?: Date;
  location?: string;
  isActive?: boolean;
}

export class UpdateTicketCategoryDto {
  categoryName?: string;
  price?: number;
  totalSeats?: number;
  description?: string;
  isActive?: boolean;
}

export class ReserveTicketsDto {
  eventId: number;
  categoryId: number;
  quantity: number;
  userId?: number; // Optional for tracking who reserved
}
