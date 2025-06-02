// src/features/user-auth-data/actions/profile.actions.test.ts

// Import the function to be tested
import { updateUserProfile } from './profile.actions';
import { User } from '@supabase/supabase-js';

// Mock the Supabase client - will be needed for actual database interactions
// Explicitly define mocks for the Supabase update chain
const mockSelectSingle = jest.fn();
const mockSingle = jest.fn();
const mockSelect = jest.fn(() => ({ single: mockSingle }));
const mockEq = jest.fn(() => ({ select: mockSelect })); // Mock eq to return an object with select
const mockUpdate = jest.fn(() => ({ eq: mockEq })); // Mock update to return an object with eq

// Completely revise the mockSupabase object
// We need to mock the chain from().update().eq().single() and from().select().single()
const mockSupabase = {
  // Explicitly mock the `update` chain to return mocks we control,
  auth: {
    // Mock getUser to return a user or null
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    update: mockUpdate, // Use the spy for the update method
    // Mock the select method to return a single user profile
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: mockSelectSingle, // Use a separate spy for the select chain single call
      })),
    })),
  })),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      // Mock getPublicUrl to return a URL
      getPublicUrl: jest.fn(),
    })),
  },
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

// Mock user data
const mockUser: User = {
  id: 'test-user-id',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'test@example.com',
  email_confirmed_at: '2023-01-01T00:00:00Z',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  factors: [],
  app_metadata: {},
  user_metadata: {},
};

// Mock initial profile data from database (snake_case)
const mockDbProfile = {
  id: 'test-user-id',
  first_name: 'Initial',
  last_name: 'User',
  gender: null,
  age_category: null,
  specific_age: null,
  language: 'en',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  avatar_url: null,
  role: 'user',
  stripe_customer_id: null,
  subscription_status: null,
  subscription_tier: null,
  subscription_period: null,
  subscription_start_date: null,
  subscription_end_date: null,
  bio: '',
  banner_img_url: null,
};

describe('updateUserProfile', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should update basic user profile information successfully', async () => {
    // Mock Supabase auth to return an authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    // Test data with camelCase keys
    const updateData = {
      lastName: 'Updated User',
    };

    // Mock the chained calls for the update
    const mockSelectAfterEq = jest.fn(() => ({
 single: mockSingle, // This is the single call after update, eq, and select
    }));
    const mockEqForUpdate = jest.fn(() => ({
 select: mockSelectAfterEq, // Add the select method after eq
    }));
    const mockUpdateReturn = jest.fn(() => ({
 eq: mockEqForUpdate, // Return the object with the eq mock
    }));
    (mockSupabase.from as jest.Mock).mockReturnValue({
      update: mockUpdateReturn,
      select: jest.fn(), // We don\'t need select for this test case, but include it
    });

    // Mock the final single call after the update chain
    mockSingle.mockResolvedValue({
      data: {
        ...mockDbProfile, last_name: updateData.lastName, id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
      }, // Ensure ID is a valid UUID and last_name is updated
      error: null,
    });

    const result = await updateUserProfile(updateData);

    // Assertions
    expect(result.data).toBeDefined();
    expect(result.data?.lastName).toBe(updateData.lastName);
    expect(result.error).toBeUndefined();
    // Ensure the update was called with correct snake_case data and user ID
    expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    expect(mockUpdateReturn).toHaveBeenCalledWith({ last_name: updateData.lastName, updated_at: expect.any(String) }); // Check for snake_case and updated_at
    expect(mockSupabase.from().update().eq).toHaveBeenCalledWith('id', mockUser.id);
  });

  it('should return an error if the user is not authenticated', async () => {
    // Mock Supabase auth to return no user
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const dataToUpdate = { lastName: 'Should Fail' };
    const result = await updateUserProfile(dataToUpdate);

    // Assertions
    expect(result.data).toBeUndefined();
    expect(result.error).toBe('User not authenticated.');
  });

  // TODO: Add more test cases for different scenarios, such as:
  // - Database update errors
  // - Image upload success (requires more complex storage mock)
  // - Image upload failure (requires more complex storage mock)
  // - Handling of null data URI for image removal (requires more complex storage mock)
  // - Validation errors (if applicable)
});