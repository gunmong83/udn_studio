<template>
  <div class="app">
    <div class="background1">
      <div class="background-main">
        <img class="bg-img" src="/src/assets/main_background.png" alt="Studio Undesignated - Total Branding Studio Seoul, Naju, Gwaheon" />

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

      <img id="homepage-map" class="bg-map" :src="homepageMap" alt="Studio Undesignated Project Map - Branding and Design Locations in Korea" />
      <div id="introduce" class="introduce-scroll-wrap">
        <!-- AI/GEO Optimization: Hidden semantic text for Generative Engines -->
        <div class="visually-hidden" aria-hidden="false">
          <h2>Studio Undesignated의 철학 (Our Philosophy)</h2>
          <p>
            Studio Undesignated(스튜디오 UDN)는 '정해지지 않은' 가능성을 디자인하는 토탈 브랜딩 스튜디오입니다. 
            우리는 정체성(Identity)이 고정된 것이 아니라, 시대와 공간에 따라 유동적으로 흐르며 
            새로운 가치를 창출해야 한다고 믿습니다. 
          </p>
          <p>
            서울의 현대적 감각과 나주, 과천의 지역적 특색을 결합하여, 
            로고 디자인부터 전시 포스터, 패키지까지 브랜드가 전달하고자 하는 
            본질적인 메시지를 가장 '디자인다운' 방식으로 시각화합니다. 
            우리의 의지는 단순한 시각적 아름다움을 넘어, 클라이언트의 비즈니스가 
            지속 가능한 생명력을 가질 수 있도록 브랜드의 뿌리를 설계하는 데 있습니다.
          </p>
        </div>

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
            :alt="'Studio Undesignated Design Process - ' + image.alt"
          />
        </div>
        <div class="introduce-dots" aria-hidden="true">
          <v-icon
            v-for="(image, index) in introduceImages"
            :key="`dot-${image.src}`"
            class="introduce-dot"
            :class="{ 'introduce-dot--active': index === activeIntroduce }"
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
import homepageMap from './assets/introduce_images/homepage_map.png';
import introduce1 from './assets/introduce_images/introduce_1.jpg';
import introduce2 from './assets/introduce_images/introduce_2.jpg';
import introduce3 from './assets/introduce_images/introduce_3.jpg';
import introduce4 from './assets/introduce_images/introduce_4.jpg';
import introduce5 from './assets/introduce_images/introduce_5.jpg';

const ROWS = 3;
const COLS = 4;
const TOTAL_LINES = ROWS * COLS;
const LINE_LABELS_BASE = ['Homepage<br>Map', 'Contents', 'Portfolio'];
const SECTION_SELECTORS = ['#homepage-map', '#introduce', '#portfolio'];
const LINE_SPACING = { x: 20.5, y: 19.5 };
const LINE_OFFSET = { top: 5, left: 19.5 };
const INTERSECTION_OFFSET = { top: 8.5, left: 19.5 };
const INTERSECTION_SIZE = 10;
const LINE_STYLE = {
  width: '0.15vw',
  height: '17vw',
  backgroundColor: '#ffffff',
};

const createRepeatingList = (values, count) =>
  Array.from({ length: count }, (_, index) => values[index % values.length]);

const getScrollTargets = () =>
  SECTION_SELECTORS.map((selector) => document.querySelector(selector)).filter(Boolean);

