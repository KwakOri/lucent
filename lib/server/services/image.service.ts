/**
 * Image Service
 *
 * 이미지 관련 비즈니스 로직
 * - 이미지 업로드 (R2)
 * - 이미지 조회
 * - 이미지 삭제 (Soft Delete)
 *
 * 중요: 모든 이미지는 Cloudflare R2에 저장되고 images 테이블에서 관리됩니다.
 */

import { createServerClient } from '@/lib/server/utils/supabase';
import { ApiError, NotFoundError, AuthorizationError } from '@/lib/server/utils/errors';
import { uploadFile, deleteFile, getMimeType } from '@/lib/server/utils/r2';
import { Tables, TablesInsert } from '@/types/database';

type Image = Tables<'images'>;
type ImageInsert = TablesInsert<'images'>;

interface UploadImageInput {
  file: File;
  imageType: 'project_cover' | 'artist_profile' | 'product_main' | 'product_gallery';
  altText?: string;
  uploadedBy: string;
}

interface GetImagesParams {
  page?: number;
  limit?: number;
  imageType?: string;
  isActive?: boolean;
}

export class ImageService {
  /**
   * 이미지 업로드
   */
  static async uploadImage(input: UploadImageInput): Promise<Image> {
    const { file, imageType, altText, uploadedBy } = input;

    // 1. 파일 검증
    this.validateImageFile(file);

    // 2. R2 키 생성
    const r2Key = this.generateR2Key(file.name, imageType);

    // 3. R2에 파일 업로드
    const buffer = Buffer.from(await file.arrayBuffer());
    const publicUrl = await uploadFile({
      key: r2Key,
      body: buffer,
      contentType: file.type,
    });

    // 4. 이미지 메타데이터 추출 (간단한 버전)
    const metadata = await this.extractImageMetadata(file);

    // 5. DB에 저장
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('images')
      .insert({
        r2_key: r2Key,
        r2_bucket: process.env.R2_BUCKET_NAME!,
        public_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        width: metadata.width,
        height: metadata.height,
        image_type: imageType,
        alt_text: altText || '',
        uploaded_by: uploadedBy,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw new ApiError('이미지 저장에 실패했습니다', 500, 'IMAGE_SAVE_FAILED');
    }

    return data;
  }

  /**
   * 이미지 목록 조회
   */
  static async getImages(params: GetImagesParams = {}): Promise<{
    images: Image[];
    total: number;
  }> {
    const { page = 1, limit = 20, imageType, isActive } = params;
    const offset = (page - 1) * limit;

    const supabase = await createServerClient();
    let query = supabase.from('images').select('*', { count: 'exact' });

    // 필터 적용
    if (imageType) {
      query = query.eq('image_type', imageType);
    }

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    // 정렬 및 페이지네이션
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new ApiError('이미지 조회에 실패했습니다', 500, 'IMAGE_FETCH_FAILED');
    }

    return {
      images: data || [],
      total: count || 0,
    };
  }

  /**
   * 이미지 상세 조회
   */
  static async getImageById(id: string): Promise<Image> {
    const supabase = await createServerClient();
    const { data, error } = await supabase.from('images').select('*').eq('id', id).single();

    if (error || !data) {
      throw new NotFoundError('이미지를 찾을 수 없습니다');
    }

    return data;
  }

  /**
   * 이미지 삭제 (Soft Delete)
   */
  static async deleteImage(id: string, userId: string): Promise<void> {
    const supabase = await createServerClient();

    // 이미지 존재 확인
    const image = await this.getImageById(id);

    // 권한 확인 (업로드한 사용자만 삭제 가능)
    if (image.uploaded_by !== userId) {
      throw new AuthorizationError('이미지를 삭제할 권한이 없습니다');
    }

    // Soft Delete
    const { error } = await supabase.from('images').update({ is_active: false }).eq('id', id);

    if (error) {
      throw new ApiError('이미지 삭제에 실패했습니다', 500, 'IMAGE_DELETE_FAILED');
    }
  }

  /**
   * 이미지 Hard Delete (관리자 전용)
   */
  static async hardDeleteImage(id: string): Promise<void> {
    const supabase = await createServerClient();

    // 이미지 정보 가져오기
    const image = await this.getImageById(id);

    // R2에서 파일 삭제
    try {
      await deleteFile(image.r2_key);
    } catch (error) {
      console.error('R2 파일 삭제 실패:', error);
      // R2 삭제 실패해도 DB는 삭제 진행
    }

    // DB에서 삭제
    const { error } = await supabase.from('images').delete().eq('id', id);

    if (error) {
      throw new ApiError('이미지 삭제에 실패했습니다', 500, 'IMAGE_DELETE_FAILED');
    }
  }

  /**
   * 파일 검증
   */
  private static validateImageFile(file: File): void {
    // MIME 타입 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new ApiError(
        '허용되지 않은 파일 형식입니다. (jpeg, png, webp만 허용)',
        400,
        'INVALID_FILE_TYPE'
      );
    }

    // 파일 크기 검증 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new ApiError('파일 크기는 5MB를 초과할 수 없습니다', 400, 'FILE_TOO_LARGE');
    }

    // 확장자 이중 검증
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
      throw new ApiError('허용되지 않은 파일 확장자입니다', 400, 'INVALID_FILE_EXTENSION');
    }
  }

  /**
   * R2 키 생성
   */
  private static generateR2Key(originalFilename: string, imageType: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const uuid = crypto.randomUUID();

    // 파일명 정규화
    const sanitized = originalFilename.toLowerCase().replace(/[^a-z0-9.-]/g, '-');

    return `images/${imageType}/${year}/${month}/${uuid}-${sanitized}`;
  }

  /**
   * 이미지 메타데이터 추출 (간단한 버전)
   */
  private static async extractImageMetadata(
    file: File
  ): Promise<{ width: number | null; height: number | null }> {
    // 브라우저 환경이 아니므로 Image 객체를 사용할 수 없음
    // 실제 프로덕션에서는 sharp 등의 라이브러리 사용 권장
    // 지금은 null 반환
    return { width: null, height: null };
  }
}
