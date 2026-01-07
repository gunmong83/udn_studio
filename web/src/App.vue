<template>
  <div class="app">
    <div class="background1">
      <div class="background-main">
        <img class="bg-img" src="/src/assets/main_background.png" alt="background" />

        <!-- Decorative overlay (lines and interactive areas) -->
        <div class="overlay">
          <div class="line" v-for="(line, index) in lines" :key="index" :ref="'line-' + index" :style="getLineStyle(index)">
          </div>
          <div class="intersection" v-for="(line, index) in lines" :key="index" :style="getInterAreaStyle(index)"
            :ref="'text-' + index" @mouseenter="handleMouseEnter(index)" @mouseleave="handleMouseLeave(index)"
            @click="handleLineClick(index)">
          </div>
        </div>
      </div>

      <img id="homepage-map" class="bg-map" :src="homepageMap" alt="homepage map" />
      <div class="introduce-scroll-wrap">
        <div
          class="introduce-scroll"
          ref="introduceScroll"
          @scroll="handleIntroduceScroll"
        >
          <img
            v-for="(image, index) in introduceImages"
            :key="image.src"
            class="bg-map introduce-image"
            :id="image.id"
            :src="image.src"
            :alt="image.alt"
          />
        </div>
        <div class="introduce-dots" aria-hidden="true">
          <v-icon
            v-for="(image, index) in introduceImages"
            :key="`dot-${image.src}`"
            class="introduce-dot"
            :class="{ 'introduce-dot--active': index === activeIntroduce }"
            size="12"
            @click="scrollIntroduceTo(index)"
          >
            {{ index === activeIntroduce ? 'mdi-circle' : 'mdi-circle-outline' }}
          </v-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import homepageMap from './assets/introduce_images/homepage_map.png';
import introduce1 from './assets/introduce_images/introduce_1.jpg';
import introduce2 from './assets/introduce_images/introduce_2.jpg';
import introduce3 from './assets/introduce_images/introduce_3.jpg';
import introduce4 from './assets/introduce_images/introduce_4.jpg';
import introduce5 from './assets/introduce_images/introduce_5.jpg';

