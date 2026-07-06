import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  HttpSubmitter,
  PlaceholderSubmitter,
  SUBMIT_TIMEOUT_MS,
  createRegistrationSubmitter,
} from './submitter';
import type { RegistrationPayload } from './validation';

/**
 * Example/unit tests for the configurable registration submitter.
 *
 * Validates: Requirements 10.2, 10.7
 *
 * - 10.2: a valid submission resolves to a success result.
 * - 10.7: a submission that fails, is rejected, or exceeds the 30s timeout
 *         resolves to a failure result (and exceptions never escape).
 */

const payload: RegistrationPayload = {
  fullName: 'Maria Silva',
  email: 'maria@example.com',
  phoneDigits: '47999998888',
  company: 'Navecon',
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('createRegistrationSubmitter (endpoint selection)', () => {
  it('returns an HttpSubmitter when given a non-empty endpoint', () => {
    const submitter = createRegistrationSubmitter('https://example.com/submit');
    expect(submitter).toBeInstanceOf(HttpSubmitter);
  });

  it('returns a PlaceholderSubmitter when the endpoint is undefined', () => {
    const submitter = createRegistrationSubmitter(undefined);
    expect(submitter).toBeInstanceOf(PlaceholderSubmitter);
  });

  it('returns a PlaceholderSubmitter when the endpoint is an empty/whitespace string', () => {
    expect(createRegistrationSubmitter('')).toBeInstanceOf(PlaceholderSubmitter);
    expect(createRegistrationSubmitter('   ')).toBeInstanceOf(PlaceholderSubmitter);
  });
});

describe('HttpSubmitter', () => {
  it('resolves { ok: true } and POSTs JSON when fetch responds ok (Req 10.2)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    const endpoint = 'https://example.com/submit';
    const submitter = new HttpSubmitter(endpoint);
    const controller = new AbortController();

    const result = await submitter.submit(payload, controller.signal);

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [calledUrl, opts] = fetchMock.mock.calls[0];
    expect(calledUrl).toBe(endpoint);
    expect(opts.method).toBe('POST');
    expect(opts.headers['Content-Type']).toBe('application/json');
    expect(opts.body).toBe(JSON.stringify(payload));
    expect(opts.signal).toBeInstanceOf(AbortSignal);
  });

  it('resolves { ok: false } with a reason containing the status on non-OK (Req 10.7)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal('fetch', fetchMock);

    const submitter = new HttpSubmitter('https://example.com/submit');
    const result = await submitter.submit(payload, new AbortController().signal);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain('500');
    }
  });

  it('resolves { ok: false } with a reason when fetch rejects with a network error (Req 10.7)', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    vi.stubGlobal('fetch', fetchMock);

    const submitter = new HttpSubmitter('https://example.com/submit');
    const result = await submitter.submit(payload, new AbortController().signal);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('network down');
    }
  });

  it('maps an AbortError rejection to reason "aborted" (Req 10.7)', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValue(new DOMException('Aborted', 'AbortError'));
    vi.stubGlobal('fetch', fetchMock);

    const submitter = new HttpSubmitter('https://example.com/submit');
    const result = await submitter.submit(payload, new AbortController().signal);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('aborted');
    }
  });
});

describe('PlaceholderSubmitter', () => {
  it('resolves { ok: true } and logs the payload via console.info (Req 10.2)', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const submitter = new PlaceholderSubmitter();
    const result = await submitter.submit(payload, new AbortController().signal);

    expect(result).toEqual({ ok: true });
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledWith(expect.any(String), payload);
  });

  it('resolves { ok: false, reason: "aborted" } when the signal is already aborted', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const controller = new AbortController();
    controller.abort();

    const submitter = new PlaceholderSubmitter();
    const result = await submitter.submit(payload, controller.signal);

    expect(result).toEqual({ ok: false, reason: 'aborted' });
    // Must NOT log a spurious success when aborted.
    expect(infoSpy).not.toHaveBeenCalled();
  });
});

describe('HttpSubmitter 30s timeout/abort behavior (Req 10.7)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('aborts and resolves { ok: false } after SUBMIT_TIMEOUT_MS elapses', async () => {
    // fetch never resolves on its own, but rejects when its signal aborts —
    // mimicking the browser aborting an in-flight request.
    const fetchMock = vi.fn(
      (_url: string, opts: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          opts.signal.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const submitter = new HttpSubmitter('https://example.com/submit');
    const controller = new AbortController();

    const submitPromise = submitter.submit(payload, controller.signal);

    // Advance past the 30s timeout → withTimeout's setTimeout fires →
    // internal controller aborts → combined signal aborts → fetch rejects.
    vi.advanceTimersByTime(SUBMIT_TIMEOUT_MS);

    const result = await submitPromise;

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('aborted');
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
