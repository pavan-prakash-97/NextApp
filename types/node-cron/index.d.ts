declare module 'node-cron' {
  type ScheduledTask = {
    start(): void;
    stop(): void;
    destroy(): void;
  };
  // The scheduled function may be async so accept Promise<void> or void
  export function schedule(cronExpression: string, func: () => void | Promise<void>, options?: { scheduled?: boolean; timezone?: string }): ScheduledTask;
  const cron: { schedule: typeof schedule };
  export default cron;
}
