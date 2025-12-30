'use client';

import Link from 'next/link';

const PROJECTS = [
  {
    id: '0th',
    name: '0th Project',
    order: '0th',
    description: '포근하고 다정한 동물의 숲 - 미루루',
    slug: '0th',
    emoji: '🌸',
    color: 'from-[#E3F2FD] to-[#A8D5E2]',
  },
  {
    id: '1st',
    name: '1st Project',
    order: '1st',
    description: 'Drips - 준비 중입니다',
    slug: '1st',
    emoji: '💧',
    color: 'from-neutral-100 to-neutral-200',
    disabled: true,
  },
];

export default function ProjectsPage() {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {PROJECTS.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.slug}`}
              className={`block bg-white rounded-2xl border-2 border-neutral-200 overflow-hidden hover:shadow-xl transition-all duration-300 ${
                !project.disabled
                  ? 'hover:scale-105'
                  : 'opacity-60 cursor-not-allowed pointer-events-none'
              }`}
            >
              {/* Cover Image */}
              <div
                className={`aspect-video bg-gradient-to-br ${project.color} flex items-center justify-center`}
              >
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-7xl">{project.emoji}</span>
                  </div>
                  <p className="text-4xl font-bold text-text-primary">
                    {project.order}
                  </p>
                </div>
              </div>

              {/* Project Info */}
              <div className="p-6">
                <h2 className="text-2xl font-bold text-text-primary mb-3">
                  {project.name}
                </h2>
                <p className="text-text-secondary">
                  {project.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
