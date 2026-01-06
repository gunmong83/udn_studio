<template>
  <section id="portfolio" class="portfolio">
    <v-container class="portfolio-container">
      <div class="title-row">
        <h2 class="title">Portfolio</h2>
      </div>

      <v-row class="portfolio-grid" dense>
        <v-col
          v-for="(product, i) in products"
          :key="i"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <v-card
            class="portfolio-card"
            :class="{ 'portfolio-card--art': !product.url }"
            elevation="2"
            :href="product.url || undefined"
            :target="product.url ? '_blank' : undefined"
            :rel="product.url ? 'noopener noreferrer' : undefined"
            :referrerpolicy="product.url ? 'no-referrer' : undefined"
            :ripple="!!product.url"
            @click="product.url ? null : openOverlay(product.image, product.title)"
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
              {{ product.title }}
            </v-card-title>
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
            <v-card-text v-if="!product.url && product.description" class="desc">
              {{ product.description }}
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <v-dialog v-model="overlayOpen" class="overlay" max-width="1200">
      <v-card class="overlay-card">
        <v-btn
          class="overlay-close"
          variant="text"
          icon="mdi-close-box"
          @click="closeOverlay"
          aria-label="Close image"
        />
        <v-img class="overlay-image" :src="overlayImage" :alt="overlayAlt" contain />
      </v-card>
    </v-dialog>
  </section>
</template>

<script>
import portfolio1 from './assets/portfolio_images/portfolio_1.png'
import portfolio2 from './assets/portfolio_images/portfolio_2.jpg'
import portfolio3 from './assets/portfolio_images/portfolio_3.jpg'
import portfolio4 from './assets/portfolio_images/portfolio_4.jpg'
import portfolio5 from './assets/portfolio_images/portfolio_5.jpg'
import portfolio6 from './assets/portfolio_images/portfolio_6.jpg'

export default {
  name: 'Portfolio',
  data() {
    return {
      overlayOpen: false,
      overlayImage: '',
      overlayAlt: '',
      products: [
        {
          title: 'UDN Calendar 2026 제철달력 령令',
          price: 'See store',
          image: portfolio1,
          description: 'Click to view the product on the Smart Store.',
          url: 'https://smartstore.naver.com/studioudn/products/12907475385',
        },
        {
          title: '느리게',
          image: portfolio2,
          description: 'View artwork.',
        },
        {
          title: '토브',
          image: portfolio3,
          description: 'View artwork.',
        },
        {
          title: 'Luivis BeBe',
          image: portfolio4,
          description: 'View artwork.',
        },
        {
          title: '개인전 포스터 - 안선영',
          image: portfolio5,
          description: 'View artwork.',
        },
        {
          title: '전시회 브로셔 - 유유자적 민화',
          image: portfolio6,
          description: 'View artwork.',
        },
      ],
    };
  },
  methods: {
    openOverlay(image, alt) {
      this.overlayImage = image;
      this.overlayAlt = alt || 'Artwork';
      this.overlayOpen = true;
    },
    closeOverlay() {
      this.overlayOpen = false;
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
  padding: clamp(14px, 1.2vw, 22px) clamp(14px, 1.2vw, 22px) 0;
}
.price {
  font-weight: 600;
  opacity: 0.9;
  padding: 0 clamp(14px, 1.2vw, 22px);
  font-size: clamp(14px, 1vw, 18px);
}
.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 clamp(10px, 1.2vw, 18px) clamp(6px, 0.6vw, 12px);
}
.external-link {
  color: rgba(255,255,255,0.85);
}
.desc {
  font-size: clamp(13px, 0.9vw, 16px);
  color: rgba(255,255,255,0.75);
  padding: 0 clamp(14px, 1.2vw, 22px) clamp(14px, 1.2vw, 22px);
}
.overlay-card {
  background: rgba(10,10,10,0.95);
  padding: clamp(16px, 2vw, 28px);
  position: relative;
  border-radius: 12px;
}
.overlay-image {
  border-radius: 10px;
  max-height: 80vh;
}
.overlay-close {
  position: absolute;
  top: clamp(10px, 1.6vw, 20px);
  right: clamp(10px, 1.6vw, 20px);
  color: #fff;
}
@media (max-width: 768px) {
  .title { font-size: clamp(22px, 7vw, 32px); }
  .product-title { font-size: clamp(16px, 4.6vw, 20px); }
  .desc, .price { font-size: clamp(13px, 4vw, 16px); }
}
</style>
