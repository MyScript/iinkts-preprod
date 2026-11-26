import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

/**
 * Layers of `src/`: a folder imports only from folders of a strictly lower layer.
 *
 * Options:
 * - `layers`: folders from the bottom layer up, one array per layer; two folders of the same layer
 *   may not import each other
 * - `only`: folders allowed fewer imports than their layer gives, `{ folder: [allowed folders] }`
 * - `typeOnly`: higher folders some folders may still name as a type, `{ target: [folders] }` —
 *   a value import is what makes the dependency real at runtime
 * - `exceptions`: crossings accepted as debt, `{ file, target }` with `file` relative to the repo.
 *   A ratchet: an exception the file no longer needs is reported too, so the list only shrinks.
 *
 * Every `src/` folder must be in `layers`, every exception file must exist: checked when the
 * config loads, so a new folder or a deleted file fails the lint at once.
 */

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const SRC_DIR = path.join(ROOT_DIR, "src")

function topFolder(file) {
  const parts = path.relative(SRC_DIR, file).split(path.sep)
  return parts.length > 1 && parts[0] !== ".." ? parts[0] : undefined
}

function targetFolder(file, spec) {
  if (spec.startsWith("@/")) return spec.slice(2).split("/")[0]
  if (spec.startsWith(".")) return topFolder(path.resolve(path.dirname(file), spec))
  return undefined
}

function isTypeOnly(node) {
  if (node.importKind === "type" || node.exportKind === "type") return true
  const specifiers = node.specifiers ?? []
  return specifiers.length > 0 && specifiers.every((s) => s.importKind === "type" || s.exportKind === "type")
}

/** Checks the options against the disk; throws, so a stale config breaks the lint at load */
export function validateLayers({ layers, exceptions = [] }) {
  const declared = layers.flat()
  const folders = fs.readdirSync(SRC_DIR, { withFileTypes: true }).filter((d) => d.isDirectory())
  const missing = folders.map((d) => d.name).filter((name) => !declared.includes(name))
  if (missing.length) throw new Error(`iink/layers: src folders without a layer: ${missing.join(", ")}`)
  const gone = exceptions.filter((e) => !fs.existsSync(path.join(ROOT_DIR, e.file)))
  if (gone.length) throw new Error(`iink/layers: exceptions on missing files: ${gone.map((e) => e.file).join(", ")}`)
}

function rankOf(layers) {
  const ranks = new Map()
  layers.forEach((folders, rank) => folders.forEach((folder) => ranks.set(folder, rank)))
  return ranks
}

function violation(options, ranks, own, target, typeOnly) {
  const only = options.only?.[own]
  if (only) return only.includes(target) ? undefined : `\`${own}\` may only depend on ${only.join(", ")}`
  if (ranks.get(target) < ranks.get(own)) return undefined
  if (typeOnly && options.typeOnly?.[target]?.includes(own)) return undefined
  const how = options.typeOnly?.[target]?.includes(own) ? " as a value (`import type` is allowed)" : ""
  return `layer: \`${own}\` must not import \`${target}\`${how}, it sits in the same or a higher layer`
}

const rule = {
  meta: {
    type: "problem",
    docs: { description: "A src folder imports only from folders of a lower layer" },
    schema: [
      {
        type: "object",
        properties: {
          layers: { type: "array", items: { type: "array", items: { type: "string" } } },
          only: { type: "object", additionalProperties: { type: "array", items: { type: "string" } } },
          typeOnly: { type: "object", additionalProperties: { type: "array", items: { type: "string" } } },
          exceptions: {
            type: "array",
            items: {
              type: "object",
              properties: { file: { type: "string" }, target: { type: "string" } },
              required: ["file", "target"],
              additionalProperties: false,
            },
          },
        },
        required: ["layers"],
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = context.options[0]
    const ranks = rankOf(options.layers)
    const file = context.filename
    const own = topFolder(file)
    if (!own) return {}
    const relative = path.relative(ROOT_DIR, file).split(path.sep).join("/")
    const exceptions = (options.exceptions ?? []).filter((e) => e.file === relative)
    const used = new Set()
    const visit = (node) => {
      if (!node.source) return
      const target = targetFolder(file, node.source.value)
      if (!target || target === own || !ranks.has(target)) return
      const message = violation(options, ranks, own, target, isTypeOnly(node))
      if (!message) return
      const exception = exceptions.find((e) => e.target === target)
      if (exception) used.add(exception)
      else context.report({ node: node.source, message })
    }
    const exit = (program) => {
      exceptions
        .filter((e) => !used.has(e))
        .forEach((e) =>
          context.report({
            node: program,
            message: `layer exception no longer needed: remove { file: "${e.file}", target: "${e.target}" }`,
          }),
        )
    }
    return {
      ImportDeclaration: visit,
      ExportNamedDeclaration: visit,
      ExportAllDeclaration: visit,
      "Program:exit": exit,
    }
  },
}

export default { rules: { layers: rule } }
