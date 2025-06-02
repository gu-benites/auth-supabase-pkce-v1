// src/features/user-auth-data/actions/profile.storage.avatar-url.test.ts
import { createClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

// Mock the Supabase client module
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Define the mock Supabase client structure specifically for storage.getPublicUrl
const mockGetPublicUrl = jest.fn();
const mockStorageFrom = jest.fn(() => ({
  getPublicUrl: mockGetPublicUrl,
}));
const mockSupabaseStorage = {
  from: mockStorageFrom,
};

const mockSupabase = {
  storage: mockSupabaseStorage,
  // Add other Supabase modules if needed for other tests
} as unknown as SupabaseClient; // Cast to satisfy SupabaseClient type

describe('Supabase Storage - Avatar Public URL', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Set the mock implementation for createClient
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('should retrieve the public URL for an avatar image from the "profiles" bucket', async () => {
    const userId = 'test-user-avatar-id-123';
    const avatarFileName = 'avatar.png';
    // Assuming avatars are stored in an 'avatars' subfolder within the 'profiles' bucket
    const expectedFilePath = `avatars/${userId}/${avatarFileName}`; 
    const expectedPublicUrl = `https://your-supabase-url.com/storage/v1/object/public/profiles/${expectedFilePath}`;

    // Mock the getPublicUrl response
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: expectedPublicUrl },
      error: null,
    });

    // Simulate obtaining the Supabase client as it would be in an action/service
    const supabase = await createClient();

    // Call the method to test
    const { data, error } = supabase.storage
      .from('profiles')
      .getPublicUrl(expectedFilePath);

    // Assertions
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.publicUrl).toBe(expectedPublicUrl);

    // Verify that the mock functions were called correctly
    expect(mockStorageFrom).toHaveBeenCalledWith('profiles');
    expect(mockGetPublicUrl).toHaveBeenCalledWith(expectedFilePath);
  });

  it('should handle errors if getPublicUrl fails for an avatar', async () => {
    const userId = 'test-user-avatar-id-456';
    const avatarFileName = 'another-avatar.jpg';
    const filePath = `avatars/${userId}/${avatarFileName}`;
    const expectedError = { message: 'Failed to get public URL for avatar', name: 'StorageError' };

    // Mock getPublicUrl to return an error
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: null as any }, // As per Supabase type, publicUrl can be string
      error: expectedError,
    });
    
    const supabase = await createClient();

    const { data, error } = supabase.storage
      .from('profiles')
      .getPublicUrl(filePath);

    expect(data.publicUrl).toBeNull();
    expect(error).toEqual(expectedError);
    expect(mockStorageFrom).toHaveBeenCalledWith('profiles');
    expect(mockGetPublicUrl).toHaveBeenCalledWith(filePath);
  });
});
