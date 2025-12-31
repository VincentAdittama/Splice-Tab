<script lang="ts">
  import * as HoverCard from "$lib/components/ui/hover-card/index.js";
  import type { PackAsset } from "$lib/splice/types";
  import { openUrl } from "@tauri-apps/plugin-opener";
  import { tabManager } from "$lib/shared/tabs.svelte";
  import { fetchAssets } from "$lib/shared/store.svelte";

  const {
    pack,
    side = "right",
    size = 12,
    class: className,
  }: {
    pack: PackAsset | undefined;
    side?: "right" | "top" | "bottom" | "left";
    size?: number;
    class?: string;
  } = $props();

  const name = $derived(pack?.name.split("/").slice(-1)[0]);
  const imgSrc = $derived(pack?.files[0].url);

  const packURL = $derived(
    `https://splice.com/sounds/packs/${pack?.permalink_base_url}/${pack?.permalink_slug}`
  );

  const openPackTab = () => {
    if (!pack) return;
    const newTab = tabManager.addTab();
    newTab.queryState.parent_asset_uuid = pack.uuid;
    newTab.queryState.packName = pack.name;
    newTab.queryState.query = ""; // Clear search query to show all pack samples

    // Ensure we switch to the new tab
    tabManager.activeTabId = newTab.id;

    // Fetch assets for the new tab
    fetchAssets();
  };
</script>

{#if pack}
  <HoverCard.Root>
    <HoverCard.Trigger class="flex-shrink-0" onclick={openPackTab}>
      <img
        src={imgSrc}
        alt={name}
        class={`size-${size} rounded`}
        draggable="false"
      />
    </HoverCard.Trigger>
    <HoverCard.Content {side} class="flex flex-col justify-center gap-2">
      <button onclick={openPackTab}>
        <img src={imgSrc} alt={name} class="w-full rounded" />
      </button>
      <p>{name}</p>
    </HoverCard.Content>
  </HoverCard.Root>
{:else}
  <div class={`size-${size} rounded flex-shrink-0 bg-muted`}></div>
{/if}
