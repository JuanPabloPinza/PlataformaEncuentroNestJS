export class CreateOrderDto {
  userId: number;
  eventId: number;
  categoryId: number;
  quantity: number;
  notes?: string;
}

export class UpdateOrderStatusDto {
  status: string;
  notes?: string;
}

export class OrderResponseDto {
  id: string; // Changed to string to handle CockroachDB's large integers
  userId: number;
  eventId: number;
  categoryId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  eventName: string;
  categoryName: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
