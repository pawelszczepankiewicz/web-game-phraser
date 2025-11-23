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
  border: 30px solid var(--rpg-bg-medium);
  outline: 30px solid var(--rpg-bg-medium);
  outline-offset: -1px;
  box-sizing: border-box;
  z-index: 1200;
  border-radius: 40px;
}
</style>
