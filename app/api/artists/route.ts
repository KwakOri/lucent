/**
 * Artists API Routes
 *
 * GET /api/artists - 아티스트 목록 조회
 */

import { NextRequest } from 'next/server';
import { ArtistService } from '@/lib/server/services/artist.service';
import { handleApiError, successResponse } from '@/lib/server/utils/api-response';

/**
 * 아티스트 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const artists = await ArtistService.getArtists();
    return successResponse(artists);
  } catch (error) {
    return handleApiError(error);
  }
}
