import Link from 'next/link';
import { ProjectService } from '@/lib/server/services/project.service';
import { ProjectsTable } from '@/src/components/admin/projects/ProjectsTable';

export default async function AdminProjectsPage() {
  const projects = await ProjectService.getAllProjects();

  return (
    <div>
      {/* Page Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">프로젝트 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            레이블 프로젝트를 관리합니다
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0">
          <Link
            href="/admin/projects/new"
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            + 프로젝트 등록
          </Link>
        </div>
      </div>

      {/* Projects Table */}
      <ProjectsTable projects={projects} />
    </div>
  );
}
