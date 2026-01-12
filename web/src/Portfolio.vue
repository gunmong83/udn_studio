<template>
  <section id="portfolio" class="portfolio">
    <v-container class="portfolio-container">
      <div class="title-row">
        <h2 class="title">Portfolio</h2>
      </div>

      <v-row class="portfolio-grid" dense>
        <v-col
          v-for="(product, i) in products"
          :key="product.title"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <v-card
            class="portfolio-card"
            :class="{
              'portfolio-card--art': !product.url,
              'portfolio-card--product': !!product.url,
            }"
            elevation="2"
            :href="product.url || undefined"
            :target="product.url ? '_blank' : undefined"
            :rel="product.url ? 'noopener noreferrer' : undefined"
            :referrerpolicy="product.url ? 'no-referrer' : undefined"
            :ripple="!!product.url"
            @click="product.url ? null : openOverlay(product)"
          >
            <v-chip
              class="card-label"
              size="x-small"
              variant="plain"
            >
              <v-icon size="14">
                {{ product.url ? 'mdi-shopping-outline' : 'mdi-palette-outline' }}
              </v-icon>
            </v-chip>
            <v-img
              :src="product.image"
              :alt="product.title"
              class="card-image"
              contain
            />
            <v-card-title class="product-title">
              <span class="product-title-text">{{ product.title }}</span>
            </v-card-title>
            <v-card-subtitle v-if="product.cert" class="cert">
              {{ product.cert }}
            </v-card-subtitle>
            <div class="meta-row">
              <v-card-subtitle v-if="product.price" class="price">
                {{ product.price }}
              </v-card-subtitle>
              <v-btn
                v-if="product.url"
                class="external-link"
                variant="text"
                icon="mdi-open-in-new"
                :href="product.url"
                target="_blank"
                rel="noopener noreferrer"
                referrerpolicy="no-referrer"
                aria-label="Open product in new tab"
              />
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <v-dialog v-model="overlayOpen" class="overlay" max-width="1200">
      <v-card class="overlay-card">
        <div v-if="overlayTitle" class="overlay-header">
          <div class="overlay-title">{{ overlayTitle }}</div>
          <v-btn
            class="overlay-close"
            variant="text"
            icon="mdi-close-box"
            @click="closeOverlay"
            aria-label="Close image"
          />
        </div>
        <div v-if="overlayGallery.length" class="overlay-gallery">
          <div
            class="overlay-gallery-scroll"
            ref="overlayGalleryScroll"
            @scroll="handleOverlayScroll"
          >
            <img
              v-for="(image, index) in overlayGallery"
              :key="`gallery-${index}`"
              class="overlay-gallery-image"
              :src="image"
              :alt="`${overlayAlt} ${index + 1}`"
            />
          </div>
          <div class="overlay-gallery-dots" aria-hidden="true">
            <v-icon
              v-for="(image, index) in overlayGallery"
              :key="`gallery-dot-${index}`"
              class="overlay-gallery-dot"
              :class="{ 'overlay-gallery-dot--active': index === activeGallery }"
              @click="scrollOverlayTo(index)"
            >
              {{ index === activeGallery ? 'mdi-circle' : 'mdi-circle-outline' }}
            </v-icon>
          </div>
        </div>
        <v-img
          v-else
          class="overlay-image"
          :src="overlayImage"
          :alt="overlayAlt"
          contain
        />
        <v-card-text v-if="overlayDesc" class="overlay-desc">
          {{ overlayDesc }}
        </v-card-text>
      </v-card>
    </v-dialog>
  </section>
</template>

<script>
import portfolio1 from './assets/portfolio_images/portfolio_1.png';
import portfolio2 from './assets/portfolio_images/portfolio_2.jpg';
import portfolio2Image1 from './assets/portfolio_images/portfolio_2/1.jpg';
import portfolio2Image2 from './assets/portfolio_images/portfolio_2/2.jpg';
import portfolio2Image3 from './assets/portfolio_images/portfolio_2/3.jpeg';
import portfolio2Image4 from './assets/portfolio_images/portfolio_2/4.jpeg';
import portfolio2Image5 from './assets/portfolio_images/portfolio_2/5.jpeg';
import portfolio3 from './assets/portfolio_images/portfolio_3.jpg';
import portfolio4 from './assets/portfolio_images/portfolio_4.jpg';
import portfolio5 from './assets/portfolio_images/portfolio_5.jpg';
import portfolio6 from './assets/portfolio_images/portfolio_6.jpg';
import portfolio7 from './assets/portfolio_images/portfolio_7.jpg';

