import asyncio
import logging
import math
import numpy as np
from aiohttp import web
from aiortc import RTCPeerConnection, RTCSessionDescription, MediaStreamTrack
from aiortc.contrib.media import MediaBlackhole
import aiohttp_cors
import json

logging.basicConfig(level=logging.INFO)

class AudioLevelTrack(MediaStreamTrack):
    kind = "audio"

    def __init__(self, track):
        super().__init__()
        self.track = track
        self.last_log = 0

    async def recv(self):
        frame = await self.track.recv()
        
        # Calculate audio level
        if frame and frame.format.name == 's16':
            samples = frame.to_ndarray()
            if samples.size > 0:
                rms = math.sqrt(np.mean(samples**2))
                db = 20 * math.log10(rms / 32768) if rms > 0 else -100
                
                current_time = asyncio.get_event_loop().time()
                if current_time - self.last_log > 1:  # Log every second
                    logging.info(f"Audio level: {db:.2f} dB")
                    self.last_log = current_time
            else:
                logging.warning("Received empty audio frame")
        else:
            logging.warning(f"Unexpected frame format: {frame.format.name if frame else 'None'}")
        
        return frame

async def index(request):
    return web.Response(content_type='text/html', text='WebRTC Server is running.', headers={'Access-Control-Allow-Origin': '*'})

async def offer(request):
    params = await request.json()
    offer = RTCSessionDescription(sdp=params['sdp'], type=params['type'])

    pc = RTCPeerConnection()
    recorder = MediaBlackhole()

    @pc.on("track")
    def on_track(track):
        logging.info("Track %s received", track.kind)
        if track.kind == "audio":
            audio_level_track = AudioLevelTrack(track)
            pc.addTrack(audio_level_track)
            recorder.addTrack(audio_level_track)

    @pc.on('iceconnectionstatechange')
    async def on_iceconnectionstatechange():
        logging.info('ICE connection state is %s', pc.iceConnectionState)
        if pc.iceConnectionState == 'failed':
            await pc.close()
        elif pc.iceConnectionState == 'connected':
            await recorder.start()

    await pc.setRemoteDescription(offer)
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    return web.json_response({
        'sdp': answer.sdp,
        'type': answer.type
    }, headers={'Access-Control-Allow-Origin': '*'})

app = web.Application()
app.router.add_get('/', index)
app.router.add_post('/offer', offer)

# Configure CORS
cors = aiohttp_cors.setup(app)
for route in list(app.router.routes()):
    cors.add(route, {
        "*": aiohttp_cors.ResourceOptions(
            allow_credentials=True,
            expose_headers="*",
            allow_headers="*",
        )
    })

if __name__ == '__main__':
    web.run_app(app, port=8080)
