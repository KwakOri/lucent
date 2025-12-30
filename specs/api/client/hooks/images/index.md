# Images React Query Hooks

이 문서는 **이미지(Images) React Query Hooks** 구현을 정의한다.

> **범위**: 이미지 데이터 fetching 및 상태 관리 Hooks (주로 관리자 기능)
> **관련 문서**:
> - React Query 패턴: `/specs/api/client/hooks/index.md`
> - Client Services: `/specs/api/client/services/images/index.md`
> - API Routes: `/specs/api/server/routes/images/index.md`

---

## 1. QueryKey 구조

### 1.1 QueryKey 정의

```ts
// lib/client/hooks/query-keys.ts
export const queryKeys = {
  images: {
    all: ['images'] as const,
    lists: () => [...queryKeys.images.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.images.lists(), filters] as const,
    details: () => [...queryKeys.images.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.images.details(), id] as const,
  },
} as const;
```

### 1.2 QueryKey 사용 예시

```ts
// 이미지 목록 (필터 포함)
queryKeys.images.list({ imageType: 'product_main', page: 1 })
// → ['images', 'list', { imageType: 'product_main', page: 1 }]

// 이미지 상세
queryKeys.images.detail('image-uuid')
// → ['images', 'detail', 'image-uuid']

// 모든 이미지 목록 무효화
queryKeys.images.lists()
// → ['images', 'list']
```

---

## 2. Query Hooks

### 2.1 useImages (이미지 목록 - 관리자)

```ts
// lib/client/hooks/useImages.ts
import { useQuery } from '@tanstack/react-query';
import { ImagesAPI, type GetImagesParams } from '@/lib/client/services/images.api';
import { queryKeys } from './query-keys';

export function useImages(params?: GetImagesParams) {
  return useQuery({
    queryKey: queryKeys.images.list(params || {}),
    queryFn: () => ImagesAPI.getImages(params),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5, // 5분
  });
}
```

**사용 예시 (관리자)**:

```tsx
function ImageLibrary() {
  const [page, setPage] = useState(1);
  const [imageType, setImageType] = useState<string | undefined>();

  const { data, isLoading, error } = useImages({
    page,
    limit: 20,
    imageType,
  });

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  const images = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div>
      <ImageTypeFilter value={imageType} onChange={setImageType} />

      <div className="image-grid">
        {images.map((image) => (
          <ImageCard key={image.id} image={image} />
        ))}
      </div>

      {pagination && (
        <Pagination
          current={pagination.page}
          total={pagination.totalPages}
          onChange={setPage}
        />
      )}
    </div>
  );
}
```

### 2.2 useImage (이미지 상세)

```ts
// lib/client/hooks/useImage.ts
import { useQuery } from '@tanstack/react-query';
import { ImagesAPI } from '@/lib/client/services/images.api';
import { queryKeys } from './query-keys';

export function useImage(id: string) {
  return useQuery({
    queryKey: queryKeys.images.detail(id),
    queryFn: () => ImagesAPI.getImage(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10분
  });
}
```

---

## 3. Mutation Hooks

### 3.1 useUploadImage (이미지 업로드 - 관리자)

```ts
// lib/client/hooks/useUploadImage.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImagesAPI, type UploadImageInput } from '@/lib/client/services/images.api';
import { queryKeys } from './query-keys';

export function useUploadImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UploadImageInput) => ImagesAPI.uploadImage(input),
    onSuccess: () => {
      // 이미지 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.images.lists(),
      });
    },
  });
}
```

**사용 예시 (관리자)**:

```tsx
function ImageUploader() {
  const uploadImage = useUploadImage();
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 미리보기
    setPreview(URL.createObjectURL(file));

    // 업로드
    uploadImage.mutate(
      {
        file,
        image_type: 'product_main',
        alt_text: '상품 이미지',
      },
      {
        onSuccess: (response) => {
          alert('업로드 성공!');
          console.log('Image ID:', response.data.id);
          console.log('Public URL:', response.data.public_url);
        },
        onError: (error) => {
          if (error.errorCode === 'FILE_TOO_LARGE') {
            alert('파일 크기는 5MB를 초과할 수 없습니다.');
          } else if (error.errorCode === 'INVALID_FILE_TYPE') {
            alert('허용되지 않은 파일 형식입니다.');
          } else {
            alert(error.message);
          }
        },
      }
    );
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={uploadImage.isPending}
      />

      {preview && <img src={preview} alt="Preview" />}

      {uploadImage.isPending && <p>업로드 중...</p>}
    </div>
  );
}
```

### 3.2 useDeleteImage (이미지 삭제 - 관리자)

```ts
// lib/client/hooks/useDeleteImage.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImagesAPI } from '@/lib/client/services/images.api';
import { queryKeys } from './query-keys';

export function useDeleteImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageId: string) => ImagesAPI.deleteImage(imageId),
    onSuccess: () => {
      // 이미지 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.images.lists(),
      });
    },
  });
}
```

