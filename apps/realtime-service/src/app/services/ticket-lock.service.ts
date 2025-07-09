import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { TicketLock, LockTicketsDto, UnlockTicketsDto, TicketLockResponse } from '../dto/realtime.dto';
import { v4 as uuidv4 } from 'uuid';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TicketLockService {
  private locks: Map<string, TicketLock> = new Map();
  private userLocks: Map<number, Set<string>> = new Map();
  private categoryLocks: Map<string, Set<string>> = new Map();
  
  // Lock duration in milliseconds (5 minutes)
  private readonly LOCK_DURATION = 5 * 60 * 1000;

  constructor(
    @Inject('EVENTS_SERVICE_CLIENT') private readonly eventsClient: ClientProxy,
  ) {
    // Clean up expired locks every minute
    setInterval(() => {
      this.cleanupExpiredLocks();
    }, 60 * 1000);
  }

  async lockTickets(lockDto: LockTicketsDto): Promise<TicketLockResponse> {
    console.log('🔒 [Realtime Service] Attempting to lock tickets:', lockDto);

    const categoryKey = `${lockDto.eventId}_${lockDto.categoryId}`;
    
    // Check if user already has locks for this category
    const existingLock = this.getUserLockForCategory(lockDto.userId, lockDto.eventId, lockDto.categoryId);
    if (existingLock) {
      console.log('⚠️ [Realtime Service] User already has a lock for this category');
      return {
        success: false,
        message: 'You already have tickets locked for this category'
      };
    }

    // Get current locked quantity for this category
    const currentLocked = this.getLockedQuantityForCategory(lockDto.eventId, lockDto.categoryId);
    
    // Get real available tickets from events-service
    let availableTickets = 0;
    try {
      console.log('📡 [Realtime Service] Fetching ticket categories from events-service...');
      const ticketCategories = await firstValueFrom(
        this.eventsClient.send('get-ticket-categories', lockDto.eventId)
      );

      const category = ticketCategories.find((cat: any) => cat.id === lockDto.categoryId);
      if (!category) {
        console.log('❌ [Realtime Service] Ticket category not found');
        return {
          success: false,
          message: 'Ticket category not found'
        };
      }

      availableTickets = category.availableSeats;
      console.log('📊 [Realtime Service] Available tickets:', availableTickets, 'Currently locked:', currentLocked);
    } catch (error) {
      console.error('❌ [Realtime Service] Failed to fetch ticket availability:', error);
      return {
        success: false,
        message: 'Failed to verify ticket availability'
      };
    }
    
    if (currentLocked + lockDto.quantity > availableTickets) {
      console.log('❌ [Realtime Service] Not enough tickets available to lock');
      return {
        success: false,
        message: `Only ${availableTickets - currentLocked} tickets available`,
        availableTickets: availableTickets - currentLocked
      };
    }

    // Create the lock
    const lockId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.LOCK_DURATION);

    const lock: TicketLock = {
      lockId,
      eventId: lockDto.eventId,
      categoryId: lockDto.categoryId,
      quantity: lockDto.quantity,
      userId: lockDto.userId,
      sessionId: lockDto.sessionId,
      createdAt: now,
      expiresAt,
      status: 'active'
    };

    // Store the lock
    this.locks.set(lockId, lock);

    // Track user locks
    if (!this.userLocks.has(lockDto.userId)) {
      this.userLocks.set(lockDto.userId, new Set());
    }
    this.userLocks.get(lockDto.userId)!.add(lockId);

    // Track category locks
    if (!this.categoryLocks.has(categoryKey)) {
      this.categoryLocks.set(categoryKey, new Set());
    }
    this.categoryLocks.get(categoryKey)!.add(lockId);

    console.log('✅ [Realtime Service] Tickets locked successfully:', lockId);

    return {
      success: true,
      lockId,
      expiresAt,
      availableTickets: availableTickets - currentLocked - lockDto.quantity
    };
  }

  async unlockTickets(unlockDto: UnlockTicketsDto): Promise<boolean> {
    console.log('🔓 [Realtime Service] Attempting to unlock tickets:', unlockDto);

    const userLocks = this.userLocks.get(unlockDto.userId);
    if (!userLocks) {
      console.log('⚠️ [Realtime Service] No locks found for user');
      return false;
    }

    // Find the lock for this category
    for (const lockId of userLocks) {
      const lock = this.locks.get(lockId);
      if (lock && 
          lock.eventId === unlockDto.eventId && 
          lock.categoryId === unlockDto.categoryId &&
          lock.status === 'active') {
        
        this.releaseLock(lockId);
        console.log('✅ [Realtime Service] Tickets unlocked successfully:', lockId);
        return true;
      }
    }

    console.log('⚠️ [Realtime Service] No matching lock found to unlock');
    return false;
  }

  getUserLocks(userId: number): TicketLock[] {
    const userLockIds = this.userLocks.get(userId);
    if (!userLockIds) return [];

    return Array.from(userLockIds)
      .map(lockId => this.locks.get(lockId))
      .filter(lock => lock && lock.status === 'active') as TicketLock[];
  }

  getLockedQuantityForCategory(eventId: number, categoryId: number): number {
    const categoryKey = `${eventId}_${categoryId}`;
    const categoryLockIds = this.categoryLocks.get(categoryKey);
    
    if (!categoryLockIds) return 0;

    let totalLocked = 0;
    for (const lockId of categoryLockIds) {
      const lock = this.locks.get(lockId);
      if (lock && lock.status === 'active' && lock.expiresAt > new Date()) {
        totalLocked += lock.quantity;
      }
    }

    return totalLocked;
  }

  async getAvailableTicketsWithLocks(eventId: number, categoryId: number): Promise<number> {
    try {
      const ticketCategories = await firstValueFrom(
        this.eventsClient.send('get-ticket-categories', eventId)
      );

      const category = ticketCategories.find((cat: any) => cat.id === categoryId);
      if (!category) {
        return 0;
      }

      const currentLocked = this.getLockedQuantityForCategory(eventId, categoryId);
      return Math.max(0, category.availableSeats - currentLocked);
    } catch (error) {
      console.error('❌ [Realtime Service] Failed to fetch ticket availability:', error);
      return 0;
    }
  }

  confirmLock(lockId: string): boolean {
    const lock = this.locks.get(lockId);
    if (!lock || lock.status !== 'active') {
      return false;
    }

    lock.status = 'confirmed';
    console.log('✅ [Realtime Service] Lock confirmed:', lockId);
    return true;
  }

  releaseLock(lockId: string): boolean {
    const lock = this.locks.get(lockId);
    if (!lock) return false;

    lock.status = 'released';
    
    // Remove from tracking maps
    const userLocks = this.userLocks.get(lock.userId);
    if (userLocks) {
      userLocks.delete(lockId);
      if (userLocks.size === 0) {
        this.userLocks.delete(lock.userId);
      }
    }

    const categoryKey = `${lock.eventId}_${lock.categoryId}`;
    const categoryLocks = this.categoryLocks.get(categoryKey);
    if (categoryLocks) {
      categoryLocks.delete(lockId);
      if (categoryLocks.size === 0) {
        this.categoryLocks.delete(categoryKey);
      }
    }

    // Remove the lock after a delay to allow for any final operations
    setTimeout(() => {
      this.locks.delete(lockId);
    }, 30000); // 30 seconds

    console.log('🔓 [Realtime Service] Lock released:', lockId);
    return true;
  }

  releaseUserLocks(userId: number, sessionId?: string): number {
    const userLocks = this.userLocks.get(userId);
    if (!userLocks) return 0;

    let releasedCount = 0;
    const locksToRelease = Array.from(userLocks);

    for (const lockId of locksToRelease) {
      const lock = this.locks.get(lockId);
      if (lock && 
          (sessionId ? lock.sessionId === sessionId : true) &&
          lock.status === 'active') {
        this.releaseLock(lockId);
        releasedCount++;
      }
    }

    console.log(`🔓 [Realtime Service] Released ${releasedCount} locks for user ${userId}`);
    return releasedCount;
  }

  private getUserLockForCategory(userId: number, eventId: number, categoryId: number): TicketLock | null {
    const userLocks = this.userLocks.get(userId);
    if (!userLocks) return null;

    for (const lockId of userLocks) {
      const lock = this.locks.get(lockId);
      if (lock && 
          lock.eventId === eventId && 
          lock.categoryId === categoryId &&
          lock.status === 'active') {
        return lock;
      }
    }

    return null;
  }

  private cleanupExpiredLocks(): void {
    const now = new Date();
    let expiredCount = 0;

    for (const [lockId, lock] of this.locks) {
      if (lock.status === 'active' && lock.expiresAt <= now) {
        lock.status = 'expired';
        this.releaseLock(lockId);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      console.log(`🧹 [Realtime Service] Cleaned up ${expiredCount} expired locks`);
    }
  }

  // Statistics methods
  getStats(): any {
    const activeLocks = Array.from(this.locks.values()).filter(lock => lock.status === 'active');
    
    return {
      totalLocks: this.locks.size,
      activeLocks: activeLocks.length,
      usersWithLocks: this.userLocks.size,
      categoriesWithLocks: this.categoryLocks.size,
      locksByStatus: {
        active: activeLocks.length,
        expired: Array.from(this.locks.values()).filter(lock => lock.status === 'expired').length,
        confirmed: Array.from(this.locks.values()).filter(lock => lock.status === 'confirmed').length,
        released: Array.from(this.locks.values()).filter(lock => lock.status === 'released').length,
      }
    };
  }
}
