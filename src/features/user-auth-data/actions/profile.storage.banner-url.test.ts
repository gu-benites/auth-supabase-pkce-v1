// src/features/user-auth-data/actions/profile.storage.banner-url.test.ts
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
  // Add other Supabase modules if needed for other tests, but not for this one
} as unknown as SupabaseClient; // Cast to satisfy SupabaseClient type

describe('Supabase Storage - Banner Public URL', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Set the mock implementation for createClient
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('should retrieve the public URL for a banner image from the "profiles" bucket', async () => {
    const userId = 'test-user-id-123';
    const bannerFileName = 'banner.png';
    const expectedFilePath = `banners/${userId}/${bannerFileName}`; // Assuming banners are stored in a 'banners' subfolder
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

  it('should handle errors if getPublicUrl fails', async () => {
    const userId = 'test-user-id-456';
    const bannerFileName = 'another-banner.jpg';
    const filePath = `banners/${userId}/${bannerFileName}`;
    const expectedError = { message: 'Failed to get public URL', name: 'StorageError' };

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
