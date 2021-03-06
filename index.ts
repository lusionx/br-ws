import * as Koa from 'koa'
import { createServer, IncomingMessage } from 'http'
import * as net from 'net'
import * as WebSocket from 'ws'
import Axios from 'axios'

import { exState, exCtx, Config, RequestConfig } from './lib'
import { rewrite } from './lib/conv'

const config = (() => {
    let path = process.env['NODE_ENV'] || 'local'
    let obj = require(`./config/config.${path}.json`)
    return obj as Config
})()

const app = new Koa<exState, exCtx>()

app.use(async (ctx, next) => {
    ctx.config = config
    ctx.axios = Axios.create({
        validateStatus: (i) => i > 0
    })
    await next()
})

const port = (function () {
    let v = process.env['APP_PORT'] || config.port
    return v ? +v : 8000
})()
console.log('listen', 'http://127.0.0.1:' + port)

interface ExtWs extends WebSocket {
    /** 上次心跳时间 */
    rate: Date
}


const wss = new WebSocket.Server({ noServer: true })
wss.on('connection', (cnn, req) => {
    console.log('wss on conn')
    if (!req.url) return cnn.terminate()
    // 这里的req将一直使用连接时状态

    cnn.on('message', async (sdata: WebSocket.Data) => {
        const cli = cnn as ExtWs
        cli.rate = new Date()

        const qconf: RequestConfig = JSON.parse(sdata.toString())
        console.log(config.location)
        if (rewrite(qconf, config)) {
            console.log('rewrite', qconf.url)
        }else {
            console.log('axios', qconf.url)
        }
        const axios = Axios.create({
            validateStatus: i => i > 0
        })

        const { data, headers, status, statusText } = await axios(qconf)
        cnn.send(JSON.stringify({ data, headers, status, statusText, t: qconf.t, s: qconf.s }))
    })
})

createServer(app.callback()).listen(port).on('upgrade', (request: IncomingMessage, socket: net.Socket, head: Buffer) => {
    wss.handleUpgrade(request, socket, head, (cli) => {
        // 验证权限
        if (!request.url) return socket.destroy()
        console.log('svc upgrade', request.url, JSON.stringify(request.headers))
        wss.emit('connection', cli, request)
    })
})

process.nextTick(function beat() {
    const end: ExtWs[] = []
    wss.clients.forEach((cnn) => {
        const cli = cnn as ExtWs
        if (!cli.rate) cli.rate = new Date()
        if (Date.now() - cli.rate.valueOf() > 3600 * 1000) {
            end.push(cli)
        }
    })
    end.forEach(cli => cli.terminate())
    setTimeout(beat, 300 * 1000)
})

process.on("unhandledRejection", (error) => {
    console.log('unhandledRejection')
    console.error(error)
})

process.on("uncaughtException", (error) => {
    console.log('uncaughtException')
    console.error(error)
})
