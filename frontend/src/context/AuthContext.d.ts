import { ReactNode } from 'react';
import { User, RegisterPayload, LoginPayload } from '../types';
interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    register: (payload: RegisterPayload) => Promise<void>;
    login: (payload: LoginPayload) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}
export declare const AuthProvider: ({ children }: {
    children: ReactNode;
}) => import("react").JSX.Element;
export declare const useAuth: () => AuthContextType;
export {};
