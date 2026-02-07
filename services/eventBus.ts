// Event Bus - Pub/Sub Pattern for Cross-Module Communication
// Enables real-time updates across the application

export type EventType =
    // Invoice Events
    | 'invoice.created'
    | 'invoice.updated'
    | 'invoice.approved'
    | 'invoice.rejected'
    | 'invoice.paid'
    | 'invoice.disputed'

    // Contract Events
    | 'contract.created'
    | 'contract.updated'
    | 'contract.expiring'
    | 'contract.amended'
    | 'contract.expired'
    | 'contract.vendor.updated'
    | 'contract.utilization.changed'
    | 'contract.fuel.rule.changed'

    // Vendor/Scorecard Events
    | 'incident.created'
    | 'incident.resolved'
    | 'duplicate.detected'
    | 'scorecard.updated'

    // Supplier Events
    | 'supplier.created'
    | 'supplier.updated'
    | 'supplier.deleted'

    // Rate Events
    | 'rate.created'
    | 'rate.updated'
    | 'rate.review.required'
    | 'rate.deactivate'
    | 'rate.fuel.recalculate'
    | 'rate.optimization.suggestion'
    | 'rate.accessorial.updated'
    | 'rate.suggestion'

    // Fuel Events
    | 'fuel.price.updated'
    | 'fuel.rule.changed'

    // Lane Events
    | 'lane.created'
    | 'lane.optimized'
    | 'lane.reoptimize'
    | 'lane.cluster.suggestion'

    // Location Events
    | 'location.zone.changed'
    | 'location.cluster.generated'

    // Vehicle Events
    | 'vehicle.created'
    | 'vehicle.available'

    // Accessorial Events
    | 'accessorial.created'
    | 'accessorial.updated'
    | 'accessorial.available'

    // Workflow Events
    | 'workflow.stepCompleted'
    | 'workflow.approved'
    | 'workflow.rejected';

export interface EventPayload {
    [key: string]: any;
}

type EventHandler = (payload: EventPayload) => void;

interface EventSubscription {
    id: string;
    event: EventType;
    handler: EventHandler;
}

/**
 * Event Bus
 * 
 * Centralized pub/sub system for cross-module communication.
 * Enables loose coupling and real-time updates.
 * 
 * @example
 * ```typescript
 * // Subscribe to events
 * EventBus.on('invoice.approved', (payload) => {
 *   console.log('Invoice approved:', payload.invoiceId);
 *   VendorScorecardService.updateAccuracy(payload.vendorId);
 * });
 * 
 * // Emit events
 * EventBus.emit('invoice.approved', {
 *   invoiceId: 'INV-001',
 *   vendorId: 'V-001',
 *   amount: 10000
 * });
 * ```
 */
class EventBusClass {
    private subscriptions: EventSubscription[] = [];
    private subscriptionIdCounter = 0;
    private eventLog: { event: EventType; payload: EventPayload; timestamp: string }[] = [];
    private maxLogSize = 100;

    /**
     * Subscribe to an event
     * Returns subscription ID for later unsubscription
     */
    on(event: EventType, handler: EventHandler): string {
        const id = `sub-${++this.subscriptionIdCounter}`;

        this.subscriptions.push({
            id,
            event,
            handler
        });

        console.log(`📡 EventBus: Subscribed to '${event}' (ID: ${id})`);
        return id;
    }

    /**
     * Subscribe to an event once (auto-unsubscribe after first trigger)
     */
    once(event: EventType, handler: EventHandler): string {
        const wrappedHandler = (payload: EventPayload) => {
            handler(payload);
            this.off(subscriptionId);
        };

        const subscriptionId = this.on(event, wrappedHandler);
        return subscriptionId;
    }

    /**
     * Emit an event to all subscribers
     */
    emit(event: EventType, payload: EventPayload = {}): void {
        const timestamp = new Date().toISOString();

        // Log event
        this.eventLog.push({ event, payload, timestamp });
        if (this.eventLog.length > this.maxLogSize) {
            this.eventLog.shift(); // Remove oldest
        }

        // Find all subscribers for this event
        const subscribers = this.subscriptions.filter(sub => sub.event === event);

        if (subscribers.length === 0) {
            console.warn(`⚠️ EventBus: No subscribers for '${event}'`);
            return;
        }

        console.log(`📤 EventBus: Emitting '${event}' to ${subscribers.length} subscriber(s)`, payload);

        // Call all handlers
        subscribers.forEach(sub => {
            try {
                sub.handler(payload);
            } catch (error) {
                console.error(`❌ EventBus: Error in handler for '${event}':`, error);
            }
        });
    }

    /**
     * Unsubscribe from an event by subscription ID
     */
    off(subscriptionId: string): void {
        const index = this.subscriptions.findIndex(sub => sub.id === subscriptionId);

        if (index !== -1) {
            const sub = this.subscriptions[index];
            this.subscriptions.splice(index, 1);
            console.log(`📡 EventBus: Unsubscribed from '${sub.event}' (ID: ${subscriptionId})`);
        } else {
            console.warn(`⚠️ EventBus: Subscription ID '${subscriptionId}' not found`);
        }
    }

    /**
     * Unsubscribe all handlers for a specific event
     */
    offAll(event: EventType): void {
        const count = this.subscriptions.filter(sub => sub.event === event).length;
        this.subscriptions = this.subscriptions.filter(sub => sub.event !== event);
        console.log(`📡 EventBus: Removed ${count} subscription(s) for '${event}'`);
    }

    /**
     * Clear all subscriptions
     */
    clear(): void {
        const count = this.subscriptions.length;
        this.subscriptions = [];
        console.log(`📡 EventBus: Cleared ${count} subscription(s)`);
    }

    /**
     * Get all active subscriptions
     */
    getSubscriptions(): EventSubscription[] {
        return [...this.subscriptions];
    }

    /**
     * Get event log (last N events)
     */
    getEventLog(limit: number = 50): typeof this.eventLog {
        return this.eventLog.slice(-limit);
    }

    /**
     * Get subscription count for an event
     */
    getSubscriberCount(event: EventType): number {
        return this.subscriptions.filter(sub => sub.event === event).length;
    }

    /**
     * Check if an event has any subscribers
     */
    hasSubscribers(event: EventType): boolean {
        return this.getSubscriberCount(event) > 0;
    }

    /**
     * Debug: Log all subscriptions
     */
    debug(): void {
        console.group('📡 EventBus Debug');
        console.log('Total Subscriptions:', this.subscriptions.length);
        console.log('Event Log Size:', this.eventLog.length);

        // Group by event type
        const byEvent: Record<string, number> = {};
        this.subscriptions.forEach(sub => {
            byEvent[sub.event] = (byEvent[sub.event] || 0) + 1;
        });

        console.table(byEvent);
        console.groupEnd();
    }
}

// Export singleton instance
export const EventBus = new EventBusClass();

// Export class for testing
export { EventBusClass };

// Helper: Create typed event emitter
export function createEventEmitter<T extends EventType>(event: T) {
    return (payload: EventPayload) => EventBus.emit(event, payload);
}

// Helper: Create typed event listener
export function createEventListener<T extends EventType>(event: T, handler: EventHandler) {
    return EventBus.on(event, handler);
}
