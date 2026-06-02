import type { OverlayClientState } from "../client/types";
import {
  ProductionGraphicRenderer,
  selectProductionGraphicViewModel
} from "./ProductionGraphicRenderer";

export function PreviewOverlay({
  clientState,
  debug
}: {
  clientState: OverlayClientState;
  debug: boolean;
}) {
  const viewModel = selectProductionGraphicViewModel(clientState, "preview");

  return (
    <ProductionGraphicRenderer
      clientState={clientState}
      viewModel={viewModel}
      debug={debug}
    />
  );
}
