import { AxiosInstance, AxiosRequestConfig } from 'axios'

interface Location {
    pass: string
    host?: string
}

export interface Config {
    env: 'local' | 'test' | 'prod'
    port: number
    location: Record<string, Location>
    logger: {
        path: string
    }
}

/** by ctx.state.xxx */
export interface exState {
    user: string
    logger: string
}

/** by ctx.xxx */
export interface exCtx {
    config: Config
    axios: AxiosInstance
}

export interface RequestConfig extends AxiosRequestConfig {
    t: number
    s: number
}
