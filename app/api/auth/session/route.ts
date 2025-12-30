/**
 * GET /api/auth/session
 *
 * 세션 확인 API
 */

import { NextRequest } from 'next/server';
import { AuthService } from '@/lib/server/services/auth.service';
import { handleApiError, successResponse } from '@/lib/server/utils/api-response';

export async function GET(request: NextRequest) {
  try {
    const session = await AuthService.getSession();

    if (!session) {
      return successResponse({
        user: null,
        session: null,
      });
    }

    return successResponse({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name,
      },
      session: {
        accessToken: session.session.access_token,
        expiresAt: session.session.expires_at,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
