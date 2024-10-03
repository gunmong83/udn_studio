<template>
  <div class="app">
    <div class="background1">
      <div
        class="line"
        v-for="(line, index) in lines"
        :key="index"
        :ref="'line-' + index"
        :style="getLineStyle(index)"
      ></div>
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
    };
  },
  mounted() {
    this.animateLines();
  },
  methods: {
    animateLines() {
      const timeline = gsap.timeline({repeatDelay: 0.3});
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
            duration: 0.7, // 각 라인의 회전 애니메이션 지속 시간
            ease: "power1.inOut", // 부드러운 애니메이션 효과
          }, i===0? '+=0.2' : '-=0.5'); // 첫 번째 라인은 텀을 두고 시작, 나머지는 겹쳐서 진행
        });
      }

      // 애니메이션이 끝나면 다시 시작하도록 설정
      timeline.eventCallback("onComplete", () => {
        this.animateLines();
      });
    },
    getLineStyle(index) {
      const rows = 3;
      const cols = 4;
      const row = Math.floor(index / cols);
      const col = index % cols;
      const spacingX = 20.5; // X 축 간격 설정 (vw 단위)
      const spacingY = 19.5; // Y 축 간격 설정 (vh 단위)
      const degree = (row % 2) ? "135deg" : "45deg";
      return {
        width: '0.15vw',
        height: '17vw',
        backgroundColor: '#ffffff',
        position: 'absolute',
        top: `${5 + row * spacingY}vw`,
        left: `${19.5 + col * spacingX}vw`,
        transform: `rotate(${degree})`, // 초기 45도 회전
      };
    },
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

.line {
  width: 1px;
  height: 15vw;
  background-color: #ffffff;
}
</style>
