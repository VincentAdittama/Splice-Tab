import { startDrag } from "@crabnebula/tauri-plugin-drag"
import { join, appCacheDir } from "@tauri-apps/api/path"
import { exists, create, mkdir, writeFile } from "@tauri-apps/plugin-fs"
import { invoke } from "@tauri-apps/api/core"
import { saveSample } from "./files.svelte"
import { loading } from "./loading.svelte"
import type { SampleAsset, PackAsset } from "$lib/splice/types"

async function createInvisibleIcon(): Promise<string> {
    const cacheDir = await appCacheDir()
    const iconPath = await join(cacheDir, "invisible-drag-icon.png")

    if (!(await exists(iconPath))) {
        if (!(await exists(cacheDir))) {
            await mkdir(cacheDir)
        }

        const transparentPng = new Uint8Array([
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
            0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
            0x0b, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x62, 0x00, 0x02, 0x00, 0x00,
            0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
            0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
        ])

        await writeFile(iconPath, transparentPng)
    }

    return iconPath
}

export async function handleSampleDrag(event: DragEvent, sampleAsset: SampleAsset) {
    event.preventDefault()
    console.log("🫳 Dragging", sampleAsset.name)

    try {
        loading.setCursor(true)
        const path = await saveSample(sampleAsset)

        // Save pack image to samples directory and use it as drag icon
        const pack = sampleAsset.parents.items[0] as PackAsset
        let iconPath: string
        
        // Use the Rust command to process and save the drag icon
        // We pass the original image URL, and Rust will handle fetching, resizing, and caching.
        if (pack.files[0]?.url) {
            iconPath = await invoke("process_drag_icon", { imageUrl: pack.files[0].url, packId: pack.uuid });
        } else {
            iconPath = await createInvisibleIcon()
        }

        startDrag({ item: [path], icon: iconPath })
    } catch (e) {
        console.error("⚠️ Error dragging", e)
    } finally {
        loading.setCursor(false)
    }
}
