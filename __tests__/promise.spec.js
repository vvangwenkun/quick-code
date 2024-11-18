const Promise = require('../lib/promise');

describe('Promise', () => {
  test('new Promise', () => {
    const p = new Promise((resolve, reject) => {});

    expect(typeof p.then).toBe('function');
    expect(typeof p.catch).toBe('function');
  });

  test('Attempt to modify state', async () => {
    const p = new Promise((resolve, reject) => resolve(10));

    p.state = 'loading'

    await expect(p).resolves.toBe(10);
  });

  test('.then(onFulfilled)', async () => {
    const p = new Promise((resolve) => resolve(2));

    const fn = jest.fn();
    p.catch(fn);

    await expect(p).resolves.toBe(2);
    expect(fn).not.toBeCalled();
    await expect(p.then((v) => v * v).then((v) => v * v)).resolves.toBe(16);
  });

  test('.then(null, onRejected)', async () => {
    const p = new Promise((resolve, reject) => reject(new Error('abort!!!')));

    const fn = jest.fn();
    p.then(fn, () => {});


    await expect(p).rejects.toThrow('abort!!!');
    expect(fn).not.toBeCalled();
    await expect(p.then(null, () => 10).then((v) => v * v)).resolves.toBe(100);
  });

  test('.catch', async () => {
    const p = new Promise((resolve, reject) => reject(new Error('abort!!!')));

    const fn = jest.fn();
    p.catch(() => {}).catch(fn);

    await expect(p).rejects.toThrow('abort!!!');
    expect(fn).not.toBeCalled();
    await expect(p.catch(() => 10).then((val) => val * val)).resolves.toBe(100);
  });
});
