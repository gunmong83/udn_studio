'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ArrowDown, ArrowUp, ExternalLink, Palette, ShoppingBag, X } from 'lucide-react';

const ROWS = 3;
const COLS = 4;
const TOTAL_LINES = ROWS * COLS;
const LINE_LABELS_BASE = ['Homepage<br>Map', 'Contents', 'Portfolio'];
const SECTION_SELECTORS = ['#homepage-map', '#introduce', '#portfolio'];
const LINE_SPACING = { x: 20.5, y: 19.5 };
const LINE_OFFSET = { top: 5, left: 19.5 };
const INTERSECTION_OFFSET = { top: 8.5, left: 19.5 };
const INTERSECTION_SIZE = 10;

const introduceImages = [
  { id: 'introduce-1', src: '/assets/introduce_images/introduce_1.jpg', alt: 'introduce 1' },
  { src: '/assets/introduce_images/introduce_2.jpg', alt: 'introduce 2' },
  { src: '/assets/introduce_images/introduce_3.jpg', alt: 'introduce 3' },
  { src: '/assets/introduce_images/introduce_4.jpg', alt: 'introduce 4' },
  { src: '/assets/introduce_images/introduce_5.jpg', alt: 'introduce 5' },
];

const products = [
  {
    title: 'UDN Calendar 2026 제철달력 령令',
    price: '19,000 KRW',
    amount: 19000,
    image: '/assets/portfolio_images/portfolio_1.png',
    description: 'Click to view the product on the Smart Store.',
    url: 'https://smartstore.naver.com/studioudn/products/12907475385',
    purchasable: true,
  },
  {
    title: '[ NeRyGe : To Slow ]',
    cert: 'Total Branding',
    image: '/assets/portfolio_images/portfolio_2.jpg',
    gallery: [
      '/assets/portfolio_images/portfolio_2.jpg',
      '/assets/portfolio_images/portfolio_2/1.jpeg',
      '/assets/portfolio_images/portfolio_2/2.jpg',
      '/assets/portfolio_images/portfolio_2/3.jpeg',
      '/assets/portfolio_images/portfolio_2/4.jpeg',
    ],
    description:
      'the cake house in Naju, Jeonam, Korea convey the meaning of speed in right time, NeRyGe, on its logo with its cakebox and businesscard ',
  },
  {
    title: '[ the TOV ]',
    cert: 'Total Branding',
    image: '/assets/portfolio_images/portfolio_3.jpg',
    description:
      'publishing company in Gwaheon, Kyunggido, Korea A Hangul logo design inspired by Korean Palgwe (which can be seen on South Korean  lag, the Eight Trigrams) representing book and barcode as well as the Korean word TOV',
  },
  {
    title: '[ Louivis BeBe ]',
    cert: 'Total Branding',
    image: '/assets/portfolio_images/portfolio_4.jpg',
    description:
      'A party, catering, and banquet company that primarily prepares first-birthday celebrations for children and milestone birthday banquets for adults, serving as a bridge that connects past and present, and links tradition with modernity.',
  },
  {
    title: '[ Flowing Lines, Staying Moon ]',
    cert: 'Exhibition Poster',
    image: '/assets/portfolio_images/portfolio_5.jpg',
    description:
      'Reimagining the painterly style of artist Yuyeon, the lines were set in motion while the moon was made to linger. A business card composed of luminous lines was also produced as part of the project.',
  },
  {
    title: '[ The 10th YAHO Festival ]',
    cert: 'Poster',
    image: '/assets/portfolio_images/portfolio_6.jpg',
    description:
      'A poster commissioned by the Jung-gu Youth Center in Seoul. The typography was designed to suit Deoksugung Stone Wall Road, a historically significant site in Korea, and Korean traditional mother-of-pearl (najeon) material was incorporated.',
  },
  {
    title: '[ Menbal Kindergarten ]',
    cert: 'Total Branding',
    image: '/assets/portfolio_images/portfolio_7.jpg',
    description:
      'Logo and T-shirt production. The logo was printed large on the back to enhance visibility so that children and teachers can recognize one another.',
  },
];

function createRepeatingList(values, count) {
  return Array.from({ length: count }, (_, index) => values[index % values.length]);
}

