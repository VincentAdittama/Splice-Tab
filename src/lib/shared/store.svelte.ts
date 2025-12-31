import { CategoryList, querySplice, SamplesSearch } from "$lib/splice/api"
import { descrambleSample } from "$lib/splice/descrambler"
import type {
    AssetCategorySlug,
    AssetSortType,
    ChordType,
    Key,
    SampleAsset,
    SamplesSearchResponse,
    SortOrder,
    TagSummaryEntry,
} from "$lib/splice/types"
import { globalAudio } from "./audio.svelte"
import { loading } from "./loading.svelte"
import { fetch } from "@tauri-apps/plugin-http"

export const DEFAULT_SORT = "relevance"
export const PER_PAGE = 50

export const randomSeed = () =>
    Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString()

export const dataStore = $state({
    sampleAssets: [] as SampleAsset[],
    descrambledSamples: new Map<string, string>(),
    tags: [] as string[],
    tag_summary: [] as TagSummaryEntry[],
    all_genres: [] as { uuid: string; label: string }[],
    total_records: 0,
})

export const keys = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
] as const
export const chord_types = ["major", "minor"]

export const queryStore = $state({
    query: "",
    sort: DEFAULT_SORT as AssetSortType,
    random_seed: randomSeed(),
    order: "DESC" as SortOrder,
    page: 1,
    asset_category_slug: null as AssetCategorySlug | null,
    bpm: null as string | null,
    min_bpm: null as number | null,
    max_bpm: null as number | null,
    key: null as Key | null,
    chord_type: null as ChordType | null,
})

// The query identity is the part of the query that uniquely identifies the returned data
// It is used to determine if the fetched data should replace the current data, be appended to it, or be ignored
const queryIdentity = $derived({
    query: queryStore.query,
    sort: queryStore.sort,
    order: queryStore.order,
    random_seed: queryStore.random_seed,
    tags: dataStore.tags,
    asset_category_slug: queryStore.asset_category_slug,
    bpm: queryStore.bpm?.toString(),
    min_bpm: queryStore.min_bpm,
    max_bpm: queryStore.max_bpm,
    key: queryStore.key,
    chord_type: queryStore.chord_type,
})

export const storeCallbacks = $state({
    onbeforedataupdate: null as (() => void) | null,
    onbeforetagsupdate: null as (() => void) | null,
})

let currentQueryIdentity: string = ""

export const fetchAllGenres = async () => {
    const categoriesToFetch = ["genres", "styles"]
    
    try {
        const results = await Promise.all(
            categoriesToFetch.map(tagCategory => querySplice(CategoryList, { tagCategory }))
        )

        const allGenres: { uuid: string; label: string }[] = []

        results.forEach((response, index) => {
            if (!response?.data?.categories) return
            const tagCategory = categoriesToFetch[index]
            const categories = response.data.categories.categories

            categories.forEach((cat: any) => {
                const processTags = (tags: any[]) => {
                    tags.forEach((tag: any) => {
                        // Avoid duplicates, prioritizing earlier categories (genres > styles)
                        if (!allGenres.some(g => g.label.toLowerCase() === tag.label.toLowerCase())) {
                            allGenres.push({ uuid: tag.uuid, label: tag.label })
                        }
                    })
                }

                if (cat.tags) processTags(cat.tags)
                if (cat.subcategories) {
                    cat.subcategories.forEach((sub: any) => {
                        if (sub.tags) processTags(sub.tags)
                    })
                }
            })
            console.info(`🎸 Loaded all ${tagCategory}`)
        })

        dataStore.all_genres = allGenres
    } catch (error) {
        console.error("⚠️ Failed to fetch all genres", error)
    }
}

export const fetchAssets = () => {
    const identityBeforeFetch = JSON.stringify(queryIdentity)
    if (identityBeforeFetch != currentQueryIdentity) {
        storeCallbacks.onbeforedataupdate?.()
    }
    loading.assets = true
    querySplice(SamplesSearch, {
        ...queryIdentity,
        page: queryStore.page,
        limit: PER_PAGE,
    })
        .then((response) => {
            const searchResult = (response as SamplesSearchResponse).data
                .assetsSearch
            const identityAfterFetch = JSON.stringify(queryIdentity)
            if (identityBeforeFetch == identityAfterFetch) {
                if (identityBeforeFetch == currentQueryIdentity) {
                    dataStore.sampleAssets.push(...searchResult.items)
                    console.info("➕ Loaded more assets")
                } else {
                    // Free descrambled samples that are not in the new search result / currently selected
                    for (const sampleAsset of dataStore.sampleAssets) {
                        if (
                            !searchResult.items.some(
                                (other) => sampleAsset.uuid == other.uuid
                            ) &&
                            sampleAsset.uuid != globalAudio.currentAsset?.uuid
                        ) {
                            freeDescrambledSample(sampleAsset.uuid)
                        }
                    }
                    // Prevent duplicates
                    dataStore.sampleAssets = searchResult.items.filter(
                        (asset) =>
                            !dataStore.sampleAssets.some(
                                (other) => other.uuid == asset.uuid
                            )
                    )
                    currentQueryIdentity = identityAfterFetch
                    queryStore.page = 1
                    console.info("🔄️ Loaded new assets")
                }
                dataStore.total_records = searchResult.response_metadata.records

                storeCallbacks.onbeforetagsupdate?.()
                dataStore.tag_summary = searchResult.tag_summary

                loading.assets = false
                loading.beforeFirstLoad = false

                loading.fetchError = null
            } else {
                console.info("🕜 Ignored stale assets")
            }
        })
        .catch((error: Error) => {
            console.error("⚠️ Failed to fetch assets", error)
            loading.fetchError = error
            loading.assets = false
        })
}

