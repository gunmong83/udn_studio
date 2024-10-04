<template>
  <div class="app">
    <div class="background1">
      <div class="line" v-for="(line, index) in lines" :key="index" :ref="'line-' + index" :style="getLineStyle(index)">
      </div>
      <div class="intersection" v-for="(line, index) in lines" :key="index" :style="getInterAreaStyle(index)"
        :ref="'text-' + index" @mouseenter="handleMouseEnter(index)" @mouseleave="handleMouseLeave(index)">
      </div>
    </div>
  </div>
</template>

<script>
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default {
  name: 'App',
  data() {
    return {
      lines: new Array(12).fill(null), // 12개의 라인 생성
      isMouseOver: [], // 각 라인의 애니메이션 타임라인 저장
      lineCoord: [],
    };
  },
  created() {
    this.calcLineCoord();
  },
  mounted() {
    this.animateLines();
  },
  methods: {
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
        innerHTML: 'PORTFOLIO',
        ease: 'power1.inOut',
      });

      lineRef.style.cursor = 'pointer'; // 버튼처럼 변경
    
    },

    handleMouseLeave(index) {
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

      lineRef.style.cursor = 'default';

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
.background1 {
  width: 100vw;
  height: 250vh;
  padding: 0;
  margin: 0;
  left: 0;
  top: 0;
  position: absolute;
  border: 0px solid #ff0000;
  display: flex;
  background: url('/src/assets/main_background.png');
  background-size: contain;
  background-repeat: no-repeat;
  overflow-y: scroll;
}
</style>
