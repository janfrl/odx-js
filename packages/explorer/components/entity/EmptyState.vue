<template>
  <div
    class="flex-1 flex flex-col items-center justify-center text-center p-12 bg-muted/5 border-t-2 border-x-2 border-dashed border-default rounded-t-2xl transition-all"
  >
    <div class="w-16 h-16 rounded-2xl bg-default border border-default flex items-center justify-center mb-6 shadow-sm">
      <UIcon name="i-lucide-database" class="text-muted w-8 h-8" />
    </div>
    <h3 class="text-sm font-bold uppercase tracking-widest mb-2 text-default">
      Select an Entity
    </h3>
    <p class="text-[12px] text-muted max-w-70 leading-relaxed">
      Choose one of the available entity sets above to explore, edit, or create OData records.
    </p>
  </div>
</template>