export default {
  name: 'App',
  data() {
    return {
      lines: new Array(12).fill(null), // 12개의 라인 생성
      isMouseOver: [], // 각 라인의 애니메이션 타임라인 저장
      lineCoord: [],
      homepageMap,
      introduceImages: [
        { id: 'introduce-1', src: introduce1, alt: 'introduce 1' },
        { id: null, src: introduce2, alt: 'introduce 2' },
        { id: null, src: introduce3, alt: 'introduce 3' },
        { id: null, src: introduce4, alt: 'introduce 4' },
        { id: null, src: introduce5, alt: 'introduce 5' },
      ],
      activeIntroduce: 0,
      lineLabels: [
        'Homepage<br>Map',
        'Contents',
        'Portfolio',
        'Homepage<br>Map',
        'Contents',
        'Portfolio',
        'Homepage<br>Map',
        'Contents',
        'Portfolio',
        'Homepage<br>Map',
        'Contents',
        'Portfolio',
      ],
      lineTargets: [
        '#homepage-map',
        '#introduce-1',
        '#portfolio',
        '#homepage-map',
        '#introduce-1',
        '#portfolio',
        '#homepage-map',
        '#introduce-1',
        '#portfolio',
        '#homepage-map',
        '#introduce-1',
        '#portfolio',
      ],
    };
  },
  created() {
    this.calcLineCoord();
  },
  mounted() {
    this.animateLines();
    this.handleIntroduceScroll();
  },
  methods: {
    handleIntroduceScroll() {
      const el = this.$refs.introduceScroll;
      if (!el || !el.clientWidth) {
        return;
      }
      const index = Math.round(el.scrollLeft / el.clientWidth);
      this.activeIntroduce = Math.min(this.introduceImages.length - 1, Math.max(0, index));
    },
    scrollIntroduceTo(index) {
      const el = this.$refs.introduceScroll;
      if (!el || !el.clientWidth) {
        return;
      }
      el.scrollTo({ left: el.clientWidth * index, behavior: 'smooth' });
    },
    scrollToNextImage() {
      const targets = Array.from(document.querySelectorAll('.bg-map'));
      if (!targets.length) {
        return;
      }
      const currentY = window.scrollY;
      const next = targets.find((el) => el.offsetTop > currentY + 5);
      if (next) {
        next.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      const portfolio = document.querySelector('#portfolio');
      if (portfolio) {
        portfolio.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    scrollToPrevImage() {
      const targets = Array.from(document.querySelectorAll('.bg-map'));
      if (!targets.length) {
        return;
      }
      const currentY = window.scrollY;
      const previous = targets
        .slice()
        .reverse()
        .find((el) => el.offsetTop < currentY - 5);
      if (previous) {
        previous.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    animateLines() {
      const timeline = gsap.timeline({ repeatDelay: 0.3 });
      const rows = 3;
      const cols = 4;
      for (let row = 0; row < rows; row++) {
        const lineIndices = Array.from({ length: cols }, (_, col) => row * cols + col);

        if (row % 2 === 1) {
          // 짝수 행일 경우 순서를 반대로
          lineIndices.reverse();
        }

        lineIndices.forEach((index, i) => {
          const lineRef = this.$refs[`line-${index}`][0];
          timeline.to(lineRef, {
            rotation: "-=90", // 90도씩 추가로 회전
            duration: 0.5, // 각 라인의 회전 애니메이션 지속 시간
            ease: "power1.inOut", // 부드러운 애니메이션 효과
          }, i === 0 ? '-=0.0' : '-=0.4');
        });
      }

      // 애니메이션이 끝나면 다시 시작하도록 설정
      timeline.eventCallback("onComplete", () => {
        setTimeout(() => {
          this.animateLines();
        }, 2000); // 2초 대기
      });
    },
    handleMouseEnter(index) {
      const label = this.lineLabels[index];
      if (!label) {
        return;
      }

      // 현재 라인의 애니메이션 멈춤
      const lineRef = this.$refs[`line-${index}`][0];
      const textRef = this.$refs[`text-${index}`][0];
      this.isMouseOver[index] = true;
      const timeline = gsap.timeline();

      timeline.to(lineRef, {
        x: `-5vw`,
        duration: 0.5,
        width: '10vw',
        color: 'transparent',
        backgroundColor: 'transparent',
      });
      
      timeline.call(() => {
        if (!this.isMouseOver[index]) {
          timeline.pause();
        }
      })

      timeline.to(textRef, {
        duration: 0.5,
        backgroundColor: 'transparent',
        textAlign: 'center',
        fontSize: '2vw',
        color: '#ffffff',
        innerHTML: label,
        ease: 'power1.inOut',
      });

      textRef.style.cursor = 'pointer'; // 버튼처럼 변경
    
    },

    handleMouseLeave(index) {
      if (!this.lineLabels[index]) {
        return;
      }

      const lineRef = this.$refs[`line-${index}`][0];
      const textRef = this.$refs[`text-${index}`][0];
      this.isMouseOver[index] = false;
      const timeline = gsap.timeline();
      
      timeline.to(textRef, {
        duration: 0.5,
        fontSize: '0vw',
        ease: 'power1.inOut',
      });
      timeline.call(() => {
        if (this.isMouseOver[index]) {
          timeline.pause();
        }
      })
      timeline.to(lineRef, {
        x: "0vw",
        duration: 0.5,
        width: '0.15vw',
        color: '#ffffff',
        backgroundColor: '#ffffff',
      });

      textRef.style.cursor = 'default';

    },
    handleLineClick(index) {
      const target = this.lineTargets[index];
      if (!target) {
        return;
      }
      const el = document.querySelector(target);
      if (!el) {
        return;
      }
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    calcLineCoord() {
      const rows = 3;
      const cols = 4;
      const spacingX = 20.5; // X 축 간격 설정 (vw 단위)
      const spacingY = 19.5; // Y 축 간격 설정 (vw 단위)
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const top = 5 + row * spacingY;
          const left = 19.5 + col * spacingX;
          const degree = (row % 2) ? "135deg" : "45deg";
          this.lineCoord.push({ top, left, degree });
        }
      }
    },
    getLineStyle(index) {
      const { top, left, degree } = this.lineCoord[index];
      return {
        width: '0.15vw',
        height: '17vw',
        backgroundColor: '#ffffff',
        position: 'absolute',
        top : `${top}vw`,
        left : `${left}vw`,
        transform: `rotate(${degree})`, // 초기 45도 회전
      };
    },
    getInterAreaStyle(index) {
      const rows = 3;
      const cols = 4;
      const size = 10;
      const row = Math.floor(index / cols);
      const col = index % cols;
      const spacingX = 20.5; // X 축 간격 설정 (vw 단위)
      const spacingY = 19.5; // Y 축 간격 설정 (vh 단위)
      return {
        width: `${size}vw`,
        height: `${size}vw`,
        backgroundColor: '#ffffff',
        position: 'absolute',
        fontSize: '0vw',
        top: `${8.5 + row * spacingY}vw`,
        left: `${19.5 + col * spacingX - size / 2}vw`,
        backgroundColor: 'transparent',
        border: '0px solid #ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      };
    }
  },
};
</script>

<style scoped>
.app {
  position: relative;
  min-height: 100vh; /* section height */
  width: 100vw;
  overflow: visible;
  background-color: #0b0b0b;
}
.background1 {
  position: relative; /* make it size to its content (the img) */
  width: 100vw;
  padding: 0;
  margin: 0;
  z-index: 0;
  border: 0;
  background-color: #0b0b0b; /* fill gaps with softer black */
  overflow: visible;
}
.background-main {
  position: relative;
}
.bg-img {
  display: block;
  width: 100vw; /* match viewport width */
  height: auto; /* preserve aspect ratio, prevents cropping */
}
.bg-map {
  display: block;
  width: 100vw;
  height: auto;
}
.introduce-scroll-wrap {
  position: relative;
  width: 100vw;
  overflow: hidden;
}
.introduce-scroll {
  display: flex;
  width: 100vw;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.introduce-scroll::-webkit-scrollbar {
  display: none;
}
.introduce-image {
  flex: 0 0 100vw;
  scroll-snap-align: start;
}
.introduce-dots {
  position: absolute;
  left: 50%;
  bottom: 2vw;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
}
.introduce-dot {
  color: rgba(255, 255, 255, 0.55);
}
.introduce-dot--active {
  color: #ffffff;
}
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto; /* keep interactions */
}
</style>
