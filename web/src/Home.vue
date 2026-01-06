<template>
  <v-app>
    <v-main>
      <div class="home-wrapper">
        <!-- Existing App component used as a showcase item -->
        <ShowcaseItem ref="showcase" />

        <!-- Portfolio cards placed below the showcase -->
        <Portfolio />

        <div v-if="showTopButton" class="floating-buttons">
          <button class="top-label-button" type="button" aria-label="Back to top" @click="scrollToTop">
            Top
          </button>
          <v-btn class="top-button" icon="mdi-menu-up" aria-label="Previous image" @click="scrollToPrev" />
          <v-btn class="next-button" icon="mdi-menu-down" aria-label="Next image" @click="scrollToNext" />
        </div>
      </div>
    </v-main>
  </v-app>
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
    scrollToPrev() {
      if (this.$refs.showcase && this.$refs.showcase.scrollToPrevImage) {
        this.$refs.showcase.scrollToPrevImage();
      }
    },
    scrollToNext() {
      if (this.$refs.showcase && this.$refs.showcase.scrollToNextImage) {
        this.$refs.showcase.scrollToNextImage();
      }
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
.floating-buttons {
  position: fixed;
  right: 3vw;
  bottom: 3vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  z-index: 10;
}
.top-label-button {
  width: 52px;
  height: 36px;
  border-radius: 18px;
  border: 0;
  outline: none;
  background: rgba(20,20,20,0.8);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform .2s ease, box-shadow .2s ease;
  box-shadow: 0 6px 16px rgba(0,0,0,0.4);
}
.top-label-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(0,0,0,0.5);
}
.top-label-button:focus,
.top-label-button:focus-visible {
  outline: none;
  box-shadow: 0 8px 18px rgba(0,0,0,0.5);
}
.top-button {
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
.next-button {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 0;
  outline: none;
  background: rgba(20,20,20,0.8);
  color: #fff;
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform .2s ease, box-shadow .2s ease;
  box-shadow: 0 6px 16px rgba(0,0,0,0.4);
}
.next-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(0,0,0,0.5);
}
.next-button:focus,
.next-button:focus-visible {
  outline: none;
  box-shadow: 0 8px 18px rgba(0,0,0,0.5);
}
.next-arrow {
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
  .floating-buttons {
    right: 5vw;
    bottom: 6vw;
    gap: 10px;
  }
  .top-label-button {
    width: 44px;
    height: 32px;
    font-size: 12px;
  }
  .top-button {
    width: 44px;
    height: 44px;
    font-size: 22px;
  }
  .next-button {
    width: 44px;
    height: 44px;
    font-size: 20px;
  }
}
</style>
