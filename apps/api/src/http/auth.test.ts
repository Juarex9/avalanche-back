import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from './auth.js';

// Minimal mock for FastifyRequest/FastifyReply
function mockRequest(headers: Record<string, string | undefined>): FastifyRequest {
  return {
    headers,
  } as FastifyRequest;
}

function mockReply(): FastifyReply {
  let statusCode = 200;
  let responseBody: unknown = undefined;
  return {
    status: function (code: number) {
      statusCode = code;
      return this as FastifyReply;
    },
    send: function (body: unknown) {
      responseBody = body;
      return this as FastifyReply;
    },
    getStatus: () => statusCode,
    getResponseBody: () => responseBody,
  } as unknown as FastifyReply;
}

describe('auth middleware', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should return 401 if no Authorization header', async () => {
    const req = mockRequest({});
    const reply = mockReply();
    await authMiddleware(req, reply);
    expect(reply.getStatus()).toBe(401);
    expect(reply.getResponseBody()).toEqual({ error: 'Missing Authorization header' });
  });

  it('should return 401 if API key invalid', async () => {
    vi.mock('../config.js', () => ({
      config: { apiKey: 'valid-key' },
    }));
    const { authMiddleware: auth } = await import('./auth.js');
    const req = mockRequest({ authorization: 'Bearer wrong-key' });
    const reply = mockReply();
    await auth(req, reply);
    expect(reply.getStatus()).toBe(401);
    expect(reply.getResponseBody()).toEqual({ error: 'Invalid API key' });
  });

  it('should pass if API key valid', async () => {
    vi.mock('../config.js', () => ({
      config: { apiKey: 'valid-key' },
    }));
    const { authMiddleware: auth } = await import('./auth.js');
    const req = mockRequest({ authorization: 'Bearer valid-key' });
    const reply = mockReply();
    await auth(req, reply);
    expect(reply.getStatus()).toBe(200);
  });
});