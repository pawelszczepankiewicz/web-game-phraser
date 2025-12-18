<template>
  <div class="frame"></div>
</template>

<style scoped>
.frame {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  box-sizing: border-box;
  z-index: 900;
  border: 28px solid transparent;
  border-image: url("/assets/textures/texture_rock_1_16px.png") 30 round;
  border-radius: 40px;
}

/* Use a pseudo-element for rounded corners since border-image doesn't support border-radius */
.frame::before {
  content: "";
  position: absolute;
  top: -30px;
  left: -30px;
  right: -30px;
  bottom: -30px;
  background-image: url("/assets/textures/texture_rock_1_16px.png");
  background-repeat: repeat;
  background-size: 32px 32px;
  border-radius: 40px;
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  padding: 30px;
}
</style>
