import { afterAll, describe, expect, it, vi } from 'vitest'
import { ExponentialBackoff } from './exponential-backoff'
import { delayAsync } from '../test-helpers/delay-async'
import { Subscription } from 'rxjs'

describe('exponential backoff', () => {
  const subscription = new Subscription()

  it('should emit withBackoff$ observable', async () => {
    const backoff = ExponentialBackoff({
      maxDelayTime: 2000,
      multiplier: 2,
      interval: 1000,
    })

    const spy = vi.fn()

    subscription.add(
      backoff.withBackoff$.subscribe(() => {
        spy()
        backoff.trigger.next()
      }),
    )

    await delayAsync(4500)

    expect(spy).toHaveBeenCalledTimes(3)
  })

  it('should emit error after timeout', async () => {
    const backoff = ExponentialBackoff({
      maxDelayTime: 2000,
      multiplier: 2,
      interval: 2000,
      timeout: new Date(Date.now() + 1000),
    })
    const spy = vi.fn()

    subscription.add(
      backoff.withBackoff$.subscribe((res) => {
        spy(res.isOk() ? res.value : res.error)

        backoff.trigger.next()
      }),
    )

    await delayAsync(2000)

    expect(spy).toHaveBeenCalledWith(0)
    expect(spy).toHaveBeenCalledWith({
      error: 'timeout',
    })
  })

  it('should emit error after stop', async () => {
    const backoff = ExponentialBackoff({})
    const spy = vi.fn()

    subscription.add(
      backoff.withBackoff$.subscribe((res) => {
        spy(res.isOk() ? res.value : res.error)
        if (res.isOk()) {
          backoff.trigger.next()
        }
      }),
    )

    await delayAsync(2000)
    backoff.stop()
    expect(spy).toHaveBeenCalledWith(0)
    expect(spy).toHaveBeenCalledWith({
      error: 'stopped',
    })
  })

  afterAll(() => {
    subscription.unsubscribe()
  })
})
