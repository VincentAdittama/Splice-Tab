<script lang="ts">
  import SampleListEntry from "./sample-list-entry.svelte";
  import SearchInput from "$lib/components/search-input.svelte";
  import { ScrollArea } from "$lib/components/ui/scroll-area";
  import { onMount, tick } from "svelte";
  import SortSelect from "$lib/components/sort-select.svelte";
  import Search from "lucide-svelte/icons/search";
  import Smile from "lucide-svelte/icons/smile";
  import Ghost from "lucide-svelte/icons/ghost";
  import Shuffle from "lucide-svelte/icons/shuffle";
  import Button from "$lib/components/ui/button/button.svelte";
  import GenreSelect from "$lib/components/genre-select.svelte";
  import ProgressLoading from "$lib/components/progress-loading.svelte";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import SortHeader from "$lib/components/sort-header.svelte";
  import ChevronDown from "lucide-svelte/icons/chevron-down";
  import { cn } from "$lib/utils";
  import AssetCategorySelect from "$lib/components/asset-category-select.svelte";
  import BpmSelect from "$lib/components/bpm-select.svelte";
  import AudioPlayer from "$lib/components/audio-player.svelte";
  import TagBadge from "$lib/components/tag-badge.svelte";
  import { globalAudio } from "$lib/shared/audio.svelte";
  import type { AssetSortType } from "$lib/splice/types";
  import { loading } from "$lib/shared/loading.svelte";
  import {
    dataStore,
    storeCallbacks,
    queryStore,
    fetchAssets,
    fetchAllGenres,
    isTagSelected,
    toggleTag,
    DEFAULT_SORT,
    randomSeed,
  } from "$lib/shared/store.svelte";
  import SettingsDialog from "$lib/components/settings-dialog.svelte";
  import KeySelect from "$lib/components/key-select.svelte";

  // TODO: Taxonomy comboboxes (maybe just pass all tags to each)
  // const instrumentTags = $derived(() =>
  //     dataStore.tag_summary.filter(
  //         (entry) => entry.tag.taxonomy.name == "Instrument"
  //     )
  // )

  // const genreTags = $derived(() =>
  //     dataStore.tag_summary.filter(
  //         (entry) => entry.tag.taxonomy.name == "Genre"
  //     )
  // )

  $effect(() => {
    if (queryStore.sort in ["random", "popularity", "relevance", "recency"]) {
      queryStore.order = "DESC";
    }
  });

  storeCallbacks.onbeforedataupdate = () => {
    viewportRef.scrollTo({ top: 0, behavior: "smooth" });
  };

  storeCallbacks.onbeforetagsupdate = () => {
    tagsDrawerRef.style.height = `${tagsContainerRef.offsetHeight}px`;
  };

  let expandTags = $state(false);

  let viewportRef = $state<HTMLElement>(null!);
  let tagsContainerRef = $state<HTMLElement>(null!);
  let tagsDrawerRef = $state<HTMLElement>(null!);
  let searchInputRef = $state<HTMLInputElement>(null!);

  const selectedSampleIndex = $derived(
    dataStore.sampleAssets.findIndex(
      (sampleAsset) => sampleAsset.uuid == globalAudio.currentAsset?.uuid
    )
  );

  const updateSort = (newSort: AssetSortType) => {
    if (queryStore.sort == newSort) {
      if (queryStore.order == "DESC") {
        queryStore.order = "ASC";
      } else {
        queryStore.sort = DEFAULT_SORT;
      }
    } else {
      queryStore.sort = newSort;
      queryStore.order = "DESC";
    }
    fetchAssets();
  };

  const gotoPrev = () => {
    const currentIndex = dataStore.sampleAssets.findIndex(
      (asset) => asset.uuid === globalAudio.currentAsset?.uuid
    );
    if (currentIndex > -1) {
      const sampleAsset = dataStore.sampleAssets[currentIndex - 1];
      globalAudio.playSampleAsset(sampleAsset);
      const entryEl = document.getElementById(
        `sample-list-entry-${sampleAsset.uuid}`
      );
      if (entryEl)
        entryEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const gotoNext = () => {
    const currentIndex = dataStore.sampleAssets.findIndex(
      (asset) => asset.uuid === globalAudio.currentAsset?.uuid
    );
    if (
      currentIndex !== -1 &&
      currentIndex + 1 < dataStore.sampleAssets.length
    ) {
      const sampleAsset = dataStore.sampleAssets[currentIndex + 1];
      globalAudio.playSampleAsset(sampleAsset);
      const entryEl = document.getElementById(
        `sample-list-entry-${sampleAsset.uuid}`
      );
      if (entryEl)
        entryEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  // const updateTagSummary = () =>
  //     dataStore.tag_summary.sort(
  //         (a: any, b: any) =>
  //             Number(dataStore.tags.includes(b.tag.uuid)) -
  //             Number(dataStore.tags.includes(a.tag.uuid))
  //     )

  onMount(() => {
    viewportRef.addEventListener("scroll", () => {
      if (
        !loading.assets &&
        viewportRef.scrollTop + viewportRef.clientHeight >=
          viewportRef.scrollHeight - viewportRef.clientHeight
      ) {
        queryStore.page += 1;
        console.log("📃 End of list reached, loading more assets");
        fetchAssets();
      }
    });

    searchInputRef.focus();

    fetchAssets();
    fetchAllGenres();
  });
</script>

<main class="flex flex-col size-full">
  <div class="flex flex-col p-4 gap-4">
    <div class="flex gap-4 justify-between items-center">
      <SettingsDialog />
      <SearchInput
        bind:value={queryStore.query}
        onsubmit={fetchAssets}
        class="flex-grow"
        bind:inputRef={searchInputRef}
      />
      <KeySelect
        bind:key={queryStore.key}
        bind:chord_type={queryStore.chord_type}
        onselect={fetchAssets}
      />
      <BpmSelect
        bind:bpm={queryStore.bpm}
        bind:min_bpm={queryStore.min_bpm}
        bind:max_bpm={queryStore.max_bpm}
        onsubmit={fetchAssets}
      />
      <AssetCategorySelect
        bind:asset_category_slug={queryStore.asset_category_slug}
        onselect={fetchAssets}
      />
    </div>

    <div
      class="transition-[height] ease-in-out overflow-clip"
      bind:this={tagsDrawerRef}
    >
      <div class="flex justify-between gap-2" bind:this={tagsContainerRef}>
        <div
          class={cn(
            "min-w-0 relative",
            !expandTags &&
              "pr-4 after:content-[''] after:absolute after:inset-y-0 after:right-0 after:w-4 after:bg-gradient-to-r after:from-transparent after:to-background after:pointer-events-none"
          )}
        >
          <div
            class={cn(
              "flex text-nowrap gap-1 overflow-clip flex-shrink",
              expandTags && "flex-wrap"
            )}
          >
            {#each dataStore.tag_summary as tag}
              {@const active = isTagSelected(tag.tag.label)}
              <TagBadge
                label={tag.tag.label}
                count={tag.count}
                {active}
                onclick={() => toggleTag(tag.tag.label)}
              />
            {/each}
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          onclick={() => {
            expandTags = !expandTags;
            tick().then(() => {
              tagsDrawerRef.style.height = tagsContainerRef.offsetHeight + "px";
            });
          }}
          class="shrink-0 h-6 px-5 text-muted-foreground"
        >
          <ChevronDown
            size="18"
            class={cn(
              "transition-transform ease-in-out",
              expandTags ? "rotate-[-180deg]" : ""
            )}
          /></Button
        >
      </div>
    </div>

    <div class="flex justify-between items-end gap-2">
      <div class="text-muted-foreground text-xs flex-grow">
        {dataStore.total_records.toLocaleString()} results
      </div>
      <GenreSelect />
      <Button
        variant="outline"
        size="icon"
        onclick={() => {
          queryStore.random_seed = randomSeed();
          queryStore.sort = "random";
          fetchAssets();
        }}
      >
        <Shuffle />
      </Button>
      <SortSelect
        bind:sort={queryStore.sort}
        onselect={fetchAssets}
        order={queryStore.order}
      />
    </div>

    <div class="flex flex-col gap-2">
      <Separator />
      <div class="flex gap-2 items-center justify-between overflow-clip px-2">
        <div class="w-12 flex-shrink-0 text-xs text-muted-foreground">Pack</div>
        <div class="w-12 flex-shrink-0 text-xs text-muted-foreground"></div>
        <SortHeader
          value="name"
          label="Filename"
          sort={queryStore.sort}
          order={queryStore.order}
          onsort={updateSort}
          class="min-w-32 w-96 flex-[3_1_auto]"
        />
        <div class="min-w-32 w-[150px] flex-grow md:block hidden"></div>
        <SortHeader
          value="duration"
          label="Time"
          sort={queryStore.sort}
          order={queryStore.order}
          onsort={updateSort}
          class="flex-shrink-0 w-14 flex-grow"
        />
        <SortHeader
          value="key"
          label="Key"
          sort={queryStore.sort}
          order={queryStore.order}
          onsort={updateSort}
          class="flex-shrink-0 w-14 flex-grow"
        />
        <SortHeader
          value="bpm"
          label="BPM"
          sort={queryStore.sort}
          order={queryStore.order}
          onsort={updateSort}
          class="flex-shrink-0 w-14 flex-grow"
        />
      </div>
      <ProgressLoading loading={loading.assets || loading.waveformsCount > 0} />
    </div>
  </div>
  <ScrollArea
    class="px-4 flex-grow before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-4 before:bg-gradient-to-t before:from-transparent before:to-background before:pointer-events-none after:content-[''] after:absolute after:inset-x-0 after:bottom-0 after:h-4 after:bg-gradient-to-b after:from-transparent after:to-background after:pointer-events-none"
    bind:viewportRef
    onkeydown={(e) => {
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          gotoPrev();
          break;
        case "ArrowDown":
          e.preventDefault();
          gotoNext();
          break;
        case "ArrowLeft":
          e.preventDefault();
          gotoPrev();
          break;
        case "ArrowRight":
          e.preventDefault();
          gotoNext();
          break;
        case " ":
          e.preventDefault();
          globalAudio.togglePlay();
          break;
      }
    }}
  >
    <div class="flex flex-col py-2 size-full">
      {#each dataStore.sampleAssets as sampleAsset, index}
        {@const selected = globalAudio.currentAsset?.uuid == sampleAsset.uuid}
        <SampleListEntry
          {sampleAsset}
          {selected}
          playing={selected && !globalAudio.paused}
        />
        {#if index < dataStore.sampleAssets.length - 1}
          <div
            class={selected || index + 1 == selectedSampleIndex ? "px-2" : ""}
          >
            <Separator />
          </div>
        {/if}
      {:else}
        <div
          class="flex flex-col gap-2 justify-center items-center size-full text-muted-foreground"
        >
          {#if loading.fetchError}
            <Ghost size="48" />
            <p class="font-bold text-xl">Something went wrong :/</p>
            <p class="text-sm">Couldn't load any samples</p>
            <Button onclick={fetchAssets}>Retry</Button>
          {:else if loading.beforeFirstLoad}
            <Smile size="48" />
            <p class="font-bold text-xl">Hey there!</p>
            <p class="text-sm">Make some cool music, will ya?</p>
          {:else}
            <Search size="48" />
            <p class="font-bold text-xl">No results</p>
            <p class="text-sm">Try different keywords</p>
          {/if}
        </div>
      {/each}
      {#if loading.fetchError && dataStore.sampleAssets.length > 0}
        <div
          class="flex flex-col py-8 gap-2 justify-center items-center text-muted-foreground"
        >
          <Ghost size="48" />
          <p class="font-bold text-xl">Something went wrong :/</p>
          <p class="text-sm">Couldn't load any more samples</p>
          <Button onclick={fetchAssets}>Retry</Button>
        </div>
      {/if}
    </div>
  </ScrollArea>
  <AudioPlayer onprev={gotoPrev} onnext={gotoNext} />
</main>
