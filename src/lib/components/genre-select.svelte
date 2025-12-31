<script lang="ts">
  import * as Popover from "$lib/components/ui/popover/index";
  import * as Command from "$lib/components/ui/command/index";
  import { Badge } from "$lib/components/ui/badge/index";
  import { Button } from "$lib/components/ui/button/index";
  import {
    dataStore,
    fetchAssets,
    isTagSelected,
    toggleTag,
  } from "$lib/shared/store.svelte";
  import { X, Check } from "lucide-svelte";

  // Genre columns/layout - headings (grey, non-clickable) and clickable items (black)
  const genresColumns = [
    {
      heading: "HIP HOP / R&B",
      items: [
        "Hip Hop",
        "Trap",
        "R&B",
        "PluggNB",
        "Rage",
        "Drill",
        "UK Drill",
        "Lo-Fi Hip Hop",
        "Boom Bap",
        "Brazilian Funk",
        "Soul",
        "Neo Soul",
        "Future Soul",
        "Reggaeton",
        "Dancehall",
        "Jersey Club",
        "Moombahton",
        "Future Bass",
        "Glitch Hop",
      ],
    },
    {
      heading: "HOUSE / TECHNO",
      items: [
        "Techno",
        "House",
        "Tech House",
        "Deep House",
        "Nu Disco",
        "Afro House",
        "Amapiano",
        "Disco",
        "Electro",
        "Minimal Techno",
        "Dub Techno",
        "Hard Techno",
        "UK Garage",
        "Speed Garage",
        "Rave",
        "Melodic Techno",
        "French House",
        "Acid House",
        "Bass House",
        "Progressive House",
        "Melodic House",
        "Big Room House",
        "Hardstyle",
      ],
    },
    {
      heading: "POP / EDM",
      items: [
        "Pop",
        "EDM",
        "Indie Pop",
        "Afropop & Afrobeats",
        "Hyperpop",
        "Synth-Pop",
        "K-Pop",
        "Bedroom Pop",
        "Dream Pop",
        "Drift Phonk",
        "Trap EDM",
        "Trance",
        "Psytrance",
        "Eurodance",
        "Future House",
        "Fidget House",
        "Tropical House",
      ],
    },
    {
      heading: "LIVE SOUNDS",
      items: [
        "Rock",
        "Indie Rock",
        "Indie Dance",
        "Jazz",
        "Blues",
        "Gospel",
        "Heavy Metal",
        "Funk",
        "Dub",
        "Reggae",
        "Afrobeat",
        "Folk",
        "Country",
        "Classical",
        "Shoegaze",
        "Emo",
        "Punk",
        "Post-Punk",
        "Bossa Nova",
        "Cumbia",
        "Salsa",
        "Flamenco",
        "Samba",
      ],
    },
    {
      heading: "BASS MUSIC",
      items: [
        "Drum and Bass",
        "Jungle",
        "Jump Up DnB",
        "Drumstep",
        "Breakbeat",
        "Dubstep",
        "Tearout Dubstep",
        "Grime",
        "Leftfield Bass",
      ],
    },
    {
      heading: "ELECTRONIC",
      items: [
        "Downtempo",
        "Ambient",
        "Synthwave",
        "Chillout",
        "Indie Electronic",
        "Chillwave",
        "IDM",
        "Experimental",
        "Industrial",
        "Chiptune",
        "Trip Hop",
        "Footwork",
      ],
    },
    {
      heading: "GLOBAL",
      items: [
        "African",
        "Asian",
        "Brazilian",
        "Caribbean",
        "Indian",
        "Latin American",
        "Middle Eastern",
        "South Asian",
      ],
    },
    {
      heading: "CINEMATIC / FX",
      items: ["Cinematic", "Game Audio"],
    },
  ];

  let open = $state(false);
  let searchValue = $state("");

  const filteredGenresColumns = $derived.by(() => {
    const search = searchValue.trim().toLowerCase();
    if (!search) return genresColumns;

    return genresColumns
      .map((col) => ({
        ...col,
        items: col.items.filter((item) => item.toLowerCase().includes(search)),
      }))
      .filter((col) => col.items.length > 0);
  });

  function isSelected(label: string) {
    return isTagSelected(label);
  }

  function toggleGenre(label: string) {
    toggleTag(label);
  }

  function clearAll() {
    // Only clear tags that match labels in our genre columns
    const allKnownGenreLabels = new Set(
      genresColumns.flatMap((col) =>
        col.items.map((item) => item.toLowerCase())
      )
    );

    // We need to find all UUIDs for these labels
    const uuidsToRemove = new Set<string>();

    dataStore.all_genres.forEach((g) => {
      if (allKnownGenreLabels.has(g.label.toLowerCase()))
        uuidsToRemove.add(g.uuid);
    });
    dataStore.tag_summary.forEach((entry) => {
      if (allKnownGenreLabels.has(entry.tag.label.toLowerCase()))
        uuidsToRemove.add(entry.tag.uuid);
    });

    dataStore.tags = dataStore.tags.filter((tag) => !uuidsToRemove.has(tag));
    fetchAssets();
  }

  const selectedCount = $derived(
    genresColumns.reduce(
      (acc, col) => acc + col.items.filter((item) => isSelected(item)).length,
      0
    )
  );

  const selectedGenreNames = $derived(
    genresColumns.flatMap((col) => col.items.filter((item) => isSelected(item)))
  );
