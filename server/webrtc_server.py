import asyncio
import json
from aiohttp import web
from aiortc import RTCPeerConnection, RTCSessionDescription

async def websocket_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    pc = RTCPeerConnection()

    @pc.on("datachannel")
    def on_datachannel(channel):
        
        @channel.on("message")
        def on_message(message):
            print(f"Received message from data channel: {message}")

    async for msg in ws:
        if msg.type == web.WSMsgType.TEXT:
            if msg.data:
                print(f"Received message from client: {msg.data}")
                # data = json.loads(msg.data)
                # if data['type'] == 'offer':
                #     print(f"Received offer from client: {data['sdp']}")
                #     offer = RTCSessionDescription(sdp=data['sdp'], type=data['type'])
                #     await pc.setRemoteDescription(offer)
                #     answer = await pc.createAnswer()
                #     await pc.setLocalDescription(answer)
                #     await ws.send_json({
                #         'type': 'answer',
                #         'sdp': pc.localDescription.sdp
                #     })
                # elif data['type'] == 'ice_candidate':
                #     candidate = data['candidate']
                #     await pc.addIceCandidate(candidate)
        elif msg.type == web.WSMsgType.ERROR:
            print(f"WebSocket connection closed with exception {ws.exception()}")

    await pc.close()
    return ws

async def main():
    app = web.Application()
    app.router.add_get('/websocket', websocket_handler)
    return app

if __name__ == '__main__':
    web.run_app(main(), host='localhost', port=8080)
