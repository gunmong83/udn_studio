import type { Lang } from "./store";

export const UI_COPY = {
  ko: {
    nav: { products: "상품", portfolio: "포트폴리오", journal: "저널", about: "소개" },
    drawer: { menu: "전체 메뉴", studio: "스튜디오 UDN", orders: "주문 내역 / 배송 조회" },
    commerce: { title: "장바구니", empty: "장바구니가 비어 있습니다.", browse: "상품 둘러보기", decrease: "수량 감소", increase: "수량 증가", remove: "삭제", clear: "전체 비우기", total: "합계", checkout: "결제하기", note: "결제 단계에서 배송 정보와 토스 결제를 진행합니다." },
    icons: { search: "검색", account: "계정", mypage: "마이페이지 (주문/배송 조회)", login: "로그인", wishlist: "위시리스트", cart: "장바구니", signedIn: "로그인됨", admin: "관리자 센터 (주문/배송/회원 관리)" },
    footer: { sections: { support: "고객지원", business: "비지니스", member: "회원", social: "소셜" }, links: { contact: "실시간 문의", notice: "공지사항", faq: "FAQ", email: "이메일: studioudn@naver.com", mypage: "마이페이지", orders: "주문 & 배송조회", admin: "관리자 센터", smartstore: "스마트스토어", threads: "Threads", instagram: "Instagram" } },
    auth: { login: "로그인", signup: "회원가입", name: "이름", email: "이메일", emailId: "이메일 (아이디)", password: "비밀번호", passwordConfirm: "비밀번호 확인", signupIntro: "계정을 만들면 주문·배송 정보를 안전하게 관리할 수 있습니다.", agreeIntro: "회원가입을 위해 아래 약관에 동의해주세요.", terms: "이용약관", privacy: "개인정보 수집·이용", required: "동의 (필수)", loginButton: "로그인", signupButton: "가입하기", processing: "가입 처리 중…", checking: "확인 중…", googleLogin: "Google로 로그인", naverLogin: "Naver로 로그인", googleSignup: "Google로 가입", naverSignup: "Naver로 가입", logout: "로그아웃", account: "회원", admin: "관리자 계정", mypageOrders: "마이페이지 (주문 및 배송 조회)", allOrders: "주문 내역 전체 보기", cart: "장바구니", wishlist: "위시리스트", emailPlaceholder: "이메일을 입력해주세요", passwordPlaceholder: "비밀번호를 입력해주세요", namePlaceholder: "이름", passwordHint: "8자 이상", termsError: "이용약관과 개인정보 수집·이용에 동의해주세요.", passwordError: "비밀번호 확인이 일치하지 않습니다.", loginError: "이메일 또는 비밀번호를 확인해주세요.", registerError: "가입에 실패했습니다." },
  },
  en: {
    nav: { products: "PRODUCTS", portfolio: "PORTFOLIO", journal: "JOURNAL", about: "ABOUT" },
    drawer: { menu: "Main menu", studio: "Studio UDN", orders: "Orders / Delivery" },
    commerce: { title: "CART", empty: "Your cart is empty.", browse: "Browse products", decrease: "Decrease quantity", increase: "Increase quantity", remove: "Remove", clear: "Clear all", total: "Total", checkout: "Checkout", note: "Enter delivery details and complete payment with Toss at checkout." },
    icons: { search: "Search", account: "Account", mypage: "My page (orders / delivery)", login: "Sign in", wishlist: "Wishlist", cart: "Cart", signedIn: "Signed in", admin: "Admin center (orders / delivery / members)" },
    footer: { sections: { support: "Support", business: "Business", member: "Account", social: "Social" }, links: { contact: "Contact", notice: "Notice", faq: "FAQ", email: "Email: studioudn@naver.com", mypage: "My page", orders: "Orders & delivery", admin: "Admin center", smartstore: "Smart Store", threads: "Threads", instagram: "Instagram" } },
    auth: { login: "Sign in", signup: "Create account", name: "Name", email: "Email", emailId: "Email (ID)", password: "Password", passwordConfirm: "Confirm password", signupIntro: "Create an account to manage your orders and delivery information securely.", agreeIntro: "Please agree to the terms below to create an account.", terms: "Terms of use", privacy: "Privacy policy", required: "(required)", loginButton: "Sign in", signupButton: "Create account", processing: "Creating account…", checking: "Checking…", googleLogin: "Sign in with Google", naverLogin: "Sign in with Naver", googleSignup: "Sign up with Google", naverSignup: "Sign up with Naver", logout: "Sign out", account: "Member", admin: "Administrator", mypageOrders: "My page (orders and delivery)", allOrders: "View all orders", cart: "Cart", wishlist: "Wishlist", emailPlaceholder: "Enter your email", passwordPlaceholder: "Enter your password", namePlaceholder: "Name", passwordHint: "8 characters or more", termsError: "Please agree to the terms and privacy policy.", passwordError: "Passwords do not match.", loginError: "Please check your email or password.", registerError: "Sign-up failed." },
  },
} as const;

export function uiCopy(lang: Lang) {
  return UI_COPY[lang];
}
