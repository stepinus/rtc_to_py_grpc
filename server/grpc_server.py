import grpc
from concurrent import futures
import logging
import time

import data_pb2
import data_pb2_grpc

class DataService(data_pb2_grpc.DataServiceServicer):
    def SendData(self, request, context):
        logging.info(f"Received data: {request.data}")
        return data_pb2.DataResponse(message="Data received successfully")

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    data_pb2_grpc.add_DataServiceServicer_to_server(DataService(), server)
    server.add_insecure_port('[::]:50051')
    server.start()
    logging.info("gRPC server started on port 50051")
    try:
        while True:
            time.sleep(86400)  # One day in seconds
    except KeyboardInterrupt:
        server.stop(0)
        logging.info("gRPC server stopped")

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    serve()