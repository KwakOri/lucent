import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4">
      <div className="max-w-[800px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button intent="secondary" size="sm">
              <ArrowLeft className="w-4 h-4" />
              홈으로
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-xl p-8 md:p-12 border border-neutral-200">
          {/* Page Title */}
          <div className="mb-8 pb-6 border-b border-neutral-200">
            <h1 className="text-4xl font-bold text-text-primary mb-2">
              개인정보처리방침
            </h1>
            <p className="text-sm text-text-secondary">
              시행일자: 2025년 1월 1일
            </p>
          </div>

          {/* Privacy Policy Content */}
          <div className="space-y-8 text-text-primary">
            <section>
              <h2 className="text-2xl font-bold mb-4">
                제1조 (개인정보의 수집 및 이용 목적)
              </h2>
              <div className="space-y-2 text-text-secondary">
                <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다:</p>
                <ul className="list-decimal list-inside ml-4 space-y-1">
                  <li>회원 가입 및 관리</li>
                  <li>상품 주문 및 배송</li>
                  <li>디지털 상품 제공</li>
                  <li>고객 상담 및 불만 처리</li>
                  <li>서비스 개선 및 통계 분석</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">
                제2조 (수집하는 개인정보의 항목)
              </h2>
              <div className="space-y-3 text-text-secondary">
                <p className="font-semibold text-text-primary">
                  1. 필수 항목
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>이메일 주소</li>
                  <li>비밀번호 (암호화 저장)</li>
                </ul>

                <p className="font-semibold text-text-primary">
                  2. 선택 항목 (실물 굿즈 구매 시)
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>배송지 주소</li>
                  <li>연락처</li>
                  <li>수령인 이름</li>
                </ul>

                <p className="font-semibold text-text-primary">
                  3. 자동 수집 항목
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>IP 주소</li>
                  <li>쿠키</li>
                  <li>서비스 이용 기록</li>
                  <li>접속 로그</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">
                제3조 (개인정보의 보유 및 이용 기간)
              </h2>
              <div className="space-y-2 text-text-secondary">
                <p>1. 회원 탈퇴 시까지 보유 및 이용합니다.</p>
                <p>
                  2. 단, 관련 법령에 따라 다음과 같이 일정 기간 보관합니다:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>
                    계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)
                  </li>
                  <li>
                    대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)
                  </li>
                  <li>
                    소비자의 불만 또는 분쟁처리에 관한 기록: 3년
                    (전자상거래법)
                  </li>
                  <li>웹사이트 방문 기록: 3개월 (통신비밀보호법)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">
                제4조 (개인정보의 제3자 제공)
              </h2>
              <div className="space-y-2 text-text-secondary">
                <p>
                  1. 회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지
                  않습니다.
                </p>
                <p>2. 다만, 다음의 경우에는 예외로 합니다:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>이용자가 사전에 동의한 경우</li>
                  <li>법령의 규정에 의하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">
                제5조 (개인정보의 파기 절차 및 방법)
              </h2>
              <div className="space-y-2 text-text-secondary">
                <p>
                  1. 회사는 개인정보 보유기간의 경과, 처리목적 달성 등
                  개인정보가 불필요하게 되었을 때에는 지체 없이 해당
                  개인정보를 파기합니다.
                </p>
                <p>2. 파기 절차:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>
                    이용자가 입력한 정보는 목적 달성 후 별도의 DB로 옮겨져
                    내부 방침 및 기타 관련 법령에 의한 정보보호 사유에 따라
                    일정 기간 저장된 후 파기됩니다.
                  </li>
                </ul>
                <p>3. 파기 방법:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>전자적 파일 형태: 복구 및 재생이 불가능한 방법으로 영구 삭제</li>
                  <li>
                    종이 문서: 분쇄하거나 소각
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">
                제6조 (개인정보 보호를 위한 기술적/관리적 대책)
              </h2>
              <div className="space-y-2 text-text-secondary">
                <p>
                  회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를
                  취하고 있습니다:
                </p>
                <ul className="list-decimal list-inside ml-4 space-y-1">
                  <li>비밀번호 암호화 저장 및 관리</li>
                  <li>해킹 등에 대비한 보안 프로그램 설치 및 갱신</li>
                  <li>개인정보 취급 직원의 최소화 및 교육</li>
                  <li>개인정보에 대한 접근 제한</li>
                  <li>접속 기록의 보관 및 위변조 방지</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">
                제7조 (개인정보 관리책임자)
              </h2>
              <div className="space-y-2 text-text-secondary">
                <p>
                  회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고,
                  개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을
                  위하여 아래와 같이 개인정보 관리책임자를 지정하고 있습니다.
                </p>
                <div className="bg-neutral-50 p-4 rounded-lg mt-4">
                  <p className="font-semibold text-text-primary">
                    개인정보 관리책임자
                  </p>
                  <ul className="mt-2 space-y-1">
                    <li>이메일: privacy@lucent-management.com</li>
                    <li>
                      정보주체는 회사의 서비스를 이용하면서 발생한 모든
                      개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한
                      사항을 개인정보 관리책임자에게 문의하실 수 있습니다.
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">
                제8조 (권익침해 구제방법)
              </h2>
              <div className="space-y-2 text-text-secondary">
                <p>
                  정보주체는 개인정보침해로 인한 구제를 받기 위하여 다음의
                  기관에 분쟁해결이나 상담 등을 신청할 수 있습니다:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>
                    개인정보 침해신고센터 (privacy.kisa.or.kr / 국번없이 118)
                  </li>
                  <li>
                    개인정보 분쟁조정위원회 (www.kopico.go.kr / 1833-6972)
                  </li>
                  <li>대검찰청 사이버범죄수사단 (www.spo.go.kr / 02-3480-3573)</li>
                  <li>경찰청 사이버안전국 (cyberbureau.police.go.kr / 국번없이 182)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">
                제9조 (개인정보처리방침의 변경)
              </h2>
              <p className="leading-relaxed text-text-secondary">
                이 개인정보처리방침은 2025년 1월 1일부터 적용되며, 법령 및
                방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는
                변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
              </p>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-neutral-200 flex justify-center gap-4">
            <Link href="/">
              <Button intent="primary">홈으로 돌아가기</Button>
            </Link>
            <Link href="/terms">
              <Button intent="secondary">이용약관 보기</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
