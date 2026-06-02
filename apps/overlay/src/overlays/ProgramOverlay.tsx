import type { OverlayClientState } from "../client/types";
import {
  ProductionGraphicRenderer,
  selectProductionGraphicViewModel
} from "./ProductionGraphicRenderer";

export function ProgramOverlay({
  clientState,
  debug
}: {
  clientState: OverlayClientState;
  debug: boolean;
}) {
  const viewModel = selectProductionGraphicViewModel(clientState, "program");

  return (
    <ProductionGraphicRenderer
      clientState={clientState}
      viewModel={viewModel}
      debug={debug}
    />
  );
}
