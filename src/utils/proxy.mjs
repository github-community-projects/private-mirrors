import { EnvHttpProxyAgent, setGlobalDispatcher } from 'undici'
import { ProxyAgent } from 'proxy-agent'
import http from 'http'
import https from 'https'

// set unidci global dispatcher to a proxy agent based on env variables for fetch calls
const envHttpProxyAgent = new EnvHttpProxyAgent()
setGlobalDispatcher(envHttpProxyAgent)

// set global agent for older libraries that use http and https calls
const proxyAgent = new ProxyAgent()
http.globalAgent = proxyAgent
https.globalAgent = proxyAgent