**사용 예시 (관리자)**:

```tsx
function ImageCard({ image }: { image: Image }) {
  const deleteImage = useDeleteImage();

  const handleDelete = () => {
    if (!confirm('이 이미지를 삭제하시겠습니까?')) return;

    deleteImage.mutate(image.id, {
      onSuccess: () => {
        alert('이미지가 삭제되었습니다.');
      },
      onError: (error) => {
        alert(error.message);
      },
    });
  };

  return (
    <div className="image-card">
      <img src={image.public_url} alt={image.alt_text || image.file_name} />
      <div className="actions">
        <button onClick={handleDelete} disabled={deleteImage.isPending}>
          {deleteImage.isPending ? '삭제 중...' : '삭제'}
        </button>
      </div>
    </div>
  );
}
```

---

## 4. 실전 예시

### 4.1 이미지 선택 모달 (관리자 - 상품 등록 시)

```tsx
function ImageSelectModal({ onSelect }: { onSelect: (imageId: string) => void }) {
  const { data, isLoading } = useImages({
    limit: 20,
    imageType: 'product_main',
  });

  if (isLoading) return <Loading />;

  const images = data?.data || [];

  return (
    <div className="modal">
      <h2>이미지 선택</h2>
      <div className="image-grid">
        {images.map((image) => (
          <button
            key={image.id}
            onClick={() => onSelect(image.id)}
            className="image-option"
          >
            <img src={image.thumbnail_url || image.public_url} alt={image.alt_text} />
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 4.2 드래그 앤 드롭 업로드

```tsx
function DragDropUploader() {
  const uploadImage = useUploadImage();
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    uploadImage.mutate({
      file,
      image_type: 'product_main',
    });
  };

  return (
    <div
      className={`drop-zone ${isDragging ? 'dragging' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {uploadImage.isPending ? (
        <p>업로드 중...</p>
      ) : (
        <p>이미지를 드래그하거나 클릭하여 업로드하세요</p>
      )}
    </div>
  );
}
```

---

## 5. 에러 처리

### 5.1 업로드 에러 처리

```tsx
function ImageUploader() {
  const uploadImage = useUploadImage();
  const [error, setError] = useState<string | null>(null);

  const handleUpload = (file: File) => {
    setError(null);

    uploadImage.mutate(
      { file, image_type: 'product_main' },
      {
        onError: (error) => {
          if (error.errorCode === 'FILE_TOO_LARGE') {
            setError('파일 크기는 5MB를 초과할 수 없습니다.');
          } else if (error.errorCode === 'INVALID_FILE_TYPE') {
            setError('허용되지 않은 파일 형식입니다. (jpeg, png, webp만 가능)');
          } else {
            setError(error.message);
          }
        },
      }
    );
  };

  return (
    <div>
      <input type="file" onChange={(e) => handleUpload(e.target.files![0])} />
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

---

## 6. 캐시 관리

### 6.1 업로드 후 캐시 무효화

```ts
export function useUploadImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UploadImageInput) => ImagesAPI.uploadImage(input),
    onSuccess: () => {
      // 모든 이미지 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.images.lists(),
      });
    },
  });
}
```

### 6.2 낙관적 업데이트 (삭제)

```ts
export function useDeleteImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageId: string) => ImagesAPI.deleteImage(imageId),
    onMutate: async (imageId) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: queryKeys.images.lists() });

      // 이전 데이터 백업
      const previousData = queryClient.getQueryData(queryKeys.images.lists());

      // 낙관적 업데이트
      queryClient.setQueriesData({ queryKey: queryKeys.images.lists() }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter((img: Image) => img.id !== imageId),
        };
      });

      return { previousData };
    },
    onError: (err, imageId, context) => {
      // 에러 시 이전 데이터 복원
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.images.lists(), context.previousData);
      }
    },
    onSettled: () => {
      // 항상 캐시 무효화 (최신 데이터로 갱신)
      queryClient.invalidateQueries({ queryKey: queryKeys.images.lists() });
    },
  });
}
```

---

## 7. 성능 최적화

### 7.1 staleTime 설정

```ts
// 이미지 목록: 5분
staleTime: 1000 * 60 * 5

// 이미지 상세: 10분
staleTime: 1000 * 60 * 10
```

### 7.2 파일 크기 최적화

업로드 전에 클라이언트에서 이미지 리사이징:

```ts
async function resizeImage(file: File, maxWidth: number): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    img.onload = () => {
      const ratio = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * ratio;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        resolve(new File([blob!], file.name, { type: file.type }));
      }, file.type);
    };

    img.src = URL.createObjectURL(file);
  });
}
```

---

## 8. 참고 문서

- React Query 패턴: `/specs/api/client/hooks/index.md`
- Client Services: `/specs/api/client/services/images/index.md`
- API Routes: `/specs/api/server/routes/images/index.md`
- [TanStack Query 공식 문서](https://tanstack.com/query/latest)
