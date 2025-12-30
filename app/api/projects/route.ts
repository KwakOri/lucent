/**
 * Projects API Routes
 *
 * GET /api/projects - 프로젝트 목록 조회
 */

import { NextRequest } from 'next/server';
import { ProjectService } from '@/lib/server/services/project.service';
import { handleApiError, successResponse } from '@/lib/server/utils/api-response';

/**
 * 프로젝트 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const projects = await ProjectService.getProjects();
    return successResponse(projects);
  } catch (error) {
    return handleApiError(error);
  }
}
