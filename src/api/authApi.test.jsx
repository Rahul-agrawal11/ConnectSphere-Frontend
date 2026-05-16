import apiClient from './apiClient';
import {
  sendOtp,
  verifyOtp,
  login,
  refreshToken,
  logout,
  getMyProfile,
  getProfileById,
  updateProfile,
  changePassword,
  searchUsers,
  deactivateAccount,
  getAllUsers,
  suspendUser,
  reactivateUser,
  adminDeleteUser
} from './authApi';

jest.mock('./apiClient', () => ({
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test('calls register API', () => {
  const data = { username: 'rahul', email: 'rahul@gmail.com', password: '123456' };

  sendOtp(data);

  expect(apiClient.post).toHaveBeenCalledWith('/api/v1/auth/register', data);
});

test('calls verify otp API', () => {
  const data = { email: 'rahul@gmail.com', otp: '123456' };

  verifyOtp(data);

  expect(apiClient.post).toHaveBeenCalledWith('/api/v1/auth/verify-otp', data);
});

test('calls login API', () => {
  const data = { emailOrUsername: 'rahul', password: '123456' };

  login(data);

  expect(apiClient.post).toHaveBeenCalledWith('/api/v1/auth/login', data);
});

test('calls refresh token API', () => {
  refreshToken('refresh123');

  expect(apiClient.post).toHaveBeenCalledWith('/api/v1/auth/refresh?refreshToken=refresh123');
});

test('calls logout API', () => {
  logout();

  expect(apiClient.post).toHaveBeenCalledWith('/api/v1/auth/logout');
});

test('calls my profile API', () => {
  getMyProfile();

  expect(apiClient.get).toHaveBeenCalledWith('/api/v1/auth/profile');
});

test('calls profile by id API', () => {
  getProfileById(10);

  expect(apiClient.get).toHaveBeenCalledWith('/api/v1/auth/profile/10');
});

test('calls update profile API', () => {
  const data = { username: 'rahul_updated' };

  updateProfile(data);

  expect(apiClient.put).toHaveBeenCalledWith('/api/v1/auth/profile', data);
});

test('calls change password API', () => {
  const data = { currentPassword: 'old', newPassword: 'new' };

  changePassword(data);

  expect(apiClient.put).toHaveBeenCalledWith('/api/v1/auth/password', data);
});

test('calls search users API', () => {
  searchUsers('rahul');

  expect(apiClient.get).toHaveBeenCalledWith('/api/v1/auth/search', {
    params: { query: 'rahul' }
  });
});

test('calls deactivate account API', () => {
  deactivateAccount();

  expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/auth/deactivate');
});

test('calls admin get all users API', () => {
  getAllUsers();

  expect(apiClient.get).toHaveBeenCalledWith('/api/v1/auth/admin/users');
});

test('calls admin suspend user API', () => {
  suspendUser(5);

  expect(apiClient.put).toHaveBeenCalledWith('/api/v1/auth/admin/users/5/suspend');
});

test('calls admin reactivate user API', () => {
  reactivateUser(5);

  expect(apiClient.put).toHaveBeenCalledWith('/api/v1/auth/admin/users/5/reactivate');
});

test('calls admin delete user API', () => {
  adminDeleteUser(5);

  expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/auth/admin/users/5');
});