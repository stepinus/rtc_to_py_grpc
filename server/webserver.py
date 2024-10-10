import asyncio
import json
from aiohttp import web
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaRelay
import grpc
import data_pb2
import data_pb2_grpc

relay = MediaRelay()

async def index(request):
    content = open("index.html", "r").read()
    return web.Response(content_type="text/html", text=content)

async def offer(request):
    params = await request.json()
    offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])

    pc = RTCPeerConnection()
    pcs.add(pc)

    @pc.on("datachannel")
    def on_datachannel(channel):
        @channel.on("message")
        def on_message(message):
            # Отправка данных через gRPC
            with grpc.insecure_channel('localhost:50051') as channel:
                stub = data_pb2_grpc.DataServiceStub(channel)
                response = stub.SendData(data_pb2.DataRequest(data=message))
                print(f"Received from gRPC server: {response.message}")

    await pc.setRemoteDescription(offer)
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    return web.Response(
        content_type="application/json",
        text=json.dumps({
            "sdp": pc.localDescription.sdp,
            "type": pc.localDescription.type
        })
    )

pcs = set()

async def on_shutdown(app):
    coros = [pc.close() for pc in pcs]
    await asyncio.gather(*coros)
    pcs.clear()

if __name__ == "__main__":
    app = web.Application()
    app.on_shutdown.append(on_shutdown)
    app.router.add_get("/", index)
    app.router.add_post("/offer", offer)
    web.run_app(app, host="0.0.0.0", port=8080)