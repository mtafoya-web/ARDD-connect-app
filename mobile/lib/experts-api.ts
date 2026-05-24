import { apiClient } from './api-client';
import { Expert, ExpertCheckResponse, ExpertClaimResponse } from '@/store/types';

/**
 * Check if an email has a matching expert profile
 * Called after registration
 */
export const checkExpertProfile = async (email: string): Promise<ExpertCheckResponse> => {
  return apiClient.get<ExpertCheckResponse>(`/auth/check-expert-profile?email=${encodeURIComponent(email)}`);
};

/**
 * Claim an expert profile by email
 */
export const claimExpertByEmail = async (email: string): Promise<ExpertClaimResponse> => {
  return apiClient.post<ExpertClaimResponse>('/experts/claim-by-email', {
    email,
  });
};

/**
 * Request admin verification for expert claim
 */
export const requestExpertVerification = async (
  csv_name: string,
  csv_affiliation: string,
): Promise<ExpertClaimResponse> => {
  return apiClient.post<ExpertClaimResponse>('/experts/request-verification', {
    csv_name,
    csv_affiliation,
  });
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
  let path = `/experts/?claimed=false&skip=${skip}&limit=${limit}`;
  if (field) path += `&field=${encodeURIComponent(field)}`;
  if (keyword) path += `&keyword=${encodeURIComponent(keyword)}`;
  return apiClient.get<Expert[]>(path);
};

/**
 * Search for experts
 */
export const searchExperts = async (query: string): Promise<Expert[]> => {
  return apiClient.get<Expert[]>(`/experts/search?query=${encodeURIComponent(query)}`);
};

/**
 * Get a specific expert
 */
export const getExpert = async (expertId: number): Promise<Expert> => {
  return apiClient.get<Expert>(`/experts/${expertId}`);
};
