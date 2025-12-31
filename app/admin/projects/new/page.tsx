import { ProjectForm } from '@/src/components/admin/projects/ProjectForm';

export default function NewProjectPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">프로젝트 등록</h1>
        <p className="mt-1 text-sm text-gray-500">
          새로운 프로젝트를 등록합니다
        </p>
      </div>

      <ProjectForm />
    </div>
  );
}