export default function Home() {
  const [activeIntroduce, setActiveIntroduce] = useState(0);
  const [showTopButton, setShowTopButton] = useState(false);
  const [overlayProduct, setOverlayProduct] = useState(null);
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [activeGallery, setActiveGallery] = useState(0);
  const [checkoutStatus, setCheckoutStatus] = useState('');
  const introduceScrollRef = useRef(null);
  const overlayGalleryScrollRef = useRef(null);
  const lineRefs = useRef([]);
  const textRefs = useRef([]);
  const mouseOverRef = useRef(Array.from({ length: TOTAL_LINES }, () => false));
  const lineTimelineRef = useRef(null);
  const lineLabels = useMemo(() => createRepeatingList(LINE_LABELS_BASE, TOTAL_LINES), []);
  const lineTargets = useMemo(() => createRepeatingList(SECTION_SELECTORS, TOTAL_LINES), []);
  const lineCoords = useMemo(() => {
    const coords = [];
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        coords.push({
          top: LINE_OFFSET.top + row * LINE_SPACING.y,
          left: LINE_OFFSET.left + col * LINE_SPACING.x,
          degree: row % 2 ? '135deg' : '45deg',
        });
      }
    }
    return coords;
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowTopButton(window.scrollY > 300);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    let sessionId = window.localStorage.getItem('udn_metrics_session');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      window.localStorage.setItem('udn_metrics_session', sessionId);
    }

    const startedAt = Date.now();
    const path = `${window.location.pathname}${window.location.search}`;
    const referrer = document.referrer;

    const sendMetric = (event) => {
      const payload = {
        sessionId,
        path,
        referrer,
        event,
        durationSeconds: Math.max(0, Math.round((Date.now() - startedAt) / 1000)),
      };
      const body = JSON.stringify(payload);

      if (event === 'end' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/metrics/events', new Blob([body], { type: 'application/json' }));
        return;
      }

      fetch('/api/metrics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    };

    sendMetric('pageview');
    const interval = window.setInterval(() => sendMetric('heartbeat'), 15000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendMetric('end');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', () => sendMetric('end'));

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (lineTimelineRef.current) {
      lineTimelineRef.current.kill();
    }

    const timeline = gsap.timeline({
      repeat: -1,
      repeatDelay: 2,
      repeatRefresh: true,
    });

    for (let row = 0; row < ROWS; row += 1) {
      const lineIndices = Array.from({ length: COLS }, (_, col) => row * COLS + col);
      if (row % 2 === 1) {
        lineIndices.reverse();
      }

      lineIndices.forEach((index, i) => {
        const line = lineRefs.current[index];
        if (!line) {
          return;
        }
        timeline.to(
          line,
          {
            rotation: '-=90',
            duration: 0.5,
            ease: 'power1.inOut',
          },
          i === 0 ? '-=0.0' : '-=0.4',
        );
      });
    }

    lineTimelineRef.current = timeline;
    return () => timeline.kill();
  }, []);

  function handleIntroduceScroll() {
    const el = introduceScrollRef.current;
    if (!el || !el.clientWidth) {
      return;
    }
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIntroduce(Math.min(introduceImages.length - 1, Math.max(0, index)));
  }

  function scrollIntroduceTo(index) {
    const el = introduceScrollRef.current;
    if (!el || !el.clientWidth) {
      return;
    }
    el.scrollTo({ left: el.clientWidth * index, behavior: 'smooth' });
  }

  function scrollToSection(direction) {
    const targets = SECTION_SELECTORS.map((selector) => document.querySelector(selector)).filter(Boolean);
    if (!targets.length) {
      return;
    }

    const currentY = window.scrollY;
    const target =
      direction === 'next'
        ? targets.find((el) => el.offsetTop > currentY + 5)
        : targets
            .slice()
            .reverse()
            .find((el) => el.offsetTop < currentY - 5);

    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleLineEnter(index) {
    const label = lineLabels[index];
    const line = lineRefs.current[index];
    const text = textRefs.current[index];
    if (!label || !line || !text) {
      return;
    }

    mouseOverRef.current[index] = true;
    const timeline = gsap.timeline();
    timeline.to(line, {
      x: '-5vw',
      duration: 0.5,
      width: '10vw',
      color: 'transparent',
      backgroundColor: 'transparent',
    });
    timeline.call(() => {
      if (!mouseOverRef.current[index]) {
        timeline.pause();
      }
    });
    timeline.to(text, {
      duration: 0.5,
      backgroundColor: 'transparent',
      textAlign: 'center',
      fontSize: '2vw',
      color: '#ffffff',
      innerHTML: label,
      ease: 'power1.inOut',
    });
    text.style.cursor = 'pointer';
  }

  function handleLineLeave(index) {
    const line = lineRefs.current[index];
    const text = textRefs.current[index];
    if (!line || !text) {
      return;
    }

    mouseOverRef.current[index] = false;
    const timeline = gsap.timeline();
    timeline.to(text, {
      duration: 0.5,
      fontSize: '0vw',
      ease: 'power1.inOut',
    });
    timeline.call(() => {
      if (mouseOverRef.current[index]) {
        timeline.pause();
      }
    });
    timeline.to(line, {
      x: '0vw',
      duration: 0.5,
      width: '0.15vw',
      color: '#ffffff',
      backgroundColor: '#ffffff',
    });
    text.style.cursor = 'default';
  }

  function handleLineClick(index) {
    const target = document.querySelector(lineTargets[index]);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleOverlayScroll() {
    const el = overlayGalleryScrollRef.current;
    if (!el || !el.clientWidth) {
      return;
    }
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveGallery(Math.min((overlayProduct?.gallery?.length || 1) - 1, Math.max(0, index)));
  }

  function scrollOverlayTo(index) {
    const el = overlayGalleryScrollRef.current;
    if (!el || !el.clientWidth) {
      return;
    }
    el.scrollTo({ left: el.clientWidth * index, behavior: 'smooth' });
  }

  async function handleCheckoutSubmit(event) {
    event.preventDefault();
    setCheckoutStatus('주문 정보를 저장하는 중입니다.');
    const formData = new FormData(event.currentTarget);
    const customer = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/api/payments/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: {
            name: checkoutProduct.title,
            amount: checkoutProduct.amount,
          },
          customer,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || '결제 준비에 실패했습니다.');
      }

      setCheckoutStatus(
        payload.checkout.clientKey
          ? '결제창 연동 준비가 완료되었습니다. Toss Payments SDK 연결 후 바로 사용할 수 있습니다.'
          : `개발 주문이 저장되었습니다. 주문번호: ${payload.checkout.orderId}`,
      );
    } catch (error) {
      setCheckoutStatus(error.message);
    }
  }

  return (
    <main className="home-wrapper">
      <section className="app-showcase">
        <div className="background-main">
          <Image
            className="bg-img"
            src="/assets/main_background.png"
            alt="Studio Undesignated - Total Branding Studio Seoul, Naju, Gwaheon"
            width={1920}
            height={1080}
            priority
          />
          <div className="overlay">
            {lineCoords.map((coord, index) => (
              <div
                className="line"
                key={`line-${index}`}
                ref={(el) => {
                  lineRefs.current[index] = el;
                }}
                style={{
                  width: '0.15vw',
                  height: '17vw',
                  backgroundColor: '#ffffff',
                  position: 'absolute',
                  top: `${coord.top}vw`,
                  left: `${coord.left}vw`,
                  transform: `rotate(${coord.degree})`,
                }}
              />
            ))}
            {lineCoords.map((_, index) => {
              const row = Math.floor(index / COLS);
              const col = index % COLS;
              return (
                <button
                  className="intersection"
                  key={`intersection-${index}`}
                  ref={(el) => {
                    textRefs.current[index] = el;
                  }}
                  type="button"
                  aria-label={lineLabels[index].replace('<br>', ' ')}
                  onMouseEnter={() => handleLineEnter(index)}
                  onMouseLeave={() => handleLineLeave(index)}
                  onClick={() => handleLineClick(index)}
                  style={{
                    width: `${INTERSECTION_SIZE}vw`,
                    height: `${INTERSECTION_SIZE}vw`,
                    top: `${INTERSECTION_OFFSET.top + row * LINE_SPACING.y}vw`,
                    left: `${INTERSECTION_OFFSET.left + col * LINE_SPACING.x - INTERSECTION_SIZE / 2}vw`,
                  }}
                />
              );
            })}
          </div>
        </div>

        <Image
          id="homepage-map"
          className="bg-map"
          src="/assets/introduce_images/homepage_map.png"
          alt="Studio Undesignated Project Map - Branding and Design Locations in Korea"
          width={1920}
          height={1080}
        />

        <div id="introduce" className="introduce-scroll-wrap">
          <div className="visually-hidden" aria-hidden="false">
            <h2>Studio Undesignated의 철학 (Our Philosophy)</h2>
            <p>
              Studio Undesignated(스튜디오 UDN)는 정해지지 않은 가능성을 디자인하는 토탈 브랜딩
              스튜디오입니다.
            </p>
            <p>
              서울의 현대적 감각과 나주, 과천의 지역적 특색을 결합하여 로고 디자인부터 전시
              포스터, 패키지까지 브랜드가 전달하고자 하는 본질적인 메시지를 시각화합니다.
            </p>
          </div>
          <div className="introduce-scroll" ref={introduceScrollRef} onScroll={handleIntroduceScroll}>
            {introduceImages.map((image) => (
              <Image
                className="bg-map introduce-image"
                id={image.id}
                key={image.src}
                src={image.src}
                alt={`Studio Undesignated Design Process - ${image.alt}`}
                width={1920}
                height={1080}
              />
            ))}
          </div>
          <div className="dot-row introduce-dots" aria-hidden="true">
            {introduceImages.map((image, index) => (
              <button
                className={`dot ${index === activeIntroduce ? 'dot--active' : ''}`}
                key={`dot-${image.src}`}
                type="button"
                onClick={() => scrollIntroduceTo(index)}
              />
            ))}
          </div>
        </div>
      </section>

      <Portfolio
        products={products}
        onOpenOverlay={(product) => {
          setOverlayProduct(product);
          setActiveGallery(0);
        }}
        onCheckout={(product) => {
          setCheckoutProduct(product);
          setCheckoutStatus('');
        }}
      />

      {showTopButton && (
        <div className="floating-buttons">
          <button className="top-label-button" type="button" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Top
          </button>
          <button className="round-button" type="button" aria-label="Previous image" onClick={() => scrollToSection('prev')}>
            <ArrowUp size={24} strokeWidth={2.5} />
          </button>
          <button className="round-button" type="button" aria-label="Next image" onClick={() => scrollToSection('next')}>
            <ArrowDown size={24} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {overlayProduct && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="overlay-card">
            <div className="overlay-header">
              <div className="overlay-title">{overlayProduct.title}</div>
              <button className="icon-button overlay-close" type="button" onClick={() => setOverlayProduct(null)} aria-label="Close image">
                <X size={24} />
              </button>
            </div>
            {overlayProduct.gallery?.length ? (
              <div className="overlay-gallery">
                <div className="overlay-gallery-scroll" ref={overlayGalleryScrollRef} onScroll={handleOverlayScroll}>
                  {overlayProduct.gallery.map((image, index) => (
                    <img className="overlay-gallery-image" key={`gallery-${image}`} src={image} alt={`${overlayProduct.title} ${index + 1}`} />
                  ))}
                </div>
                <div className="dot-row overlay-gallery-dots" aria-hidden="true">
                  {overlayProduct.gallery.map((image, index) => (
                    <button
                      className={`dot ${index === activeGallery ? 'dot--active' : ''}`}
                      key={`gallery-dot-${image}`}
                      type="button"
                      onClick={() => scrollOverlayTo(index)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <img className="overlay-image" src={overlayProduct.image} alt={overlayProduct.title} />
            )}
            {overlayProduct.description && <p className="overlay-desc">{overlayProduct.description}</p>}
          </div>
        </div>
      )}

      {checkoutProduct && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form className="checkout-card" onSubmit={handleCheckoutSubmit}>
            <div className="overlay-header">
              <div className="overlay-title">Order</div>
              <button className="icon-button overlay-close" type="button" onClick={() => setCheckoutProduct(null)} aria-label="Close checkout">
                <X size={24} />
              </button>
            </div>
            <div className="checkout-product">
              <img src={checkoutProduct.image} alt={checkoutProduct.title} />
              <div>
                <strong>{checkoutProduct.title}</strong>
                <span>{checkoutProduct.price}</span>
              </div>
            </div>
            <label>
              Name
              <input name="name" required autoComplete="name" />
            </label>
            <label>
              Email
              <input name="email" type="email" autoComplete="email" />
            </label>
            <label>
              Phone
              <input name="phone" required autoComplete="tel" />
            </label>
            <label>
              Address
              <input name="address" autoComplete="street-address" />
            </label>
            <label>
              Memo
              <textarea name="memo" rows={3} />
            </label>
            <button className="checkout-submit" type="submit">
              결제 정보 저장
            </button>
            {checkoutStatus && <p className="checkout-status">{checkoutStatus}</p>}
          </form>
        </div>
      )}
    </main>
  );
}

function Portfolio({ products, onOpenOverlay, onCheckout }) {
  return (
    <section id="portfolio" className="portfolio">
      <div className="portfolio-container">
        <div className="title-row">
          <h2 className="title">Portfolio</h2>
        </div>
        <div className="portfolio-grid">
          {products.map((product) => (
            <article className={`portfolio-card ${product.url ? 'portfolio-card--product' : 'portfolio-card--art'}`} key={product.title}>
              <button
                className="card-main"
                type="button"
                onClick={() => (product.url ? window.open(product.url, '_blank', 'noopener,noreferrer') : onOpenOverlay(product))}
              >
                <span className="card-label" aria-hidden="true">
                  {product.url ? <ShoppingBag size={14} /> : <Palette size={14} />}
                </span>
                <Image className="card-image" src={product.image} alt={`${product.title} - Studio Undesignated branding project in Korea`} width={700} height={700} />
                <span className="product-title">{product.title}</span>
                {product.cert && <span className="cert">{product.cert}</span>}
                {product.price && <span className="price">{product.price}</span>}
              </button>
              {product.url && (
                <a className="external-link" href={product.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" aria-label="Open product in new tab">
                  <ExternalLink size={18} />
                </a>
              )}
              {product.purchasable && (
                <button className="buy-button" type="button" onClick={() => onCheckout(product)}>
                  Buy
                </button>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
