// Ruta de archivo: PlataformaEncuentroNestJS/apps/api-gateway/src/app/events/dto/events.dto.ts
export class CreateTicketCategoryDto {
  categoryName: string;
  price: number;
  totalSeats: number;
  description?: string;
}

export class UpdateTicketCategoryDto {
  categoryName?: string;
  price?: number;
  totalSeats?: number;
  description?: string;
  isActive?: boolean;
}

export class UserContextDto {
  userId: number;
  username: string;
  role: string;
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
  eventDate?: Date; // ISO date string
  location?: string;
  isActive?: boolean;
  ticketCategories?: UpdateTicketCategoryDto[];
  userContext: UserContextDto;
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
