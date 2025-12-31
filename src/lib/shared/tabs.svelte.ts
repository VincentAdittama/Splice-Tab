import { DEFAULT_SORT, randomSeed } from "./constants"
import type {
    AssetCategorySlug,
    AssetSortType,
    ChordType,
    Key,
    SampleAsset,
    SortOrder,
    TagSummaryEntry,
} from "$lib/splice/types"
import { uid } from "uid"

export class Tab {
    id = $state(uid())
    
    // --- Query State ---
    queryState = $state({
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

    // --- Data State ---
    dataState = $state({
        sampleAssets: [] as SampleAsset[],
        tags: [] as string[],
        tag_summary: [] as TagSummaryEntry[],
        total_records: 0,
        // all_genres is SHARED, so it stays in the global scope/store, not here.
    })

    // --- Loading State ---
    loadingState = $state({
        assets: false,
        beforeFirstLoad: true,
        fetchError: null as Error | null,
    })

    // Dynamic title derived from state
    title = $derived.by(() => {
        if (this.queryState.query) return this.queryState.query;
        
        if (this.dataState.tags.length > 0) {
            return `${this.dataState.tags.length} filters`
        }
        
        return "New Tab"
    })


    // --- View State ---
    scrollPosition = $state(0)

    constructor() {
        // any initialization?
    }
}

class TabManager {
    tabs = $state<Tab[]>([])
    activeTabId = $state<string>("")

    constructor() {
        this.addTab() // Start with one tab
    }

    get activeTab() {
        return this.tabs.find(t => t.id === this.activeTabId) || this.tabs[0]
    }

    addTab() {
        const newTab = new Tab()
        this.tabs.push(newTab)
        this.activeTabId = newTab.id
        return newTab
    }

    closeTab(id: string) {
        if (this.tabs.length <= 1) return // Don't close the last tab
        
        const index = this.tabs.findIndex(t => t.id === id)
        if (index === -1) return

        this.tabs = this.tabs.filter(t => t.id !== id)
        
        // If we closed the active tab, switch to another one
        if (id === this.activeTabId) {
            // Try to go to the one before, or the one after
            const newIndex = Math.max(0, index - 1)
            this.activeTabId = this.tabs[newIndex].id
        }
    }

    switchTab(id: string) {
        if (this.tabs.find(t => t.id === id)) {
            this.activeTabId = id
        }
    }
}

export const tabManager = new TabManager()
