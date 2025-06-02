import { updateUserProfile } from './profile.actions';
import { createClient } from '@/lib/supabase/server';
import { User } from '@supabase/supabase-js'; // Import User type

// Mock the necessary modules and functions
// Mock user data (using a basic structure for tests)
const mockUser: User = { // Explicitly type mockUser
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
const mockDbProfile: any = { // Use 'any' for simplicity or define a specific Profile type
  id: 'a1b2c3d4-e5f6-4780-9123-456789abcdef', // Use a valid UUID
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
  bio: '',
  banner_img_url: null,
};

// Mock the Supabase client and its methods
 jest.mock('@/lib/supabase/server', () => ({
 // Fully mock the module to prevent execution of original createClient
  createClient: jest.fn(), // Only expose a mock createClient
}));

const mockSupabase: any = { // Use 'any' for easier mocking of chained calls
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(), // Mock single for select
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(), // Mock single for update
      })),
    })),
    insert: jest.fn(),
  })),
  error: null,
};

describe('updateUserProfile - Basic Profile Updates', () => {
 // Set createClient mock return value before all tests
 (createClient as jest.Mock).mockReturnValue(mockSupabase);
 beforeEach(() => {
    jest.clearAllMocks();

    // Mock the chained calls for the update for each test
    const mockSingle = jest.fn(); // Mock for the final single() call after update
    const mockSelect = jest.fn(() => ({ single: mockSingle }));
    const mockEq = jest.fn(() => ({ select: mockSelect }));
    // Mock the update method specifically within the from() return value
    const mockUpdate = jest.fn(() => ({ eq: mockEq }));

    // Reset mockSupabase structure before each test
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    (mockSupabase.from as jest.Mock).mockReturnValue({ update: mockUpdate });
  });

  it('should update basic user profile information successfully', async () => {
    // Mock getCurrentUser is not needed as we are mocking supabase.auth.getUser
 // (getCurrentUser as jest.Mock).mockResolvedValue(mockUser); // No need to mock getCurrentUser as we mock getUser

    // Mock the update call to simulate a successful update
    // Access the mockSingle function directly from the mock setup in beforeEach
    const mockUpdateEqSelectSingle = (mockSupabase.from().update().eq().select().single) as jest.Mock;
    mockUpdateEqSelectSingle.mockResolvedValue({
      data: { ...mockDbProfile, id: 'a1b2c3d4-e5f6-4780-9123-456789abcdef', last_name: 'Updated User' }, // Ensure valid UUID in return data
      error: null,
    });

    const updateData = { lastName: 'Updated User' };
    const result = await updateUserProfile(updateData);

    // Assertions should check for data and error properties
    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined(); // Assuming successful update should have no error

    // Assert that the mocked update and eq methods were called correctly
    // We need to get the mockUpdate from the return of the mocked from()
    const mockUpdate = (mockSupabase.from('profiles').update) as jest.Mock;
    expect(mockUpdate).toHaveBeenCalledWith({
      last_name: 'Updated User',
      updated_at: expect.any(String), // Check for updated_at timestamp
    });
    expect(mockSupabase.from().update().eq).toHaveBeenCalledWith('id', 'test-user-id');
  });
 
  it('should return an error if the user is not authenticated', async () => {
    // Mock supabase.auth.getUser to return null (no authenticated user)
 (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null }, error: null });

    const updateData = { lastName: 'Updated User' };
    const result = await updateUserProfile(updateData);

    // Assertions should check for data and error properties
    expect(result.data).toBeUndefined();
    expect(result.error).toBe('User not authenticated.');
    // Assert that the mocked update function was NOT called
    expect(mockSupabase.from().update).not.toHaveBeenCalled();
 });
});