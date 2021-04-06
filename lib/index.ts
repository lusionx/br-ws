import { AxiosInstance, AxiosRequestConfig } from 'axios'

export interface Config {
    env: 'local' | 'test' | 'prod'
    port: number
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
