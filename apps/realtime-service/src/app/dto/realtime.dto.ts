export interface LockTicketsDto {
  eventId: number;
  categoryId: number;
  quantity: number;
  userId: number;
  sessionId: string;
}

export interface UnlockTicketsDto {
  eventId: number;
  categoryId: number;
  quantity: number;
  userId: number;
  sessionId: string;
}

export interface JoinEventRoomDto {
  eventId: number;
  userId: number;
}

export interface LeaveEventRoomDto {
  eventId: number;
  userId: number;
}

export interface TicketLockResponse {
  success: boolean;
  lockId?: string;
  expiresAt?: Date;
  message?: string;
  availableTickets?: number;
}

export interface TicketAvailabilityUpdate {
  eventId: number;
  categoryId: number;
  availableTickets: number;
  lockedTickets: number;
  totalTickets: number;
  timestamp: Date;
}

export interface UserSessionInfo {
  userId: number;
  sessionId: string;
  eventId: number;
  locks: TicketLock[];
  connectedAt: Date;
  lastActivity: Date;
}

export interface TicketLock {
  lockId: string;
  eventId: number;
  categoryId: number;
  quantity: number;
  userId: number;
  sessionId: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'active' | 'expired' | 'released' | 'confirmed';
}
