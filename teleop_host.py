{
  "nodes": [
    {
      "id": "keyboardInput-1775832433017-v6zsp3",
      "type": "keyboardInput",
      "position": {
        "x": 436.30042016806726,
        "y": 274.5014158190131
      },
      "data": {
        "inputType": "keyboard",
        "nodeName": "teleop",
        "linearSpeed": 0.5,
        "angularSpeed": 0.5,
        "keyMap": "wasd",
        "canvasId": "ca74bbf4-d24e-4b18-b791-1b534f499592",
        "currentFile": "src/nico/nico/teleop.py"
      },
      "measured": {
        "width": 464,
        "height": 487
      },
      "selected": true,
      "dragging": false
    },
    {
      "id": "rosPublisher-1775832436887-a6jly8",
      "type": "rosPublisher",
      "position": {
        "x": 1158.028711484594,
        "y": 307.5137574011538
      },
      "data": {
        "publisherName": "teleop",
        "topicName": "/teleop",
        "msgPackage": "geometry_msgs",
        "msgType": "Twist",
        "frequency": "1.0",
        "dataInput": "",
        "queueSize": "10",
        "expanded": true,
        "canvasId": "ca74bbf4-d24e-4b18-b791-1b534f499592",
        "currentFile": "src/nico/nico/teleop.py"
      },
      "measured": {
        "width": 460,
        "height": 485
      },
      "selected": false
    }
  ],
  "edges": [
    {
      "source": "keyboardInput-1775832433017-v6zsp3",
      "sourceHandle": "out",
      "target": "rosPublisher-1775832436887-a6jly8",
      "targetHandle": "data",
      "type": "smoothstep",
      "id": "xy-edge__keyboardInput-1775832433017-v6zsp3out-rosPublisher-1775832436887-a6jly8data"
    }
  ]
}