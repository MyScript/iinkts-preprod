"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var useImageOrVideoAsset_exports = {};
__export(useImageOrVideoAsset_exports, {
  useAsset: () => useAsset,
  useImageOrVideoAsset: () => useImageOrVideoAsset
});
module.exports = __toCommonJS(useImageOrVideoAsset_exports);
var import_editor = require("@tldraw/editor");
var import_react = require("react");
function useImageOrVideoAsset({
  shapeId,
  assetId
}) {
  const editor = (0, import_editor.useEditor)();
  const isExport = !!(0, import_editor.useSvgExportContext)();
  const isReady = (0, import_editor.useDelaySvgExport)();
  const [result, setResult] = (0, import_react.useState)(() => ({
    asset: assetId ? editor.getAsset(assetId) ?? null : null,
    url: null
  }));
  const didAlreadyResolve = (0, import_react.useRef)(false);
  const previousUrl = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    if (!assetId) return;
    let isCancelled = false;
    let cancelDebounceFn;
    const cleanupEffectScheduler = (0, import_editor.react)("update state", () => {
      if (!isExport && editor.getCulledShapes().has(shapeId)) return;
      const asset = editor.getAsset(assetId);
      if (!asset) return;
      const shape = editor.getShape(shapeId);
      if (!shape) return;
      if (!asset.props.src) {
        const preview = editor.getTemporaryAssetPreview(asset.id);
        if (preview) {
          if (previousUrl.current !== preview) {
            previousUrl.current = preview;
            setResult((prev) => ({ ...prev, isPlaceholder: true, url: preview }));
            isReady();
          }
          return;
        }
      }
      const screenScale = editor.getZoomLevel() * (shape.props.w / asset.props.w);
      if (didAlreadyResolve.current) {
        resolveAssetUrlDebounced(editor, assetId, screenScale, isExport, (url) => {
          if (isCancelled) return;
          if (previousUrl.current === url) return;
          previousUrl.current = url;
          setResult(() => ({ asset, url }));
        });
        cancelDebounceFn = resolveAssetUrlDebounced.cancel;
      } else {
        resolveAssetUrl(editor, assetId, screenScale, isExport, (url) => {
          if (isCancelled) return;
          didAlreadyResolve.current = true;
          previousUrl.current = url;
          setResult(() => ({ asset, url }));
        });
      }
    });
    return () => {
      cleanupEffectScheduler();
      cancelDebounceFn?.();
      isCancelled = true;
    };
  }, [editor, assetId, isExport, isReady, shapeId]);
  return result;
}
function resolveAssetUrl(editor, assetId, screenScale, isExport, callback) {
  editor.resolveAssetUrl(assetId, {
    screenScale,
    shouldResolveToOriginal: isExport
  }).then((url) => {
    callback(url);
  });
}
const resolveAssetUrlDebounced = (0, import_editor.debounce)(resolveAssetUrl, 500);
const useAsset = useImageOrVideoAsset;
//# sourceMappingURL=useImageOrVideoAsset.js.map
