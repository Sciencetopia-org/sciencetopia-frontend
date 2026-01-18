<template>
  <div class="spinner-container">
    <div class="loading">
      <div class="outer-circle">
        <div class="center-dot"></div>
      </div>
    </div>
    <p>{{ $t('loading') }}</p>
  </div>
</template>

<script>
export default {
  name: 'LoadingSpinner',
}
</script>

<style scoped>
.spinner-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  /* Adjust as needed */
}

.loading {
  position: relative;
  width: 48px;
  height: 48px;
  animation: satellite 3s infinite linear;
  border: 1px solid #000;
  border-radius: 100%;
}

.loading:before {
  position: absolute;
  left: 1px;
  bottom: 0px;
  transform: rotate(50deg);
  width: 0;
  height: 0;
  content: '';
  border-left: 6px solid transparent;
  /* Half the width of the triangle */
  border-right: 6px solid transparent;
  /* Half the width of the triangle */
  border-bottom: 20px solid red;
  /* Height of the triangle */
}

.outer-circle {
  position: absolute;
  right: 0;
  width: 20px;
  height: 20px;
  margin: 13px;
  border-radius: 100%;
  /* Change to 0% for a square shape */
  background-color: #00fff7;
  /* Change color to blue */
  border: 2px solid #000;
}

.outer-circle .center-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  background: black;
  transform: translate(-50%, -50%);
  border-radius: 50%;
}

@keyframes satellite {
  from {
    transform: rotate(0) translateZ(0);
  }

  to {
    transform: rotate(360deg) translateZ(0);
  }
}
</style>
