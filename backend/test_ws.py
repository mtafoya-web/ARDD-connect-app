import asyncio
import websockets
import json

async def test_ws():
    # Replace with a valid token if possible, or just test rejection
    token = "test_token"
    uri = f"ws://127.0.0.1:8000/messages/ws/{token}"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected!")
            await websocket.send(json.dumps({"receiver_id": 1, "content": "Hello"}))
            response = await websocket.recv()
            print(f"Received: {response}")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_ws())
