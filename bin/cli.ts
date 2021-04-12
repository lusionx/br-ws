
import Axios, { AxiosRequestConfig, AxiosResponse, AxiosInstance } from 'axios'
import * as WebSocket from 'ws'
import { doLimit, range } from '../lib/tool'

interface WsResponse extends AxiosResponse {
    t: number
    s: number
}

function sBodyKey(t: number, s: number) {
    return [t, s].join('.')
}

type vcall = (data: any) => void

class Provider {
    open() {
        this.ws.addEventListener('message', (evt) => {
            const d: WsResponse = JSON.parse(evt.data)
            const k = sBodyKey(d.t, d.s)
            let fn = this.mcall.get(k)
            if (fn) {
                fn(d)
                this.mcall.delete(k)
            }
        })

        return new Promise<void>(res => {
            this.ws.on('open', () => {
                console.log('ws open')
                res()
            })
        })
    }

    protected ws: WebSocket
    protected mcall: Map<string, vcall>

    constructor(wsurl: string) {
        this.ws = new WebSocket(wsurl)
        this.ws.addEventListener('close', (evt) => {
            console.log("Connection closed.");
        })
        this.ws.addEventListener('error', (evt) => {
            console.log(evt);
        })
        this.mcall = new Map<string, vcall>()
    }

    request(config: AxiosRequestConfig) {
        const { headers, url, data, params } = config
        const t = Date.now()
        const s = Math.random() * 1000 | 0
        // console.log({ t, s, url })
        this.ws.send(JSON.stringify({ t, s, headers, url, data, params }))
        const k = sBodyKey(t, s)
        return new Promise<AxiosResponse>(res => this.mcall.set(k, res))
    }

    get isReady() {
        return this.ws.readyState === this.ws.OPEN
    }

}

class Bridge {
    axios: AxiosInstance
    provider: Provider
    constructor(wsurl: string) {
        this.provider = new Provider(wsurl)
        this.axios = Axios.create()
    }

    async reqBy(config: AxiosRequestConfig) {
        if (!this.provider.isReady) {
            await this.provider.open()
        }

        if (this.provider.isReady) {
            return this.provider.request(config)
        } else {
            return this.axios(config)
        }
    }
    adapter() {
        return (config: AxiosRequestConfig) => {
            return new Promise<AxiosResponse>((res, rej) => {
                this.reqBy(config).then(response => {
                    Object.assign(response, { config })
                    var validateStatus = response.config.validateStatus;
                    if (!response.status || !validateStatus || validateStatus(response.status)) {
                        res(response)
                    } else {
                        const error = new Error('Request failed with status code ' + response.status) as any

                        error.config = config
                        if (response.status) {
                            error.code = response.status
                        }

                        error.request = response.request
                        error.response = response
                        error.isAxiosError = true
                        rej(error)
                    }
                })
            })
        }
    }
}

function sleep(ms: number) {
    return new Promise<void>(res => setTimeout(res, ms))
}

async function main() {
    const br = new Bridge('ws://br.tcem.besth5.com/ws_v1    ')
    await br.provider.open()
    await sleep(10)
    const cli = Axios.create({
        adapter: br.adapter()
    })

    const ms: number[] = []

    const act = async (i: number) => {
        const s = Date.now()
        let resp = await cli.get('http://br.tcem.besth5.com/api_v1/session', {
            params: { a: i },
            headers: {
                'x-auth-token': 'GUIDE_WZ6M53aK4WjpQqZXxnzahrNlur'
            }
        })
        if (resp.status == 200) {
            ms.push(Date.now() - s)
        }
        if (ms.length % 10 === 0) {
            console.log('ms', ms.length)
        }
    }

    const qs = range(0, 500).map(i => () => act(i))

    await doLimit(5, qs)

    const sum = ms.reduce((a, b) => a + b, 0)
    console.log('avg', sum/ ms.length)
}

process.nextTick(main)
