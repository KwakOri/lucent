'use client';

import { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';

// Mock data - will be replaced with API call
const PROJECT_DATA: Record<string, any> = {
  '0th': {
    id: '0th',
    name: '0th Project',
    order: '0th',
    description:
      '미루루와 함께하는 포근하고 다정한 동물의 숲. 일상의 작은 순간들을 따뜻하게 기록하며, 감성적인 목소리로 여러분의 하루를 채워드립니다.',
    emoji: '🌸',
    color: 'from-[#E3F2FD] to-[#A8D5E2]',
    artists: [
      {
        id: 'miruru',
        name: '미루루',
        description: '포근하고 다정한 동물의 숲 컨셉의 버츄얼 아티스트',
        shopSlug: 'miruru',
      },
    ],
    contents: [
      {
        id: '1',
        type: 'VOICE_PACK',
        title: '일상 보이스팩',
        description: '일상에서 사용할 수 있는 다양한 보이스',
      },
      {
        id: '2',
        type: 'VOICE_PACK',
        title: '감정 보이스팩',
        description: '다양한 감정을 담은 보이스',
      },
      {
        id: '3',
        type: 'PHYSICAL_GOODS',
        title: '아크릴 스탠드',
        description: '귀여운 미루루 아크릴 스탠드',
      },
    ],
  },
  '1st': {
    id: '1st',
    name: '1st Project',
    order: '1st',
    description: 'Drips 프로젝트는 현재 준비 중입니다. 곧 만나보실 수 있습니다.',
    emoji: '💧',
    color: 'from-neutral-100 to-neutral-200',
    artists: [],
    contents: [],
    disabled: true,
  },
};

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const project = PROJECT_DATA[slug];

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            프로젝트를 찾을 수 없습니다
          </h1>
          <Link href="/projects">
            <Button intent="primary">프로젝트 목록으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Project Header */}
      <section
        className={`py-20 px-4 bg-gradient-to-br ${project.color}`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-40 h-40 mx-auto mb-8 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center">
              <span className="text-8xl">{project.emoji}</span>
            </div>
            <p className="text-3xl font-bold text-text-secondary mb-4">
              {project.order}
            </p>
            <h1 className="text-5xl font-bold text-text-primary mb-6">
              {project.name}
            </h1>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              {project.description}
            </p>
          </div>
        </div>
      </section>

      {/* Artists Section */}
      {project.artists.length > 0 && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-text-primary mb-8 text-center">
              참여 아티스트
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {project.artists.map((artist: any) => (
                <div
                  key={artist.id}
                  className="bg-neutral-50 rounded-xl p-6 text-center"
                >
                  <h3 className="text-2xl font-bold text-text-primary mb-3">
                    {artist.name}
                  </h3>
                  <p className="text-text-secondary">
                    {artist.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contents Section */}
      {project.contents.length > 0 && (
        <section className="py-16 px-4 bg-neutral-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-text-primary mb-8 text-center">
              콘텐츠
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {project.contents.map((content: any) => (
                <div
                  key={content.id}
                  className="bg-white rounded-xl p-6 border border-neutral-200"
                >
                  <div className="mb-3">
                    <span className="text-sm font-medium text-primary-700">
                      {content.type === 'VOICE_PACK' ? '보이스팩' : '실물 굿즈'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">
                    {content.title}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {content.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Shop Link Section */}
      {!project.disabled && project.artists.length > 0 && (
        <section className="py-20 px-4 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-text-primary mb-6">
              굿즈샵에서 만나보세요
            </h2>
            <p className="text-lg text-text-secondary mb-8">
              다양한 보이스팩과 굿즈를 구매하실 수 있습니다
            </p>
            <Link href={`/goods/${project.artists[0].shopSlug}`}>
              <Button intent="primary" size="lg">
                <ShoppingCart className="w-5 h-5" />
                굿즈샵 보러가기
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
