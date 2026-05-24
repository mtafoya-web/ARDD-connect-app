import client from '../api/client';

export interface Expert {
  id: number;
  csv_name: string;
  csv_email: string;
  csv_affiliation: string;
  csv_bio: string;
  csv_field: string;
  csv_keywords: string;
  csv_confidence_score: number;
  source_url: string;
  event_year: number;
  is_claimed: boolean;
  claimed_at: string | null;
  verified_by_admin: boolean;
  user_id: number | null;
  created_at: string;
}

export interface ExpertClaimResponse {
  success: boolean;
  message: string;
  expert: Expert | null;
  requires_admin_verification: boolean;
}

export interface ExpertCheckResponse {
  has_expert_profile: boolean;
  expert: Expert | null;
  message: string;
}

/**
 * Check if an email has a matching expert profile
 * Called after registration
 */
export const checkExpertProfile = async (email: string): Promise<ExpertCheckResponse> => {
  const response = await client.get<ExpertCheckResponse>('/auth/check-expert-profile', {
    params: { email },
  });
  return response.data;
};

/**
 * Claim an expert profile by email
 */
export const claimExpertByEmail = async (email: string): Promise<ExpertClaimResponse> => {
  const response = await client.post<ExpertClaimResponse>('/experts/claim-by-email', {
    email,
  });
  return response.data;
};

/**
 * Request admin verification for expert claim
 */
export const requestExpertVerification = async (
  csv_name: string,
  csv_affiliation: string,
): Promise<ExpertClaimResponse> => {
  const response = await client.post<ExpertClaimResponse>('/experts/request-verification', {
    csv_name,
    csv_affiliation,
  });
  return response.data;
};

/**
 * List unclaimed experts
 */
export const listExperts = async (
  field?: string,
  keyword?: string,
  skip: number = 0,
  limit: number = 50,
): Promise<Expert[]> => {
  const response = await client.get<Expert[]>('/experts/', {
    params: { field, keyword, claimed: false, skip, limit },
  });
  return response.data;
};

/**
 * Search for experts
 */
export const searchExperts = async (query: string): Promise<Expert[]> => {
  const response = await client.get<Expert[]>('/experts/search', {
    params: { query },
  });
  return response.data;
};

/**
 * Get a specific expert
 */
export const getExpert = async (expertId: number): Promise<Expert> => {
  const response = await client.get<Expert>(`/experts/${expertId}`);
  return response.data;
};
