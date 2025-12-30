'use client';

import Link from 'next/link';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { useProjects } from '@/hooks';

// Project display config (for UI enhancement)
const PROJECT_DISPLAY_CONFIG: Record<string, {
  emoji?: string;
  color?: string;
  order?: string;
}> = {
  '0th': {
    emoji: '🌸',
    color: 'from-[#E3F2FD] to-[#A8D5E2]',
    order: '0th',
  },
  '1st': {
    emoji: '💧',
    color: 'from-neutral-100 to-neutral-200',
    order: '1st',
  },
};

export default function ProjectsPage() {
  const { data: projects, isLoading, error } = useProjects();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <EmptyState
          title="오류가 발생했습니다"
          description={error instanceof Error ? error.message : '프로젝트를 불러오는 중 오류가 발생했습니다'}
        />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Page Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            Projects
          </h1>
          <p className="text-lg text-text-secondary">
            Lucent가 기록하는 프로젝트들
          </p>
        </div>

        {/* Project Cards Grid */}
        {!projects || projects.length === 0 ? (
          <EmptyState
            title="아직 프로젝트가 없습니다"
            description="곧 멋진 프로젝트를 만나보실 수 있어요"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {projects.map((project) => {
              const displayConfig = PROJECT_DISPLAY_CONFIG[project.slug] || {};
              const isDisabled = !project.is_active;

              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.slug}`}
                  className={`block bg-white rounded-2xl border-2 border-neutral-200 overflow-hidden hover:shadow-xl transition-all duration-300 ${
                    !isDisabled
                      ? 'hover:scale-105'
                      : 'opacity-60 cursor-not-allowed pointer-events-none'
                  }`}
                >
                  {/* Cover Image */}
                  <div
                    className={`aspect-video bg-gradient-to-br ${displayConfig.color || 'from-neutral-100 to-neutral-200'} flex items-center justify-center`}
                  >
                    <div className="text-center">
                      <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-7xl">{displayConfig.emoji || '📦'}</span>
                      </div>
                      <p className="text-4xl font-bold text-text-primary">
                        {displayConfig.order || project.name}
                      </p>
                    </div>
                  </div>

                  {/* Project Info */}
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-text-primary mb-3">
                      {project.name}
                    </h2>
                    <p className="text-text-secondary">
                      {project.description || '프로젝트 설명'}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
