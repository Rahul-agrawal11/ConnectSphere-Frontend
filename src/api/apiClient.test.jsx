import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import apiClient from './apiClient';

describe('apiClient advanced coverage', () => {
  let mock;

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    mock = new MockAdapter(apiClient);
  });

  afterEach(() => {
    mock.restore();
  });

  test('apiClient base configuration exists', () => {
    expect(apiClient).toBeDefined();
    expect(apiClient.defaults.baseURL).toBe('http://localhost:8080');
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
  });

  test('request interceptor adds Authorization header when token exists', async () => {
    localStorage.setItem('accessToken', 'test-token');

    const handler = apiClient.interceptors.request.handlers[0].fulfilled;

    const config = {
      headers: {}
    };

    const result = await handler(config);

    expect(result.headers.Authorization).toBe('Bearer test-token');
  });

  test('request interceptor does not add Authorization header when token missing', async () => {
    const handler = apiClient.interceptors.request.handlers[0].fulfilled;

    const config = {
      headers: {}
    };

    const result = await handler(config);

    expect(result.headers.Authorization).toBeUndefined();
  });

  test('request interceptor rejects request error', async () => {
    const handler = apiClient.interceptors.request.handlers[0].rejected;

    const error = new Error('Request failed');

    await expect(handler(error)).rejects.toThrow('Request failed');
  });

  test('response interceptor returns successful response', async () => {
    const handler = apiClient.interceptors.response.handlers[0].fulfilled;

    const response = {
      data: {
        success: true
      }
    };

    const result = await handler(response);

    expect(result).toEqual(response);
  });

  test('response interceptor refreshes token successfully on 401', async () => {
    localStorage.setItem('refreshToken', 'old-refresh-token');

    jest.spyOn(axios, 'post').mockResolvedValue({
      data: {
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token'
        }
      }
    });

    mock.onGet('/protected').reply(200, {
      success: true
    });

    const handler = apiClient.interceptors.response.handlers[0].rejected;

    const error = {
      config: {
        url: '/protected',
        method: 'get',
        headers: {},
        _retry: false
      },
      response: {
        status: 401
      }
    };

    const result = await handler(error);

    expect(localStorage.getItem('accessToken')).toBe('new-access-token');
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh-token');
    expect(result.status).toBe(200);
  });

  test('response interceptor clears localStorage when refresh fails', async () => {
    localStorage.setItem('accessToken', 'old-access-token');
    localStorage.setItem('refreshToken', 'old-refresh-token');

    jest.spyOn(axios, 'post').mockRejectedValue(new Error('Refresh failed'));

    const handler = apiClient.interceptors.response.handlers[0].rejected;

    const error = {
      config: {
        url: '/protected',
        method: 'get',
        headers: {},
        _retry: false
      },
      response: {
        status: 401
      }
    };

    await expect(handler(error)).rejects.toThrow('Refresh failed');

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  test('response interceptor rejects 401 when request already retried', async () => {
    const handler = apiClient.interceptors.response.handlers[0].rejected;

    const error = {
      config: {
        _retry: true
      },
      response: {
        status: 401
      }
    };

    await expect(handler(error)).rejects.toEqual(error);
  });

  test('response interceptor rejects non-401 server error', async () => {
    const handler = apiClient.interceptors.response.handlers[0].rejected;

    const error = {
      config: {},
      response: {
        status: 500
      }
    };

    await expect(handler(error)).rejects.toEqual(error);
  });

  test('response interceptor rejects network error', async () => {
    const handler = apiClient.interceptors.response.handlers[0].rejected;

    const error = {
      config: {},
      message: 'Network Error'
    };

    await expect(handler(error)).rejects.toEqual(error);
  });
});