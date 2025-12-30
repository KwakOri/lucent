/**
 * Client API Index
 *
 * 모든 API 클라이언트를 한 곳에서 export
 */

// API Clients
export { AuthAPI } from './auth.api';
export { ProductsAPI } from './products.api';
export { OrdersAPI } from './orders.api';
export { ArtistsAPI } from './artists.api';
export { ProjectsAPI } from './projects.api';
export { ProfilesAPI } from './profiles.api';

// Types
export type { LoginData, SignUpData } from './auth.api';
export type { GetProductsParams, ProductWithDetails } from './products.api';
export type { CreateOrderData, OrderWithItems, GetOrdersParams } from './orders.api';
export type { ArtistWithDetails } from './artists.api';
export type { ProjectWithDetails } from './projects.api';
export type { UpdateProfileData } from './profiles.api';
