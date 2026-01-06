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
              <span class="product-title-text">{{ product.title }}</span>
            </v-card-title>
            <div v-if="product.cert" class="brand-mark">
              <span class="brand-mark-text">{{ product.cert }}</span>
            </div>
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
import portfolio7 from './assets/portfolio_images/portfolio_7.jpg'

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
          title: '[ NeRyGe : To Slow ]',
          cert: 'Total Branding',
          image: portfolio2,
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
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.product-title-text {
  display: inline-flex;
  align-items: center;
}
.brand-mark {
  display: flex;
  justify-content: flex-end;
  padding: 2px clamp(14px, 1.2vw, 22px) 0;
}
.brand-mark-text {
  font-size: 8px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.35);
  color: rgba(255,255,255,0.75);
  line-height: 1;
  font-weight: 500;
  font-family: "Space Grotesk", "DM Sans", "Helvetica Neue", Arial, sans-serif;
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
.desc {
  font-size: clamp(13px, 0.9vw, 16px);
  color: rgba(255,255,255,0.75);
  padding: 0 clamp(14px, 1.2vw, 22px) clamp(12px, 1.1vw, 18px);
  margin-top: -12px;
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
  z-index: 2;
}
@media (max-width: 768px) {
  .title { font-size: clamp(22px, 7vw, 32px); }
  .product-title { font-size: clamp(16px, 4.6vw, 20px); }
  .desc, .price { font-size: clamp(13px, 4vw, 16px); }
}
</style>
