// Ruta de archivo: PlataformaEncuentroNestJS/apps/api-gateway/src/app/orders/dto/orders.dto.ts
export class CreateOrderDto {
  eventId: number;
  categoryId: number;
  quantity: number;
  notes?: string;
}

export class CreateOrderWithLockDto extends CreateOrderDto {
  lockId: string;
}

export class OrderResponseDto {
  id: number;
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
