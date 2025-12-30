/**
 * Project Detail API Routes
 *
 * GET /api/projects/:id - 프로젝트 상세 조회
 */

import { NextRequest } from 'next/server';
import { ProjectService } from '@/lib/server/services/project.service';
import { handleApiError, successResponse } from '@/lib/server/utils/api-response';

/**
 * 프로젝트 상세 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await ProjectService.getProjectById(id);
    return successResponse(project);
  } catch (error) {
    return handleApiError(error);
  }
}
