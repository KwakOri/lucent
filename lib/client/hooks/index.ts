/**
 * Client Hooks Index
 *
 * 모든 React Query Hooks를 한 곳에서 export
 */

// Query Keys
export { queryKeys } from './query-keys';

// Auth Hooks
export {
  useSession,
  useLogin,
  useLogout,
  useSignUp,
  useSendVerification,
  useVerifyEmail,
  useResetPassword,
  useUpdatePassword,
} from './useAuth';

// Products Hooks
export {
  useProducts,
  useProduct,
  useProductBySlug,
} from './useProducts';

// Orders Hooks
export {
  useOrders,
  useOrder,
  useCreateOrder,
  useDownloadDigitalProduct,
} from './useOrders';

// Artists Hooks
export {
  useArtists,
  useArtist,
} from './useArtists';

// Projects Hooks
export {
  useProjects,
  useProject,
} from './useProjects';

// Profile Hooks
export {
  useProfile,
  useUpdateProfile,
} from './useProfile';