export default {
  name: 'Portfolio',
  data() {
    return {
      overlayOpen: false,
      overlayImage: '',
      overlayAlt: '',
      overlayDesc: '',
      overlayTitle: '',
      overlayGallery: [],
      activeGallery: 0,
      products: [
        {
          title: 'UDN Calendar 2026 제철달력 령令',
          price: 'See store',
          image: portfolio1,
          description: 'Click to view the product on the Smart Store.',
          url: 'https://smartstore.naver.com/studioudn/products/12907475385',
        },
        {
          title: '[ NeRyGe : To Slow ]',
          cert: 'Total Branding',
          image: portfolio2,
          gallery: [
            portfolio2,
            portfolio2Image1,
            portfolio2Image2,
            portfolio2Image3,
            portfolio2Image4,
            portfolio2Image5,
          ],
          description: 'the cake house in Naju, Jeonam, Korea convey the meaning of speed in right time, NeRyGe, on its logo with its cakebox and businesscard ',
        },
        {
          title: '[ the TOV ]',
          cert: 'Total Branding',
          image: portfolio3,
          description: 'publishing company in Gwaheon, Kyunggido, Korea A Hangul logo design inspired by Korean Palgwe (which can be seen on South Korean  lag, the Eight Trigrams) representing book and barcode as well as the Korean word TOV',
        },
        {
          title: '[ Louivis BeBe ]',
          cert: 'Total Branding',
          image: portfolio4,
          description: 'A party, catering, and banquet company that primarily prepares first-birthday celebrations for children and milestone birthday banquets for adults, serving as a bridge that connects past and present, and links tradition with modernity.',
        },
        {
          title: '[ Flowing Lines, Staying Moon ]',
          cert: 'Exhibition Poster',
          image: portfolio5,
          description: 'Reimagining the painterly style of artist Yuyeon, the lines were set in motion while the moon was made to linger. A business card composed of luminous lines was also produced as part of the project.',
        },
        {
          title: '[ The 10th YAHO Festival ]',
          cert: 'Poster',
          image: portfolio6,
          description: 'A poster commissioned by the Jung-gu Youth Center in Seoul. The typography was designed to suit Deoksugung Stone Wall Road, a historically significant site in Korea, and Korean traditional mother-of-pearl (najeon) material was incorporated. Rather than creating graphics from scratch, the visual work focused on editing, proofreading, and layout arrangement. Although the commission was originally for a single poster, strong enthusiasm led to the production of a second version, resulting in two poster designs.',
        },
        {
          title: '[ Menbal Kindergarten ]',
          cert: 'Total Branding',
          image: portfolio7,
          description: 'Logo and T-shirt production. The logo was printed large on the back to enhance visibility—so that children and teachers can recognize one another and not lose track of each other, even by their backs rather than their faces.',
        },
      ],
    };
  },
  methods: {
    openOverlay(product) {
      this.overlayImage = product.image;
      this.overlayAlt = product.title || 'Artwork';
      this.overlayTitle = product.title || '';
      this.overlayDesc = product.description || '';
      this.overlayGallery = Array.isArray(product.gallery) ? product.gallery : [];
      this.activeGallery = 0;
      this.overlayOpen = true;
      this.$nextTick(() => {
        const el = this.$refs.overlayGalleryScroll;
        if (el && el.scrollLeft) {
          el.scrollLeft = 0;
        }
      });
    },
    closeOverlay() {
      this.overlayOpen = false;
      this.overlayDesc = '';
      this.overlayTitle = '';
      this.overlayGallery = [];
      this.activeGallery = 0;
    },
    handleOverlayScroll() {
      const el = this.$refs.overlayGalleryScroll;
      if (!el || !el.clientWidth) {
        return;
      }
      const index = Math.round(el.scrollLeft / el.clientWidth);
      this.activeGallery = Math.min(this.overlayGallery.length - 1, Math.max(0, index));
    },
    scrollOverlayTo(index) {
      const el = this.$refs.overlayGalleryScroll;
      if (!el || !el.clientWidth) {
        return;
      }
      el.scrollTo({ left: el.clientWidth * index, behavior: 'smooth' });
    },
  },
};
</script>

