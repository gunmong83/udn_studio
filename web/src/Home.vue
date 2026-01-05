<template>
  <div class="home-wrapper">
    <!-- Existing App component used as a showcase item -->
    <ShowcaseItem />

    <!-- Portfolio cards placed below the showcase -->
    <Portfolio />

    <button v-if="showTopButton" class="top-button" type="button" aria-label="Back to top" @click="scrollToTop">
      <span class="top-arrow">▲</span>
    </button>
  </div>
</template>

<script>
import ShowcaseItem from './App.vue'
import Portfolio from './Portfolio.vue' 

export default {
  name: 'Home',
  components: {
    ShowcaseItem,
    Portfolio,
  },
  data() {
    return {
      showTopButton: false,
    };
  },
  mounted() {
    this.handleScroll();
    window.addEventListener('scroll', this.handleScroll, { passive: true });
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  },
  methods: {
    handleScroll() {
      this.showTopButton = window.scrollY > 300;
    },
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  },
} 
</script>

<style scoped>
.home-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100vw;
  overflow-x: hidden;
} 
.top-button {
  position: fixed;
  right: 3vw;
  bottom: 3vw;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 0;
  outline: none;
  background: rgba(20,20,20,0.8);
  color: #fff;
  font-size: 26px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: transform .2s ease, box-shadow .2s ease;
  box-shadow: 0 6px 16px rgba(0,0,0,0.4);
}
.top-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  line-height: 1;
}
.top-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(0,0,0,0.5);
}
.top-button:focus,
.top-button:focus-visible {
  outline: none;
  box-shadow: 0 8px 18px rgba(0,0,0,0.5);
}
@media (max-width: 768px) {
  .top-button {
    right: 5vw;
    bottom: 6vw;
    width: 44px;
    height: 44px;
    font-size: 22px;
  }
}
</style>
