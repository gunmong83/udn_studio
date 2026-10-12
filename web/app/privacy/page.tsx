import Link from "next/link";

export const metadata = { title: "개인정보처리방침 | Studio Undesignated" };

export default function PrivacyPage() {
  return (
    <article className="w-full px-3 pb-section pt-section">
      <div className="mx-auto max-w-[720px]">
        <Link href="/signup" className="text-util text-muted transition-colors hover:text-text">← 회원가입으로 돌아가기</Link>
        <h1 className="mt-8 text-label font-bold text-text">개인정보 수집·이용 안내</h1>
        <div className="mt-8 space-y-8 text-body leading-7 text-text">
          <section>
            <h2 className="font-semibold">1. 수집하는 정보</h2>
            <p className="mt-2">회원가입과 주문 과정에서 이메일, 이름, 휴대전화번호, 배송지, 주문·결제 내역을 수집합니다. 소셜 로그인 이용 시 해당 제공자가 전달하는 식별자와 기본 프로필 정보를 받을 수 있습니다.</p>
            <div className="mt-4 border border-line p-4">
              <h3 className="font-medium">회원가입 필수 항목: 휴대전화번호</h3>
              <p className="mt-2">이용 목적: 회원 연락처 확인, 주문·배송 안내, 배송 및 고객 문의 처리</p>
              <p>보유 기간: 회원 탈퇴 시까지. 탈퇴하면 계정의 휴대전화번호를 지체 없이 삭제합니다. 다만 법령에 따라 보관해야 하는 주문 기록은 계정 정보와 분리해 해당 법정 기간 동안 보관하며, 기간이 끝나면 파기합니다.</p>
              <p>동의 거부 권리와 불이익: 동의를 거부할 수 있으나, 회원 연락처 확인 및 주문·배송 서비스 제공에 필요한 항목이므로 회원가입이 제한됩니다.</p>
              <p className="mt-2">현재 회원가입 시 휴대전화번호를 입력받으며, 번호 인증 기능은 제공하지 않습니다. 휴대전화번호는 광고성 정보 발송에 사용하지 않습니다.</p>
            </div>
          </section>
          <section><h2 className="font-semibold">2. 이용 목적</h2><p className="mt-2">수집한 정보는 회원 식별 및 연락처 확인, 주문 처리, 결제, 배송, 반품·교환 및 고객 문의 대응, 부정 이용 방지와 서비스 개선을 위해 사용합니다.</p></section>
          <section><h2 className="font-semibold">3. 보관 및 파기</h2><p className="mt-2">회원 탈퇴 시 로그인 계정, 소셜 로그인 연결 정보, 기본 배송지 등 서비스 이용에 필요한 개인정보는 지체 없이 삭제합니다. 주문·결제 기록은 전자상거래 관련 법령에 따라 계약·청약철회 및 대금결제·재화 공급 기록을 최대 5년, 소비자 불만·분쟁 처리 기록을 최대 3년 보관할 수 있습니다. 이때 주문 원장에 남는 배송지·연락처 등은 탈퇴 즉시 삭제 또는 익명화하며, 정산·법적 의무에 필요한 최소 정보만 보관합니다. 보관 기간이 지나면 해당 기록도 지체 없이 파기합니다.</p></section>
          <section><h2 className="font-semibold">4. 이용자의 권리</h2><p className="mt-2">회원은 자신의 개인정보에 대해 조회, 정정, 삭제 및 처리 정지를 요청할 수 있습니다. 요청은 고객지원 채널을 통해 접수해 주세요.</p></section>
          <section><h2 className="font-semibold">5. 보호조치</h2><p className="mt-2">회사는 접근 권한 관리, 암호화, 안전한 인증 처리 등 합리적인 보호조치를 적용하여 개인정보를 관리합니다.</p></section>
        </div>
      </div>
    </article>
  );
}
