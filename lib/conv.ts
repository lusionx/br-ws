import { AxiosRequestConfig } from 'axios'


import { Config } from './index'

/**
 * 根据配置做 转发
 * @param config
 * @param conf
 */
export function rewrite(config: AxiosRequestConfig, conf: Config) {
    if (!config.url) return false
    const url = config.url
    const headers = config.headers || {}
    const { location } = conf
    if (!location) return false

    for (const sour of Object.keys(location)) {
        if (url.startsWith(sour)) {
            const item = location[sour]
            config.url = item.pass + url.slice(sour.length)
            if (item.host) {
                headers['host'] = item.host
                config.headers = headers
            }
            return true
        }
    }
}
