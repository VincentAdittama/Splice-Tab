<script lang="ts">
  import { tabManager } from "$lib/shared/tabs.svelte";
  import { cn } from "$lib/utils";
  import X from "lucide-svelte/icons/x";
  import Plus from "lucide-svelte/icons/plus";
  import Button from "./ui/button/button.svelte";

  const { class: className } = $props<{ class?: string }>();
</script>

<div
  class={cn("flex items-center gap-2 overflow-x-auto no-scrollbar", className)}
>
  {#each tabManager.tabs as tab (tab.id)}
    <div
      role="button"
      tabindex="0"
      class={cn(
        "group relative flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border cursor-pointer",
        tab.id === tabManager.activeTabId
          ? "bg-secondary text-secondary-foreground border-border"
          : "hover:bg-muted text-muted-foreground border-transparent hover:border-border"
      )}
      onclick={() => tabManager.switchTab(tab.id)}
      onkeydown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          tabManager.switchTab(tab.id);
        }
      }}
    >
      <span class="max-w-[150px] truncate">
        {tab.title}
      </span>

      <button
        class={cn(
          "opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-sm hover:bg-background/50",
          tabManager.tabs.length > 1 ? "" : "hidden"
        )}
        onclick={(e) => {
          e.stopPropagation();
          tabManager.closeTab(tab.id);
        }}
      >
        <X class="size-3" />
      </button>

      {#if tab.id === tabManager.activeTabId}
        <div
          class="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-primary"
        ></div>
      {/if}
    </div>
  {/each}

  <Button
    variant="ghost"
    size="icon"
    class="size-8 shrink-0"
    onclick={() => tabManager.addTab()}
  >
    <Plus class="size-4" />
  </Button>
</div>
