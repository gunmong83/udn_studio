<template>
  <section id="portfolio" class="portfolio">
    <div class="container">
      <h2 class="title">Portfolio</h2>
      <div class="grid">
        <article v-for="(product, i) in products" :key="i" class="card">
          <a v-if="product.url" :href="product.url" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">
            <div class="thumb">
              <img :src="product.image" :alt="product.title" />
            </div>
            <div class="meta">
              <h3 class="product-title">{{ product.title }}</h3>
              <p class="price">{{ product.price }}</p>
              <p class="desc">{{ product.description }}</p>
            </div>
          </a>
          <button v-else type="button" class="card-button" @click="openOverlay(product.image, product.title)">
            <div class="thumb">
              <img :src="product.image" :alt="product.title" />
            </div>
            <div class="meta">
              <h3 class="product-title">{{ product.title }}</h3>
              <p class="desc">{{ product.description }}</p>
            </div>
          </button>
        </article>
      </div>
    </div>

    <div v-if="overlayOpen" class="overlay" @click="closeOverlay">
      <button class="overlay-close" type="button" aria-label="Close image" @click.stop="closeOverlay">
        <span class="overlay-close-icon">×</span>
      </button>
      <img class="overlay-image" :src="overlayImage" :alt="overlayAlt" @click.stop />
    </div>
  </section>
</template>

<script>
import portfolio1 from './assets/portfolio_images/portfolio_1.png'
import portfolio2 from './assets/portfolio_images/portfolio_2.jpg'
import portfolio3 from './assets/portfolio_images/portfolio_3.jpg'
import portfolio4 from './assets/portfolio_images/portfolio_4.jpg'

export default {
  name: 'Portfolio',
  data() {
    return {
      overlayOpen: false,
      overlayImage: '',
      overlayAlt: '',
      products: [
        {
          title: 'Studio UDN - Product',
          price: 'See store',
          image: portfolio1,
          description: 'Click to view the product on the Smart Store.',
          url: 'https://smartstore.naver.com/studioudn/products/12907475385',
        },
        {
          title: 'Studio UDN - Artwork',
          image: portfolio2,
          description: 'View artwork.',
        },
        {
          title: 'Studio UDN - Artwork',
          image: portfolio3,
          description: 'View artwork.',
        },
        {
          title: 'Studio UDN - Artwork',
          image: portfolio4,
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
      document.body.style.overflow = 'hidden';
    },
    closeOverlay() {
      this.overlayOpen = false;
      document.body.style.overflow = '';
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
.container {
  width: 100%;
  padding: 0 4vw;
  box-sizing: border-box;
  max-width: none;
  margin: 0;
} 
.title {
  font-size: 2.4vw;
  margin-bottom: 2.5vw;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5vw;
}
.card {
  background: rgba(255,255,255,0.03);
  border-radius: 8px;
  overflow: hidden;
  transition: transform .2s ease, box-shadow .2s ease;
}
.card:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.6);
}
.card-button {
  background: none;
  border: 0;
  padding: 0;
  width: 100%;
  text-align: left;
  color: inherit;
  cursor: pointer;
}
.thumb {
  width: 100%;
  aspect-ratio: 3 / 5; /* taller card to fit vertical artwork */
  overflow: hidden;
  display:flex;
  align-items:center;
  justify-content:center;
  background: #111;
}
.thumb img {
  width: auto; /* allow natural width, scale by height */
  height: 100%;
  object-fit: contain; /* show full image, no cropping */
  display: block;
}
.meta {
  padding: 1.2vw;
}
.product-title {
  font-size: 1.2vw;
  margin: 0 0 .6vw 0;
}
.price {
  font-weight: 700;
  margin: 0 0 .6vw 0;
}
.desc {
  font-size: 0.9vw;
  color: rgba(255,255,255,0.75);
  margin: 0;
}
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  padding: 4vw;
  box-sizing: border-box;
}
.overlay-image {
  max-width: min(90vw, 1200px);
  max-height: 90vh;
  width: auto;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 18px 40px rgba(0,0,0,0.6);
}
.overlay-close {
  position: absolute;
  top: 2vw;
  right: 2vw;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 0;
  background: rgba(20,20,20,0.8);
  color: #fff;
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.overlay-close-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  line-height: 1;
}
@media (max-width: 768px) {
  .title { font-size: 6vw; }
  .product-title { font-size: 4vw; }
  .desc, .price { font-size: 3.6vw; }
  .overlay-close {
    top: 4vw;
    right: 4vw;
    width: 40px;
    height: 40px;
    font-size: 24px;
  }
}
</style>
