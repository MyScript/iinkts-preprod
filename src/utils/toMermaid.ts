import {
  JIIXEdgeKind,
  JIIXElementType,
  JIIXNodeKind,
  type TJIIXEdgeElement,
  type TJIIXExport,
  type TJIIXNodeElement,
  type TJIIXTextElement,
} from "@/model/Export"
import type { TBox, TPoint } from "@/symbol"
import { computePointOnEllipse, isPointInsideBox } from "@/utils/geometry"

const MERMAID_SHAPE_BY_NODE_KIND: Record<JIIXNodeKind, [string, string]> = {
  [JIIXNodeKind.Rectangle]: ["[", "]"],
  [JIIXNodeKind.Circle]: ["((", "))"],
  [JIIXNodeKind.Ellipse]: ["((", "))"],
  [JIIXNodeKind.Rhombus]: ["{", "}"],
  [JIIXNodeKind.Parallelogram]: ["[/", "/]"],
  [JIIXNodeKind.Triangle]: ["[", "]"],
  [JIIXNodeKind.Polygon]: ["[", "]"],
}

function sanitizeMermaidId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, "_")
}

function boxCenter(box: TBox): TPoint {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

function findLabelInside(box: TBox | undefined, texts: TJIIXTextElement[]): string | undefined {
  if (!box) {
    return undefined
  }
  return texts.find((text) => text["bounding-box"] && isPointInsideBox(boxCenter(text["bounding-box"]), box))?.label
}

function nodeDeclaration(node: TJIIXNodeElement, texts: TJIIXTextElement[]): string {
  const [open, close] = MERMAID_SHAPE_BY_NODE_KIND[node.kind]
  const label = findLabelInside(node["bounding-box"], texts) ?? node.kind
  return `  ${sanitizeMermaidId(node.id)}${open}${label}${close}`
}

function edgeEndpoints(edge: TJIIXEdgeElement): [TPoint, TPoint] {
  switch (edge.kind) {
    case JIIXEdgeKind.Line:
      return [
        { x: edge.x1, y: edge.y1 },
        { x: edge.x2, y: edge.y2 },
      ]
    case JIIXEdgeKind.PolyEdge: {
      const first = edge.edges[0]
      const last = edge.edges[edge.edges.length - 1]
      return [
        { x: first.x1, y: first.y1 },
        { x: last.x2, y: last.y2 },
      ]
    }
    case JIIXEdgeKind.Arc: {
      const center = { x: edge.cx, y: edge.cy }
      return [
        computePointOnEllipse(center, edge.rx, edge.ry, edge.phi, edge.startAngle),
        computePointOnEllipse(center, edge.rx, edge.ry, edge.phi, edge.startAngle + edge.sweepAngle),
      ]
    }
  }
}

function findNodeForPoint(point: TPoint, nodes: TJIIXNodeElement[]): TJIIXNodeElement | undefined {
  return nodes.find((node) => node["bounding-box"] && isPointInsideBox(point, node["bounding-box"]))
}

function findNodeById(id: string, nodes: TJIIXNodeElement[]): TJIIXNodeElement | undefined {
  return nodes.find((node) => node.id === id)
}

/**
 * Resolves which two Nodes an Edge connects. The server fills `connected`/`ports` once a
 * diagram has more than one shape — trust it first, since it reflects the actual recognition
 * rather than a geometric guess. Falls back to matching endpoints against node bounding boxes
 * when `connected` is absent (e.g. a lone edge with nothing to connect to).
 */
function resolveEdgeNodes(
  edge: TJIIXEdgeElement,
  nodes: TJIIXNodeElement[]
): [TJIIXNodeElement, TJIIXNodeElement] | undefined {
  if (edge.connected?.length === 2) {
    const from = findNodeById(edge.connected[0], nodes)
    const to = findNodeById(edge.connected[1], nodes)
    if (from && to) {
      return [from, to]
    }
  }

  const [start, end] = edgeEndpoints(edge)
  const from = findNodeForPoint(start, nodes)
  const to = findNodeForPoint(end, nodes)
  return from && to ? [from, to] : undefined
}

function edgeDeclaration(edge: TJIIXEdgeElement, nodes: TJIIXNodeElement[]): string | undefined {
  const resolved = resolveEdgeNodes(edge, nodes)
  if (!resolved) {
    return undefined
  }
  const [from, to] = resolved
  return `  ${sanitizeMermaidId(from.id)} --> ${sanitizeMermaidId(to.id)}`
}

/**
 * @group Utilities
 * @summary Convert a JIIX diagram export into a Mermaid flowchart
 * @param jiix - JIIX export to convert
 * @returns Mermaid flowchart syntax
 */
export function jiixToMermaid(jiix: TJIIXExport): string {
  const elements = jiix.elements ?? []
  const nodes = elements.filter((element): element is TJIIXNodeElement => element.type === JIIXElementType.Node)
  const texts = elements.filter((element): element is TJIIXTextElement => element.type === JIIXElementType.Text)
  const edges = elements.filter((element): element is TJIIXEdgeElement => element.type === JIIXElementType.Edge)

  const edgeDeclarations = edges
    .map((edge) => edgeDeclaration(edge, nodes))
    .filter((line): line is string => line !== undefined)

  return ["flowchart TD", ...nodes.map((node) => nodeDeclaration(node, texts)), ...edgeDeclarations].join("\n")
}
