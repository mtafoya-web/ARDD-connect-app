export interface User {
    id: number;
    username: string;
    email: string;
    full_name: string;
    bio?: string;
    affiliation: string;
    role: string;
    area_of_study: string;
    research_interests?: string;
    looking_for?: string;
    location?: string;
    website?: string;
}
export interface Post {
    id: number;
    content: string;
    user_id: number;
    username: string;
    created_at: string;
    user?: User;
}
export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: User;
}
export interface RegisterPayload {
    username: string;
    email: string;
    password: string;
}
export interface LoginPayload {
    username: string;
    password: string;
}