<style scoped>
.portfolio {
  padding: 6vw 0;
  background: #0b0b0b;
  color: #fff;
  width: 100vw;
  box-sizing: border-box;
}
.portfolio-container {
  width: 100%;
  padding: 0 4vw;
  box-sizing: border-box;
  max-width: none;
  margin: 0;
}
.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.title {
  font-size: clamp(24px, 2.2vw, 38px);
  margin-bottom: clamp(20px, 2.2vw, 40px);
}
.portfolio-grid {
  margin: 0;
}
.portfolio-card {
  background: rgba(255,255,255,0.03);
  border-radius: 12px;
  overflow: hidden;
  transition: transform .2s ease, box-shadow .2s ease;
  border: 1px solid rgba(255,255,255,0.06);
  color: #fff;
  width: 100%;
  position: relative;
}
.portfolio-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 10px 26px rgba(0,0,0,0.55);
}
.card-image {
  background: #111;
  height: 280px;
}
.card-label {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
  font-size: 9px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 500;
  opacity: 0.6;
  font-family: "Space Grotesk", "DM Sans", "Helvetica Neue", Arial, sans-serif;
}
.product-title {
  font-size: clamp(16px, 1.2vw, 22px);
  padding: clamp(0px, 1.2vw, 0px) clamp(0px, 1.2vw, 0px) 0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.product-title-text {
  display: inline-flex;
  align-items: center;
}
.cert {
  text-align: center;
  font-size: clamp(12px, 0.9vw, 14px);
  color: rgba(255,255,255,0.72);
  padding: clamp(5px, 1.2vw, 5px) clamp(5px, 1.2vw, 5px) 0;
  margin-top: -8px;
}
.price {
  font-weight: 600;
  opacity: 0.9;
  padding: 0 clamp(14px, 1.2vw, 22px);
  font-size: clamp(14px, 1vw, 18px);
  text-align: center;
  width: 100%;
}
.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 clamp(10px, 1.2vw, 18px) clamp(12px, 1.2vw, 20px);
  position: relative;
}
.portfolio-card--product .meta-row {
  padding-bottom: clamp(16px, 1.6vw, 24px);
}
.external-link {
  color: rgba(255,255,255,0.85);
  position: absolute;
  right: clamp(8px, 1.2vw, 16px);
  top: 50%;
  transform: translateY(-50%);
}
.overlay-card {
  background: rgba(10,10,10,0.95);
  padding: clamp(16px, 2vw, 28px);
  position: relative;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.12);
  box-shadow: 0 18px 40px rgba(0,0,0,0.55);
}
.overlay :deep(.v-overlay__scrim) {
  background: rgba(0,0,0,0.88);
  backdrop-filter: blur(6px);
}
.overlay-header {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: clamp(8px, 1vw, 12px);
}
.overlay-title {
  font-size: clamp(16px, 1.2vw, 20px);
  font-weight: 600;
  color: rgba(255,255,255,0.9);
}
.overlay-image {
  border-radius: 10px;
  max-height: 80vh;
}
.overlay-gallery {
  position: relative;
}
.overlay-gallery-scroll {
  display: flex;
  width: 100%;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  border-radius: 10px;
}
.overlay-gallery-scroll::-webkit-scrollbar {
  display: none;
}
.overlay-gallery-image {
  flex: 0 0 100%;
  max-height: 80vh;
  width: 100%;
  object-fit: contain;
  scroll-snap-align: start;
  background: #111;
}
.overlay-gallery-dots {
  position: absolute;
  left: 50%;
  bottom: 1.2vw;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
}
.overlay-gallery-dot {
  font-size: clamp(2px, 0.8vw, 12px);
  color: rgba(255, 255, 255, 0.55);
}
.overlay-gallery-dot--active {
  color: #ffffff;
}
.overlay-desc {
  font-size: clamp(13px, 0.9vw, 16px);
  color: rgba(255,255,255,0.8);
  padding: clamp(10px, 1.2vw, 18px) 0 0;
  text-align: left;
  font-family: "Space Grotesk", "DM Sans", "Helvetica Neue", Arial, sans-serif;
  font-weight: 400;
  letter-spacing: 0.01em;
}
.overlay-close {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  color: #fff;
  z-index: 2;
}
@media (max-width: 768px) {
  .title { font-size: clamp(22px, 7vw, 32px); }
  .product-title { font-size: clamp(16px, 4.6vw, 20px); }
  .desc, .price { font-size: clamp(13px, 4vw, 16px); }
}
</style>
