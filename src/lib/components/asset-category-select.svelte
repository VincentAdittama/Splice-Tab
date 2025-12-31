<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import Layers from "lucide-svelte/icons/layers";
  import Repeat from "lucide-svelte/icons/repeat";
  import Zap from "lucide-svelte/icons/zap";
  import { cn } from "$lib/utils";

  let {
    asset_category_slug = $bindable(),
    onselect,
  }: { asset_category_slug: string | null; onselect: () => void } = $props();

  const options = [
    {
      value: null,
      label: "All",
      icon: Layers,
    },
    {
      value: "loop",
      label: "Loops",
      icon: Repeat,
    },
    {
      value: "oneshot",
      label: "One-Shots",
      icon: Zap,
    },
  ];

  const selectCategory = (value: string | null) => {
    asset_category_slug = value;
    onselect();
  };
</script>

<div class="flex items-center bg-muted/50 p-1 rounded-lg border border-border">
  {#each options as option}
    {@const active = asset_category_slug === option.value}
    <Button
      variant={active ? "secondary" : "ghost"}
      size="sm"
      onclick={() => selectCategory(option.value)}
      class={cn(
        "h-7 px-3 gap-1.5 transition-all text-xs font-medium",
        active
          ? "bg-background shadow-sm text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <option.icon size="14" />
      {option.label}
    </Button>
  {/each}
</div>
