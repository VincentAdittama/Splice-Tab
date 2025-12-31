<script lang="ts">
  import { cn } from "$lib/utils";
  import Button from "$lib/components/ui/button/button.svelte";
  import Play from "lucide-svelte/icons/play";
  import Pause from "lucide-svelte/icons/pause";
  import SkipForward from "lucide-svelte/icons/skip-forward";
  import SkipBack from "lucide-svelte/icons/skip-back";
  import { globalAudio } from "$lib/shared/audio.svelte";
  import type { MouseEventHandler } from "svelte/elements";
  import LoaderCircle from "lucide-svelte/icons/loader-circle";
  import { loading } from "$lib/shared/loading.svelte";
  import PackPreview from "$lib/components/pack-preview.svelte";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import { dataStore, fetchAssets } from "$lib/shared/store.svelte";
  import TagBadge from "$lib/components/tag-badge.svelte";
  import { assetIcons } from "$lib/shared/icons.svelte";
  import CircleX from "lucide-svelte/icons/circle-x";
  import VolumeX from "lucide-svelte/icons/volume-x";
  import Volume1 from "lucide-svelte/icons/volume-1";
  import Volume2 from "lucide-svelte/icons/volume-2";

  let {
    class: className,
    onnext,
    onprev,
    ...restProps
  }: {
    class?: string;
    onnext: MouseEventHandler<HTMLButtonElement> &
      MouseEventHandler<HTMLAnchorElement>;
    onprev: MouseEventHandler<HTMLButtonElement> &
      MouseEventHandler<HTMLAnchorElement>;
  } = $props();

  const currentPack = $derived(globalAudio.currentAsset?.parents.items[0]);
  const currentName = $derived(
    globalAudio.currentAsset?.name.split("/").slice(-1)[0]
  );
</script>

<div class={cn("flex flex-col w-full", className)} {...restProps}>
  <audio
    bind:this={globalAudio.ref}
    bind:paused={globalAudio.paused}
    bind:currentTime={globalAudio.currentTime}
    bind:duration={globalAudio.duration}
    bind:volume={globalAudio.volume}
    onloadstart={() => {
      globalAudio.loading = true;
      // TODO: Move into list component
    }}
    oncanplaythrough={() => {
      globalAudio.loading = false;
    }}
  ></audio>
  <input
    style="--progress: {globalAudio.progress() * 100 || 0}%"
    type="range"
    class="slider-nothumb h-1"
    min={0}
    max={globalAudio.duration || 0}
    step="any"
    bind:value={globalAudio.currentTime}
    onclick={() => globalAudio.ref.play()}
  />
  <div class="flex items-center justify-between py-2 px-4 gap-4">
    <div class="flex gap-1">
      <Button
        variant="ghost"
        size="icon-lg"
        onclick={onprev}
        disabled={!globalAudio.currentAsset}><SkipBack /></Button
      >
      <Button
        variant="ghost"
        size="icon-lg"
        onclick={() => globalAudio.togglePlay()}
        disabled={!globalAudio.currentAsset}
      >
        {#if globalAudio.loading || loading.samplesCount}
          <LoaderCircle class="animate-spin" />
        {:else if globalAudio.paused}
          <Play />
        {:else}
          <Pause />
        {/if}
      </Button>
      <Button
        variant="ghost"
        size="icon-lg"
        onclick={onnext}
        disabled={!globalAudio.currentAsset}><SkipForward /></Button
      >
    </div>
    {#if globalAudio.currentAsset}
      <div class="flex gap-4 items-center shrink min-w-64">
        <PackPreview side="top" pack={currentPack} />
        <div>
          {#if globalAudio.currentAsset.asset_category_slug in assetIcons}
            {@const Icon =
              assetIcons[globalAudio.currentAsset.asset_category_slug]}
            <Icon class="group-hover:hidden" />
          {:else}
            <CircleX class="group-hover:hidden" />
          {/if}
        </div>
        <div class="min-w-32 overflow-clip">
          <div
            class="text-left pr-4 relative after:content-[''] after:absolute after:inset-y-0 after:right-0 after:w-4 after:bg-gradient-to-r after:from-transparent after:pointer-events-none after:to-background"
          >
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger class="overflow-clip text-nowrap cursor-grab">
                  {currentName}
                </Tooltip.Trigger>
                <Tooltip.Content>
                  {currentName}
                </Tooltip.Content>
              </Tooltip.Root>
            </Tooltip.Provider>
            <div class="flex gap-0.5 text-xs overflow-clip text-nowrap pr-2">
              {#each globalAudio.currentAsset.tags as tag}
                {@const active = dataStore.tags.includes(tag.uuid)}
                {@const tag_summary_tag = dataStore.tag_summary.find(
                  (t: any) => t.tag.uuid == tag.uuid
                )}
                <TagBadge
                  label={tag.label}
                  variant="ghost"
                  class="px-1 py-0.5 h-auto"
                  count={tag_summary_tag?.count ?? 0}
                  onclick={() => {
                    if (!active) {
                      dataStore.tags.push(tag.uuid);
                      // updateTagSummary()
                      fetchAssets();
                    }
                  }}
                />
              {/each}
            </div>
          </div>
        </div>
      </div>
    {/if}
    <div class="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon-lg"
        class="shrink-0"
        onclick={() => globalAudio.toggleMute()}
      >
        {#if globalAudio.volume == 0}
          <VolumeX />
        {:else if globalAudio.volume < 0.5}
          <Volume1 />
        {:else}
          <Volume2 />
        {/if}
      </Button>
      <input
        style="--progress: {globalAudio.volume * 100}%"
        type="range"
        class="slider-nothumb h-1.5 rounded-full"
        min={0}
        max={1}
        step="any"
        bind:value={globalAudio.volume}
      />
    </div>
  </div>
</div>

<style>
  .slider-nothumb {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
    width: 100%;
    overflow: clip;

    --track-bg: linear-gradient(
      to right,
      theme("colors.muted.foreground") 0%,
      theme("colors.muted.foreground") calc(var(--progress, 0%)),
      theme("colors.muted.DEFAULT") calc(var(--progress, 0%)),
      theme("colors.muted.DEFAULT") 100%
    );
  }

  .slider-nothumb:focus {
    outline: none;
  }

  .slider-nothumb::-webkit-slider-runnable-track {
    height: 100%;
    background: var(--track-bg);
  }

  .slider-nothumb::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 1rem;
    height: 100%;
    opacity: 0;
  }

  .slider-nothumb:focus::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 1rem;
    height: 100%;
    opacity: 0;
  }

  .slider-nothumb::-moz-range-track {
    height: 100%;
    background: var(--track-bg);
  }

  .slider-nothumb::-moz-range-thumb {
    appearance: none;
    width: 1rem;
    height: 100%;
    opacity: 0;
  }

  .slider-nothumb:focus::-moz-range-thumb {
    appearance: none;
    width: 1rem;
    height: 100%;
    opacity: 0;
  }
</style>
