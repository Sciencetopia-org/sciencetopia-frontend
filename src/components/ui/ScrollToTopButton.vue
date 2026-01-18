<template>
  <!-- Scroll to Top Button -->
  <transition name="scroll-to-top">
    <button
      v-if="showScrollToTop"
      class="scroll-to-top-wrapper"
      @click="scrollToTop"
    >
      <div class="scroll-to-top-arrow"></div>
      <div class="vertical-line"></div>
    </button>
  </transition>
</template>

<script>
export default {
  data() {
    return {
      showScrollToTop: false, // Whether the button should be displayed
    }
  },
  methods: {
    scrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth', // Smooth scrolling
      })
    },
    handleScroll() {
      if (window.scrollY > 400) {
        this.showScrollToTop = true // Show button
      } else if (this.showScrollToTop && !this.isLeaving) {
        this.showScrollToTop = false // Hide the button (keeps it in DOM until transition ends)
      }
    },
  },
  mounted() {
    window.addEventListener('scroll', this.handleScroll) // Listen for scroll events
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll) // Clean up event listener
  },
}
</script>

<style scoped>
.scroll-to-top-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
  /* Ensure it's on top of other elements */
  color: #304e75;
  border: 2px solid #304e75;
  box-shadow: none !important;

  &:hover {
    box-shadow: none !important;
  }

  &:focus {
    box-shadow: none !important;
  }

  &:active {
    box-shadow: none !important;
  }
}

.scroll-to-top-wrapper {
  position: fixed;
  bottom: 0px;
  right: 30px;
  z-index: 1000;
  /* Apply the rise-up animation */
  opacity: 1;
}

.scroll-to-top-enter-active {
  animation: rise-up 0.8s ease-out;
}

.scroll-to-top-enter-from {
  transform: translateY(50px);
  opacity: 0;
}

.scroll-to-top-enter-to {
  transform: translateY(0);
  opacity: 1;
}

/* Transition for leaving (descend animation) */
.scroll-to-top-leave-active {
  animation: descend 0.4s ease-in;
}

.scroll-to-top-leave-from {
  transform: translateY(0);
  opacity: 1;
}

.scroll-to-top-leave-to {
  transform: translateY(50px);
  opacity: 0;
}

.scroll-to-top-arrow {
  width: 50px;
  height: 120px;
  background-color: #ec0017;
  /* Arrow background */
  clip-path: polygon(
    0% 100%,
    /* Bottom-left */ 50% 30%,
    /* Top-center (concave dip starts) */ 100% 100%,
    /* Bottom-right */ 75% 90%,
    /* Curve inward on the right */ 50% 80%,
    /* Middle of the bottom */ 25% 90% /* Curve inward on the left */
  );
  cursor: pointer;
  margin: 10px auto;
}

.vertical-line {
  width: 4px;
  /* Line thickness */
  height: 60px;
  /* Line length */
  background-color: #ec0017;
  /* Line color */
  margin-top: -34px;
  margin-left: 22.8px;
  /* Adjust spacing between arrow and line */
}

@keyframes rise-up {
  0% {
    transform: translateY(50px);
    /* Start below the initial position */
    opacity: 0.8;
    /* Start invisible */
  }

  100% {
    transform: translateY(0);
    /* End at the original position */
    opacity: 1;
    /* Fully visible */
  }
}

/* Keyframes for descend animation */
@keyframes descend {
  0% {
    transform: translateY(0);
    opacity: 1;
  }

  100% {
    transform: translateY(50px);
    opacity: 0.5;
  }
}
</style>
