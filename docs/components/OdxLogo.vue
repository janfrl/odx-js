<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="80"
    height="32"
    viewBox="0 0 200 80"
    font-family="Geist,Archivo,system-ui,sans-serif"
    aria-label="ODX"
  >
    <g fill="none" stroke-width="3" stroke-linecap="square">
      <path d="M20 18H10v44h10" stroke="#22c55e" />
      <path d="M180 18h10v44h-10" class="stroke-foreground" />
    </g>
    <text
      x="100"
      y="54"
      text-anchor="middle"
      font-size="38"
      font-weight="900"
      letter-spacing="3"
      class="fill-foreground"
      font-stretch="expanded"
    >ODX</text>
  </svg>
</template>

<style scoped>
.stroke-foreground {
  stroke: #0a0a0a;
}
.fill-foreground {
  fill: #0a0a0a;
}

:root.dark .stroke-foreground,
.dark .stroke-foreground {
  stroke: #ffffff;
}
:root.dark .fill-foreground,
.dark .fill-foreground {
  fill: #ffffff;
}
</style>
