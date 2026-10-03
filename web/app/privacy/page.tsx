import Link from "next/link";

export const metadata = { title: "개인정보처리방침 | Studio Undesignated" };

export default function PrivacyPage() {
  return (
    <article className="w-full px-3 pb-section pt-section">
      <div className="mx-auto max-w-[720px]">
        <Link href="/signup" className="text-util text-muted transition-colors hover:text-text">← 회원가입으로 돌아가기</Link>
        <h1 className="mt-8 text-label font-bold text-text">개인정보 수집·이용 안내</h1>
        <div className="mt-8 space-y-8 text-body leading-7 text-text">
          <section><h2 className="font-semibold">1. 수집하는 정보</h2><p className="mt-2">회원가입과 주문을 위해 이메일, 이름, 배송지, 연락처 및 주문·결제 내역을 수집할 수 있습니다. 소셜 로그인 이용 시 해당 제공자가 전달하는 식별자와 기본 프로필 정보를 받을 수 있습니다.</p></section>
          <section><h2 className="font-semibold">2. 이용 목적</h2><p className="mt-2">수집한 정보는 회원 식별, 주문 처리, 배송, 고객 문의 대응, 부정 이용 방지와 서비스 개선을 위해 사용합니다.</p></section>
          <section><h2 className="font-semibold">3. 보관 및 파기</h2><p className="mt-2">개인정보는 이용 목적이 달성되거나 회원이 탈퇴한 뒤 관련 법령에서 정한 보관 기간이 지나면 지체 없이 파기합니다. 법령상 보존이 필요한 주문·결제 기록은 해당 기간 동안 별도로 보관합니다.</p></section>
          <section><h2 className="font-semibold">4. 이용자의 권리</h2><p className="mt-2">회원은 자신의 개인정보에 대해 조회, 정정, 삭제 및 처리 정지를 요청할 수 있습니다. 요청은 고객지원 채널을 통해 접수해 주세요.</p></section>
          <section><h2 className="font-semibold">5. 보호조치</h2><p className="mt-2">회사는 접근 권한 관리, 암호화, 안전한 인증 처리 등 합리적인 보호조치를 적용하여 개인정보를 관리합니다.</p></section>
        </div>
      </div>
    </article>
  );
}
