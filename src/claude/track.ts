import { randomUUID } from "crypto";

export interface TrackingMeta {
    id: string;
    timestamp: Date;
    durationMs: number;
}

export interface TrackingSuccess<T> extends TrackingMeta {
    status: "success";
    result: T;
}

export interface TrackingError extends TrackingMeta {
    status: "error";
    error: string;
}

export type TrackingOutcome<T> = TrackingSuccess<T> | TrackingError;

export const track = async <T>(
    fn: (meta: TrackingMeta) => Promise<T>,
): Promise<TrackingOutcome<T>> => {
    const id = randomUUID();
    const timestamp = new Date();
    const startTime = Date.now();
    const meta: TrackingMeta = { id, timestamp, durationMs: 0 };

    try {
        const result = await fn(meta);
        return { id, timestamp, durationMs: Date.now() - startTime, status: "success", result };
    } catch (err) {
        return {
            id,
            timestamp,
            durationMs: Date.now() - startTime,
            status: "error",
            error: err instanceof Error ? err.message : String(err),
        };
    }
};
