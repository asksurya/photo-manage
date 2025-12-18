export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Duration in seconds
  issuedAt: number; // Timestamp in milliseconds
  tokenType: string;
}
