<template>
  <section class="portfolio">
    <div class="container">
      <h2 class="title">Portfolio</h2>
      <div class="grid">
        <article v-for="(product, i) in products" :key="i" class="card">
          <a :href="product.url" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">
            <div class="thumb">
              <img :src="product.image" :alt="product.title" />
            </div>
            <div class="meta">
              <h3 class="product-title">{{ product.title }}</h3>
              <p class="price">{{ product.price }}</p>
              <p class="desc">{{ product.description }}</p>
            </div>
          </a>
        </article>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'Portfolio',
  props: {
    products: {
      type: Array,
      default() {
        return [
          {
            title: 'Studio UDN - Product',
            price: 'See store',
            image: '/src/assets/product_sample.png',
            description: 'Click to view the product on the Smart Store.',
            url: 'https://smartstore.naver.com/studioudn/products/12907475385',
          },
        ];
      },
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
@media (max-width: 768px) {
  .title { font-size: 6vw; }
  .product-title { font-size: 4vw; }
  .desc, .price { font-size: 3.6vw; }
}
</style>