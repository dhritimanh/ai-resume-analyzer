/**
 * Request queue to prevent concurrent API calls from overwhelming rate limits
 * Ensures only a limited number of requests run at once
 */

class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private maxConcurrent: number;

  constructor(maxConcurrent: number = 2) {
    this.maxConcurrent = maxConcurrent;
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const task = async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processNext();
        }
      };

      this.queue.push(task);
      this.processNext();
    });
  }

  private processNext() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift();
    if (task) {
      this.running++;
      task();
    }
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getRunningCount(): number {
    return this.running;
  }
}

// Global queue instance - max 2 concurrent requests to stay under the limit of 3
export const apiQueue = new RequestQueue(2);

/**
 * Wrap an API call with the queue to prevent overwhelming rate limits
 */
export async function queuedApiCall<T>(fn: () => Promise<T>): Promise<T> {
  return apiQueue.add(fn);
}
