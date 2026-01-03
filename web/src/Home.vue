<template>
  <div class="home-wrapper">
    <!-- Existing App component used as a showcase item -->
    <ShowcaseItem />

    <!-- Portfolio cards placed below the showcase -->
    <Portfolio />
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
</style>
