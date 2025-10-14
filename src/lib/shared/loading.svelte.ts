export const loading = $state({
    assets: false,
    waveformsCount: 0,
    samples: new Set<string>(),
    draggedSamples: new Set<string>(),
    samplesCount: 0,
    beforeFirstLoad: true,
    fetchError: null as Error | null,
    setCursor: (wait: boolean) => {
        if (wait) {
            document.body.classList.add("waiting")
        } else {
            document.body.classList.remove("waiting")
        }
    },
})
