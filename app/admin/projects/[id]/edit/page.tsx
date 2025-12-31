import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/server/utils/supabase';
import { ProjectForm } from '@/src/components/admin/projects/ProjectForm';

async function getProject(id: string) {
  const supabase = await createServerClient();

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  return project;
}

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
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
