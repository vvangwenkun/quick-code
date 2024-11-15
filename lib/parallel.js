'use strict';

class TQ {
  queue;
  count;
  concurrency;

  constructor(concurrency) {
    this.queue = [];
    this.count = 0;
    this.concurrency = concurrency || 3;
  }

  enqueue(handler) {
    if (typeof handler !== 'function') {
      throw new Error('"handler" must be a function object')
    }

    return new Promise((resolve, reject) => {
      this.queue.push({
        handler, resolve, reject,
      });
    });
  }

  dequeue() {
    if (this.count > this.concurrency || this.queue.length <= 0) {
      return 0;
    }

    const {
      handler, resolve, reject,
    } = this.queue.shift();

    this.run(handler)
      .then(resolve)
      .catch(reject);

    return 1;
  }

  async run(handler) {
    this.count += 1;

    const reply = await handler();

    this.count -= 1;

    this.dequeue();

    return reply;
  }

  async dispatch(handler) {
    if (this.count < this.concurrency) {
      return this.run(handler);
    }

    return this.enqueue(handler);
  }
}

/**
 * Run the tasks collection of functions in parallel.
 * @param {Array.<() => Promise<any>>} tasks A collection of async functions to run.
 * @param {number} [concurrency]  The maximum number of async operations at a time.
 * @returns Promise<any[]>
 */
module.exports = async function(tasks, concurrency) {
  if (!Array.isArray(tasks)) {
    throw new Error('tasks" must be an array');
  }

  tasks.forEach((task, index) => {
    if (typeof task !== 'function') {
      throw new Error(`"tasks[${index}]" must be a function object`);
    }
  });

  const taskQueue = new TQ(concurrency || Infinity);

  return Promise.all(tasks.map((task) => taskQueue.dispatch(task)));
}
