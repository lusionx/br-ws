export function range(start: number, end: number, step: number = 1) {
    const ls: number[] = []
    while (start < end) {
        ls.push(start)
        start += step
    }
    return ls
}

export function doLimit<T>(limit: number, fs: (() => Promise<T>)[]) {
    const res: Promise<T>[] = new Array(fs.length)
    return new Promise<T[]>((a, b) => {
        function gogo(i: number) {
            const end = fs[i]()
            res[i] = end
            end.then(next(i)).catch(next(i))
        }
        function next(i: number) {
            return () => {
                const j = res.findIndex((r, j) => !res[j])
                if (j === -1) {
                    return Promise.all(res).then(a).catch(b)
                }
                gogo(j)
            }
        }
        range(0, Math.min(limit, fs.length)).forEach(gogo)
    })
}
