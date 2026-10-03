import Link from "next/link";

export const metadata = { title: "이용약관 | Studio Undesignated" };

export default function TermsPage() {
  return (
    <article className="w-full px-3 pb-section pt-section">
      <div className="mx-auto max-w-[720px]">
        <Link href="/signup" className="text-util text-muted transition-colors hover:text-text">← 회원가입으로 돌아가기</Link>
        <h1 className="mt-8 text-label font-bold text-text">이용약관</h1>
        <div className="mt-8 space-y-8 text-body leading-7 text-text">
          <section><h2 className="font-semibold">제1조 (목적)</h2><p className="mt-2">이 약관은 Studio Undesignated(이하 “회사”)가 제공하는 웹사이트 및 상품 판매 서비스의 이용 조건과 절차를 정하는 것을 목적으로 합니다.</p></section>
          <section><h2 className="font-semibold">제2조 (서비스 이용)</h2><p className="mt-2">회원은 정확한 정보를 제공해야 하며, 계정과 비밀번호를 안전하게 관리할 책임이 있습니다. 회사는 서비스 운영상 필요한 경우 사전에 안내하고 서비스 내용을 변경할 수 있습니다.</p></section>
          <section><h2 className="font-semibold">제3조 (주문·결제·배송)</h2><p className="mt-2">상품 주문은 결제 완료 시 확정됩니다. 배송 일정과 교환·반품 조건은 상품 안내 및 주문 과정에서 고지한 기준을 따릅니다.</p></section>
          <section><h2 className="font-semibold">제4조 (회원 탈퇴 및 이용 제한)</h2><p className="mt-2">회원은 언제든 탈퇴를 요청할 수 있습니다. 법령 위반, 타인의 권리 침해 또는 서비스 운영을 방해하는 행위가 확인되면 이용이 제한될 수 있습니다.</p></section>
          <section><h2 className="font-semibold">제5조 (문의)</h2><p className="mt-2">약관에 관한 문의는 사이트의 고객지원 채널을 이용해 주세요.</p></section>
        </div>
      </div>
    </article>
  );
}
