import asyncio
import json
from aiohttp import web
from aiortc import RTCPeerConnection, RTCSessionDescription, MediaStreamTrack
from aiortc.contrib.media import MediaRelay, MediaBlackhole
import grpc
import data_pb2
import data_pb2_grpc
from aiohttp_cors import setup as cors_setup, ResourceOptions

relay = MediaRelay()

async def index(request):
    content = open("index.html", "r").read()
    return web.Response(content_type="text/html", text=content)

async def ice_candidate(request):
    params = await request.json()
    return web.Response(content_type="application/json", text=json.dumps({"message": "ICE"}))

async def offer(request):
    params = await request.json()
    offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])

    pc = RTCPeerConnection()
    pcs.add(pc)

    @pc.on("track")
    def on_track(track):
        if track.kind == "audio":
            pc.addTrack(relay.subscribe(track))
            
            async def send_audio():
                while True:
                    try:
                        frame = await track.recv()
                        # Отправка аудиоданных через gRPC
                        with grpc.insecure_channel('localhost:50051') as channel:
                            stub = data_pb2_grpc.DataServiceStub(channel)
                            response = stub.SendAudioData(data_pb2.AudioDataRequest(data=frame.to_ndarray().tobytes()))
                            print(f"Received from gRPC server: {response.message}")
                    except Exception as e:
                        print(f"Error sending audio data: {e}")
                        break

            asyncio.ensure_future(send_audio())

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
    
    # Настройка CORS
    cors = cors_setup(app, defaults={
        "*": ResourceOptions(
            allow_credentials=True,
            expose_headers="*",
            allow_headers="*",
            allow_methods="*"
        )
    })
    
    # Добавление маршрутов с поддержкой CORS
    cors.add(app.router.add_get("/", index))
    cors.add(app.router.add_post("/offer", offer))
    cors.add(app.router.add_post("/ice-candidate", ice_candidate))

    
    web.run_app(app, host="0.0.0.0", port=8080)