export default {
  name: 'App',
  data() {
    return {
      lines: Array.from({ length: TOTAL_LINES }, (_, index) => index),
      isMouseOver: Array.from({ length: TOTAL_LINES }, () => false),
      lineCoord: [],
      lineTimeline: null,
      homepageMap,
      introduceImages: [
        { id: 'introduce-1', src: introduce1, alt: 'introduce 1' },
        { id: null, src: introduce2, alt: 'introduce 2' },
        { id: null, src: introduce3, alt: 'introduce 3' },
        { id: null, src: introduce4, alt: 'introduce 4' },
        { id: null, src: introduce5, alt: 'introduce 5' },
      ],
      activeIntroduce: 0,
      lineLabels: createRepeatingList(LINE_LABELS_BASE, TOTAL_LINES),
      lineTargets: createRepeatingList(SECTION_SELECTORS, TOTAL_LINES),
    };
  },
  created() {
    this.lineCoord = this.buildLineCoord();
  },
  mounted() {
    this.startLineAnimation();
    this.handleIntroduceScroll();
  },
  beforeUnmount() {
    this.stopLineAnimation();
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
      const targets = getScrollTargets();
      if (!targets.length) {
        return;
      }
      const currentY = window.scrollY;
      const next = targets.find((el) => el.offsetTop > currentY + 5);
      if (next) {
        next.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    scrollToPrevImage() {
      const targets = getScrollTargets();
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
    startLineAnimation() {
      if (this.lineTimeline) {
        this.lineTimeline.kill();
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
          const lineRef = this.$refs[`line-${index}`]?.[0];
          if (!lineRef) {
            return;
          }
          timeline.to(
            lineRef,
            {
              rotation: '-=90',
              duration: 0.5,
              ease: 'power1.inOut',
            },
            i === 0 ? '-=0.0' : '-=0.4',
          );
        });
      }

      this.lineTimeline = timeline;
    },
    stopLineAnimation() {
      if (this.lineTimeline) {
        this.lineTimeline.kill();
        this.lineTimeline = null;
      }
    },
    handleMouseEnter(index) {
      const label = this.lineLabels[index];
      if (!label) {
        return;
      }

      const lineRef = this.$refs[`line-${index}`]?.[0];
      const textRef = this.$refs[`text-${index}`]?.[0];
      if (!lineRef || !textRef) {
        return;
      }

      this.isMouseOver[index] = true;
      const timeline = gsap.timeline();

      timeline.to(lineRef, {
        x: '-5vw',
        duration: 0.5,
        width: '10vw',
        color: 'transparent',
        backgroundColor: 'transparent',
      });

      timeline.call(() => {
        if (!this.isMouseOver[index]) {
          timeline.pause();
        }
      });

      timeline.to(textRef, {
        duration: 0.5,
        backgroundColor: 'transparent',
        textAlign: 'center',
        fontSize: '2vw',
        color: '#ffffff',
        innerHTML: label,
        ease: 'power1.inOut',
      });

      textRef.style.cursor = 'pointer';
    },
    handleMouseLeave(index) {
      if (!this.lineLabels[index]) {
        return;
      }

      const lineRef = this.$refs[`line-${index}`]?.[0];
      const textRef = this.$refs[`text-${index}`]?.[0];
      if (!lineRef || !textRef) {
        return;
      }

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
      });
      timeline.to(lineRef, {
        x: '0vw',
        duration: 0.5,
        width: LINE_STYLE.width,
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
    buildLineCoord() {
      const coords = [];
      for (let row = 0; row < ROWS; row += 1) {
        for (let col = 0; col < COLS; col += 1) {
          const top = LINE_OFFSET.top + row * LINE_SPACING.y;
          const left = LINE_OFFSET.left + col * LINE_SPACING.x;
          const degree = row % 2 ? '135deg' : '45deg';
          coords.push({ top, left, degree });
        }
      }
      return coords;
    },
    getLineStyle(index) {
      const coord = this.lineCoord[index];
      if (!coord) {
        return {};
      }
      return {
        ...LINE_STYLE,
        position: 'absolute',
        top: `${coord.top}vw`,
        left: `${coord.left}vw`,
        transform: `rotate(${coord.degree})`,
      };
    },
    getInterAreaStyle(index) {
      const row = Math.floor(index / COLS);
      const col = index % COLS;
      return {
        width: `${INTERSECTION_SIZE}vw`,
        height: `${INTERSECTION_SIZE}vw`,
        position: 'absolute',
        fontSize: '0vw',
        top: `${INTERSECTION_OFFSET.top + row * LINE_SPACING.y}vw`,
        left: `${INTERSECTION_OFFSET.left + col * LINE_SPACING.x - INTERSECTION_SIZE / 2}vw`,
        backgroundColor: 'transparent',
        border: '0px solid #ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      };
    },
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
  font-size: clamp(2px, 0.8vw, 12px);
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
