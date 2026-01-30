import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const queueRouter = router({
  /**
   * Get queue statistics
   */
  getStats: protectedProcedure.query(async () => {
    try {
      const { whatsappQueue } = await import("../queues/whatsappQueue");
      
      const [waiting, active, completed, failed] = await Promise.all([
        whatsappQueue.getWaitingCount(),
        whatsappQueue.getActiveCount(),
        whatsappQueue.getCompletedCount(),
        whatsappQueue.getFailedCount(),
      ]);

      return {
        waiting,
        active,
        completed,
        failed,
      };
    } catch (error) {
      console.error("[Queue Router] Failed to get stats:", error);
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
      };
    }
  }),

  /**
   * Get recent jobs
   */
  getRecentJobs: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      try {
        const { whatsappQueue } = await import("../queues/whatsappQueue");
        
        // Get jobs from different states
        const [completed, failed, active, waiting] = await Promise.all([
          whatsappQueue.getJobs(["completed"], 0, input.limit / 4),
          whatsappQueue.getJobs(["failed"], 0, input.limit / 4),
          whatsappQueue.getJobs(["active"], 0, input.limit / 4),
          whatsappQueue.getJobs(["waiting"], 0, input.limit / 4),
        ]);

        const allJobs = [...completed, ...failed, ...active, ...waiting];

        // Sort by timestamp descending
        allJobs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        // Format jobs
        const formattedJobs = await Promise.all(
          allJobs.slice(0, input.limit).map(async (job) => ({
            id: job.id,
            phone: job.data.to,
            templateName: job.data.templateName,
            bookingType: job.data.metadata?.bookingType || null,
            patientName: job.data.metadata?.patientName || null,
            state: await job.getState(),
            timestamp: job.timestamp || Date.now(),
            attempts: job.attemptsMade,
            error: job.failedReason || null,
          }))
        );

        return formattedJobs;
      } catch (error) {
        console.error("[Queue Router] Failed to get recent jobs:", error);
        return [];
      }
    }),
});