export async function getDescrambledSampleURL(sampleAsset: SampleAsset) {
    const existingBlobURL = dataStore.descrambledSamples.get(sampleAsset.uuid)
    if (existingBlobURL) {
        console.info("✔️ Reusing descrambled sample blob")
        return existingBlobURL
    }

    loading.samples.add(sampleAsset.uuid)
    loading.samplesCount++

    const response = await fetch(sampleAsset.files[0].url)

    const data = new Uint8Array(await response.arrayBuffer())

    const descrambledData = descrambleSample(data)

    const blob = new Blob([descrambledData], {
        type: "audio/mp3",
    })

    const blobURL = window.URL.createObjectURL(blob)

    dataStore.descrambledSamples.set(sampleAsset.uuid, blobURL)

    loading.samples.delete(sampleAsset.uuid)
    loading.samplesCount--

    console.info("🔗 Created descrambled sample blob")

    return blobURL
}

export function freeDescrambledSample(uuid: string) {
    const existingBlobURL = dataStore.descrambledSamples.get(uuid)
    if (!existingBlobURL) return false

    dataStore.descrambledSamples.delete(uuid)
    window.URL.revokeObjectURL(existingBlobURL)
    console.info("⛓️‍💥 Freed descrambled sample")

    return true
}

export function normalizeLabel(label: string) {
    let l = label.toLowerCase().trim()
    
    // Common Splice Aliases
    const aliases: Record<string, string> = {
        "r&b": "rnb",
        "r and b": "rnb",
        "drum and bass": "dnb",
        "drum & bass": "dnb",
        "lo-fi hip hop": "lofi hip hop",
        "lo-fi": "lofi",
    }

    if (aliases[l]) return aliases[l]
    
    // Fuzzier matching: remove special chars
    return l.replace(/[^a-z0-9]/g, "")
}

const selectedLabels = $derived.by(() => {
    const normalizedSelected = new Set<string>()
    const tagSet = new Set(dataStore.tags)

    dataStore.all_genres.forEach((g) => {
        if (tagSet.has(g.uuid)) normalizedSelected.add(normalizeLabel(g.label))
    })
    dataStore.tag_summary.forEach((entry) => {
        if (tagSet.has(entry.tag.uuid)) normalizedSelected.add(normalizeLabel(entry.tag.label))
    })

    return normalizedSelected
})


export function isTagSelected(label: string) {
    return selectedLabels.has(normalizeLabel(label))
}

export function toggleTag(label: string) {
    const targetNormalized = normalizeLabel(label)
    const uuids = new Set<string>()

    // Collect all known UUIDs that normalize to this label
    dataStore.all_genres.forEach((g) => {
        if (normalizeLabel(g.label) === targetNormalized) uuids.add(g.uuid)
    })
    dataStore.tag_summary.forEach((entry) => {
        if (normalizeLabel(entry.tag.label) === targetNormalized)
            uuids.add(entry.tag.uuid)
    })

    if (uuids.size === 0) return

    const anySelected = Array.from(uuids).some((uuid) =>
        dataStore.tags.includes(uuid)
    )

    if (anySelected) {
        // Remove all matching tags
        dataStore.tags = dataStore.tags.filter((tag) => !uuids.has(tag))
    } else {
        // Add the "best" UUID (preferring all_genres)
        const bestUuid =
            dataStore.all_genres.find(
                (g) => normalizeLabel(g.label) === targetNormalized
            )?.uuid ||
            dataStore.tag_summary.find(
                (entry) => normalizeLabel(entry.tag.label) === targetNormalized
            )?.tag.uuid
        if (bestUuid) {
            dataStore.tags.push(bestUuid)
        }
    }
    fetchAssets()
}
