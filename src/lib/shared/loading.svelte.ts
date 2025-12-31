export const loading = $state({
    waveformsCount: 0,
    samples: new Set<string>(),
    draggedSamples: new Set<string>(),
    samplesCount: 0,
    setCursor: (wait: boolean) => {
        if (wait) {
            document.body.classList.add("waiting")
        } else {
            document.body.classList.remove("waiting")
        }
    },
})
