/**
 * AddressSearchModal Component
 *
 * 주소 검색 모달 컴포넌트
 * 프로젝트 모달 시스템에 통합된 버전
 */

"use client";

import type { ModalProps } from "@/components/modal";
import { Footer, Header, ModalContainer, Overlay } from "@/components/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { useAddressSearch } from "@/hooks/useAddressSearch";
import type { AddressSearchResult } from "@/types/address";
import { Search } from "lucide-react";
import { useState } from "react";

/**
 * AddressSearchModal Props
 * ModalProps<AddressSearchResult>를 확장하여 모달 시스템과 통합
 */

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AddressSearchModalProps
  extends ModalProps<AddressSearchResult> {
  // 모달 시스템에서 자동으로 제공하는 props:
  // - onSubmit: (value: AddressSearchResult) => void
  // - onAbort: (reason?: unknown) => void
}

export function AddressSearchModal({
  onSubmit,
  onAbort,
}: AddressSearchModalProps) {
  const [query, setQuery] = useState("");
  const { results, isLoading, error, search, clear } = useAddressSearch();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // 이벤트 전파 차단 (외부 form에 영향 방지)
    await search(query);
  };

  const handleSelect = (address: AddressSearchResult) => {
    clear();
    setQuery("");
    onSubmit(address); // 모달 시스템에 결과 전달
  };

  const handleClose = () => {
    clear();
    setQuery("");
    onAbort(); // 모달 시스템에 취소 전달
  };

  return (
    <Overlay id="address-search-modal" onClose={handleClose}>
      <ModalContainer size="lg">
        {/* Header */}
        <Header title="주소 검색" onClose={handleClose} />

        {/* Search Form */}
        <div className="p-4 border-b border-gray-200">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="도로명, 지번, 건물명을 입력하세요"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              intent="primary"
              size="md"
              disabled={isLoading || !query.trim()}
            >
              <Search size={18} />
              <span className="ml-1">검색</span>
            </Button>
          </form>

          {/* Search Guide */}
          <div className="mt-3 text-xs text-gray-500">
            <p>💡 도로명 + 건물번호 또는 지번 검색</p>
            <p className="mt-1">예) 판교역로 166, 삼평동 681</p>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 max-h-[400px]">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loading size="md" />
            </div>
          )}

          {error && !isLoading && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">{error}</p>
            </div>
          )}

          {!isLoading && !error && results.length === 0 && query && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">검색 결과가 없습니다</p>
              <p className="text-xs text-gray-400 mt-2">
                다른 검색어로 시도해보세요
              </p>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="space-y-2">
              {results.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSelect(result)}
                  className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <div className="space-y-1">
                    {result.roadAddress && (
                      <div className="flex items-start gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800 shrink-0">
                          도로명
                        </span>
                        <p className="text-sm font-medium text-gray-900">
                          {result.roadAddress}
                        </p>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 shrink-0">
                        지번
                      </span>
                      <p className="text-sm text-gray-600">
                        {result.jibunAddress}
                      </p>
                    </div>
                    {result.buildingName && (
                      <p className="text-xs text-gray-500 ml-12">
                        {result.buildingName}
                      </p>
                    )}
                    {result.zonecode && (
                      <p className="text-xs text-gray-400 ml-12">
                        우편번호: {result.zonecode}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isLoading && !query && (
            <div className="text-center py-8">
              <Search className="mx-auto text-gray-300 mb-3" size={48} />
              <p className="text-sm text-gray-500">주소를 검색해주세요</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <Footer>
          <Button
            intent="neutral"
            size="md"
            onClick={handleClose}
            className="w-full"
          >
            닫기
          </Button>
        </Footer>
      </ModalContainer>
    </Overlay>
  );
}
