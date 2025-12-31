<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import Star from "lucide-svelte/icons/star";
  import Flame from "lucide-svelte/icons/flame";
  import Clock from "lucide-svelte/icons/clock";
  import Shuffle from "lucide-svelte/icons/shuffle";
  import { cn } from "$lib/utils";
  import type { SortOrder } from "$lib/splice/types";

  let {
    sort = $bindable(),
    onselect,
    onshuffle,
    order,
  }: {
    sort: string;
    onselect: () => void;
    onshuffle: () => void;
    order: SortOrder;
  } = $props();

  const softOptions = [
    {
      value: "random",
      label: "Random",
      icon: Shuffle,
    },
    {
      value: "relevance",
      label: "Relevant",
      icon: Star,
    },
    {
      value: "popularity",
      label: "Popular",
      icon: Flame,
    },
    {
      value: "recency",
      label: "Recent",
      icon: Clock,
    },
  ];

  const selectSort = (value: string) => {
    if (value === "random") {
      onshuffle();
    } else {
      sort = value;
      onselect();
    }
  };
</script>

<div class="flex items-center bg-muted/50 p-1 rounded-lg border border-border">
  {#each softOptions as option}
    {@const active = sort === option.value}
    <Button
      variant={active ? "secondary" : "ghost"}
      size="sm"
      onclick={() => selectSort(option.value)}
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
