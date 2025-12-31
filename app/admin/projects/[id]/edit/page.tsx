import { notFound } from 'next/navigation';
import { ProjectService } from '@/lib/server/services/project.service';
import { ProjectForm } from '@/src/components/admin/projects/ProjectForm';

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let project;
  try {
    project = await ProjectService.getProjectById(id);
  } catch (error) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">프로젝트 수정</h1>
        <p className="mt-1 text-sm text-gray-500">
          {project.name} 정보를 수정합니다
        </p>
      </div>

      <ProjectForm project={project} />
    </div>
  );
}
