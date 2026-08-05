import strokes from "./json/diagram_connections.json" with { type: "json" }

export default {
  strokes,
  exports: {
    "application/vnd.myscript.jiix": {
      type: "Raw Content",
      "bounding-box": {
        x: 52.1812477,
        y: 63.0291672,
        width: 104.922913,
        height: 70.5270767,
      },
      elements: [
        {
          type: "Node",
          kind: "rectangle",
          orientation: -0.0543440431,
          id: "raw-content/15",
          "bounding-box": {
            x: 52.1812477,
            y: 64.3520813,
            width: 31.6333351,
            height: 30.3104172,
          },
          items: [
            {
              type: "stroke",
              id: "stroke-638b9caf-f0-99-ab-107cb0639c",
              "full-id": "stroke-638b9caf-f0-99-ab-107cb0639c",
            },
          ],
          x: 53.3992653,
          y: 66.9809647,
          width: 26.5398712,
          height: 26.5398903,
        },
        {
          type: "Edge",
          kind: "line",
          connected: ["raw-content/15", "raw-content/29"],
          ports: [0, 1],
          id: "raw-content/23",
          "bounding-box": {
            x: 79.4333344,
            y: 77.0520782,
            width: 45.1270752,
            height: 3.32292175,
          },
          items: [
            {
              type: "stroke",
              id: "stroke-c24fd639-8d-96-e4-250cda0dcb",
              "full-id": "stroke-c24fd639-8d-96-e4-250cda0dcb",
            },
          ],
          x1: 81.233078,
          y1: 78.5170059,
          x2: 123.564758,
          y2: 78.9447784,
        },
        {
          type: "Node",
          kind: "circle",
          orientation: 0,
          id: "raw-content/29",
          "bounding-box": {
            x: 123.618744,
            y: 63.0291672,
            width: 33.4854126,
            height: 28.4583282,
          },
          items: [
            {
              type: "stroke",
              id: "stroke-6a6aec8e-5b-7e-68-cc86ec4efd",
              "full-id": "stroke-6a6aec8e-5b-7e-68-cc86ec4efd",
            },
          ],
          cx: 140.298798,
          cy: 78.0374527,
          r: 14.291851,
        },
        {
          type: "Edge",
          kind: "arc",
          connected: ["raw-content/15", "raw-content/52"],
          ports: [0, 1],
          id: "raw-content/37",
          "bounding-box": {
            x: 65.4104156,
            y: 91.8687439,
            width: 36.3958282,
            height: 40.6291656,
          },
          items: [
            {
              type: "stroke",
              id: "stroke-6edd9675-34-f2-f8-c1bd2294b3",
              "full-id": "stroke-6edd9675-34-f2-f8-c1bd2294b3",
            },
            {
              type: "stroke",
              id: "stroke-591517c7-ca-e4-06-4e669184d9",
              "full-id": "stroke-591517c7-ca-e4-06-4e669184d9",
            },
          ],
          cx: 90.2689972,
          cy: 101.55558,
          rx: 24.6002579,
          ry: 24.6002579,
          phi: 0,
          startAngle: -2.78881454,
          sweepAngle: -2.36841226,
          endDecoration: "arrow-head",
        },
        {
          type: "Node",
          kind: "rectangle",
          orientation: -0.0708801001,
          id: "raw-content/52",
          "bounding-box": {
            x: 98.21875,
            y: 105.097916,
            width: 57.2979126,
            height: 28.4583282,
          },
          items: [
            {
              type: "stroke",
              id: "stroke-e63d51eb-56-c6-72-73be015351",
              "full-id": "stroke-e63d51eb-56-c6-72-73be015351",
            },
          ],
          x: 102.251656,
          y: 110.583702,
          width: 49.0817299,
          height: 22.8506889,
        },
      ],
      id: "MainBlock",
      version: "3",
    },
  },
}
