import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route (or controller) as public, allowing it to skip the
 * global JwtAuthGuard. Used on auth endpoints and the customer-facing
 * booking endpoints which must remain unauthenticated.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
