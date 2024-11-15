const parallel = require('../lib/parallel');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('parallel', () => {
  test('throws if tasks is not an array', async () => {
    expect(parallel('tasks')).rejects.toThrow('must be an array');
  });

  test('throws if tasks element includes non-function object', async () => {
    expect(parallel([jest.fn(), 'string'])).rejects.toThrow('"tasks[1]" must be a function object');
  });

  test('not limit async operations at a time', async () => {
    const tasks = [jest.fn(), jest.fn(), jest.fn()];

    parallel(tasks);

    expect(tasks[0]).toBeCalled();
    expect(tasks[1]).toBeCalled();
    expect(tasks[2]).toBeCalled();
  });

  test('limit async operations at a time', async () => {
    const tasks = [
      jest.fn(async () => sleep(3000)),
      jest.fn(async () => sleep(1000)),
      jest.fn(async () => sleep(2000)),
      jest.fn(async () => sleep(100)),
    ];

    parallel(tasks, 3);

    expect(tasks[0]).toBeCalled();
    expect(tasks[1]).toBeCalled();
    expect(tasks[2]).toBeCalled();
    expect(tasks[3]).not.toBeCalled();

    await sleep(2000);

    expect(tasks[3]).toBeCalled();
  });
});