</script>

<Popover.Root bind:open>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button
        {...props}
        variant="outline"
        class="h-9 px-3 flex items-center gap-2 min-w-[100px] border-dashed"
      >
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium">Genre</span>
          {#if selectedCount > 0}
            <div class="h-4 w-[1px] bg-border mx-1"></div>
            <Badge
              variant="secondary"
              class="rounded-sm px-1 font-normal lg:hidden"
            >
              {selectedCount}
            </Badge>
            <div class="hidden space-x-1 lg:flex flex-wrap gap-1">
              {#if selectedCount > 2}
                <Badge variant="secondary" class="rounded-sm px-1 font-normal">
                  {selectedCount} selected
                </Badge>
              {:else}
                {#each selectedGenreNames as name}
                  <Badge
                    variant="secondary"
                    class="rounded-sm px-1 font-normal"
                  >
                    {name}
                  </Badge>
                {/each}
              {/if}
            </div>
          {/if}
        </div>
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content class="w-[300px] p-0" align="start">
    <Command.Root shouldFilter={false}>
      <Command.Input placeholder="Search genres..." bind:value={searchValue} />
      <Command.List class="max-h-[350px] overflow-y-auto">
        {#if filteredGenresColumns.length === 0}
          <Command.Empty>No genre found.</Command.Empty>
        {/if}
        {#each filteredGenresColumns as col}
          <Command.Group heading={col.heading}>
            {#each col.items as item}
              <Command.Item
                value={item}
                onSelect={() => toggleGenre(item)}
                class="flex items-center gap-2 px-2 py-1.5 cursor-pointer"
              >
                <div
                  class="flex h-4 w-4 items-center justify-center rounded-sm border border-primary {isSelected(
                    item
                  )
                    ? 'bg-primary text-primary-foreground'
                    : 'opacity-50'}"
                >
                  {#if isSelected(item)}
                    <Check class="h-3 w-3" />
                  {/if}
                </div>
                <span class="flex-1">{item}</span>
              </Command.Item>
            {/each}
          </Command.Group>
        {/each}
      </Command.List>
      {#if selectedCount > 0}
        <div class="grid grid-cols-2 border-t p-1 gap-1">
          <Button
            variant="ghost"
            class="justify-center text-xs h-8"
            onclick={clearAll}
          >
            Clear selections
          </Button>
          <Button
            variant="ghost"
            class="justify-center text-xs h-8"
            onclick={() => (open = false)}
          >
            Close
          </Button>
        </div>
      {/if}
    </Command.Root>
  </Popover.Content>
</Popover.Root>
