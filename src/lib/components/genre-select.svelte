<script lang="ts">
    import * as Select from "$lib/components/ui/select/index"
    import { onMount } from "svelte"
    import { dataStore, queryStore, fetchAssets } from "$lib/shared/store.svelte"

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
    ]

    function selectGenre(label: string) {
        // Try to find a tag in tag_summary that matches this label
        const found = dataStore.tag_summary.find(
            (entry) => entry.tag.label.toLowerCase() === label.toLowerCase()
        )

        if (found) {
            const uuid = found.tag.uuid
            const idx = dataStore.tags.indexOf(uuid)
            if (idx > -1) {
                dataStore.tags.splice(idx, 1)
            } else {
                dataStore.tags.push(uuid)
            }
        } else {
            // Fallback: use the label as a query term
            queryStore.query = label
        }

        fetchAssets()
    }
</script>

<Select.Root type="single" onValueChange={(v) => { if (v) { selectGenre(v); /* reset selection so same item can be picked again */ } }}>
    <Select.Trigger class="w-[180px] mr-1">Genre</Select.Trigger>
    <Select.Content class="min-w-[20rem] max-w-[95vw]">
        <!-- Wrap grid in a scrolling container so the content respects viewport height -->
        <div class="max-h-[60vh] overflow-y-auto p-1">
            <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-6">
                {#each genresColumns as col}
                    <div>
                        <Select.Group>
                            <Select.GroupHeading class="text-xs text-muted-foreground font-normal mb-1">
                                {col.heading}
                            </Select.GroupHeading>
                            <div class="flex flex-col gap-1">
                                {#each col.items as item}
                                    <Select.Item value={item} label={item} class="text-sm text-foreground text-left py-0.5">
                                        {item}
                                    </Select.Item>
                                {/each}
                            </div>
                        </Select.Group>
                    </div>
                {/each}
            </div>
        </div>
    </Select.Content>
</Select.Root>
