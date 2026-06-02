import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ThemeConfig } from "@mmbt/shared-types";

import type { OverlayClientState, OverlayRuntimeState } from "../client/types";
import { OverlayRouteView } from "../routes/OverlayRouteView";
import { parseOverlayRoute } from "../routes/route";

const timestamp = "2026-06-02T06:00:00.000Z";

const theme: ThemeConfig = {
  id: "default-theme",
  name: "Default Theme",
  version: "0.1.0",
  colors: {
    background: "transparent",
    primary: "#2563eb",
    secondary: "#dc2626",
    accent: "#facc15",
    blueTeam: "#2563eb",
    redTeam: "#dc2626",
    textPrimary: "#f8fafc",
    textSecondary: "#cbd5e1"
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    numberFont: "Roboto Mono"
  },
  layout: {
    safeMarginPx: 64,
    borderRadiusPx: 8,
    animationSpeedMs: 250
  },
  assets: {}
};

function createSnapshot(
  options: {
    graphicTakeState?: Partial<OverlayRuntimeState["production"]["graphicTakeState"]>;
    emergency?: Partial<OverlayRuntimeState["production"]["emergency"]>;
  } = {}
): OverlayRuntimeState {
  return {
    revision: 13,
    timestamp,
    eventPackageId: "sample-event",
    event: {
      id: "event_sample-2026",
      name: "Sample Invitational",
      shortName: "Sample",
      timezone: "Asia/Hong_Kong",
      defaultLanguage: "en",
      gameCodes: ["generic-moba"]
    },
    matches: [
      {
        id: "match_grand-final",
        eventId: "event_sample-2026",
        gameCode: "generic-moba",
        title: "Grand Final",
        format: "BO5",
        teams: {
          blue: "team_blue",
          red: "team_red"
        },
        score: {
          blue: 2,
          red: 1
        },
        currentGameNumber: 4,
        status: "LIVE",
        themeId: "default-theme",
        games: []
      }
    ],
    teams: [
      { id: "team_blue", name: "Blue Meteors", shortName: "BLU" },
      { id: "team_red", name: "Red Titans", shortName: "RED" }
    ],
    sponsors: [],
    games: [],
    rulesets: [],
    themes: [theme],
    currentMatchId: "match_grand-final",
    currentGameId: null,
    drafts: {},
    production: {
      id: "production",
      status: "GAME_LIVE",
      activeMatchId: "match_grand-final",
      activeGameNumber: 4,
      activeDraftId: null,
      graphicTakeState: {
        id: "graphic-take",
        graphicType: "SCORE_BUG",
        previewPayload: null,
        programPayload: null,
        status: "IDLE",
        updatedAt: timestamp,
        ...options.graphicTakeState
      },
      emergency: {
        active: false,
        message: null,
        ...options.emergency
      },
      overlaySafety: {
        readOnly: true,
        mutationAllowed: false
      },
      createdAt: timestamp,
      updatedAt: timestamp
    },
    adapters: [],
    adapterStatus: {},
    availableAdapterIds: ["generic-moba"],
    health: {
      status: "OK",
      serverStartedAt: timestamp,
      socketClients: [],
      loadedEventPackageId: "sample-event",
      currentProductionState: "GAME_LIVE",
      adapterStatus: {},
      assetStatus: {
        missingAssets: [],
        warnings: []
      },
      emergencyReady: true,
      lastStateUpdateAt: timestamp
    }
  };
}

function createClientState(snapshot = createSnapshot()): OverlayClientState {
  return {
    socketStatus: "connected",
    snapshot,
    health: snapshot.health,
    lastUpdatedAt: timestamp,
    socketMessage: null
  };
}

function renderPreview(state = createClientState(), search = ""): string {
  return renderToStaticMarkup(
    <OverlayRouteView route={parseOverlayRoute("/overlay/preview", search)} clientState={state} />
  );
}

describe("preview overlay", () => {
  it("renders standby when no preview payload exists", () => {
    const markup = renderPreview();

    expect(markup).toContain("Preview Standby");
    expect(markup).toContain("No preview graphic");
    expect(markup).toContain('data-canvas-size="1920x1080"');
  });

  it("renders a supported score bug preview payload when available", () => {
    const snapshot = createSnapshot({
      graphicTakeState: {
        previewPayload: {
          graphicType: "SCORE_BUG",
          matchId: "match_grand-final"
        },
        status: "PREVIEW"
      }
    });
    const markup = renderPreview(createClientState(snapshot));

    expect(markup).toContain('data-testid="preview-graphic"');
    expect(markup).toContain('data-graphic-type="SCORE_BUG"');
    expect(markup).toContain('data-testid="scorebug-overlay"');
    expect(markup).toContain("Grand Final");
    expect(markup).toContain("Game 4 of 5");
  });

  it("does not render Program payload as Preview", () => {
    const snapshot = createSnapshot({
      graphicTakeState: {
        programPayload: {
          graphicType: "SCORE_BUG",
          matchId: "match_grand-final"
        },
        previewPayload: null,
        status: "ON_PROGRAM"
      }
    });
    const markup = renderPreview(createClientState(snapshot));

    expect(markup).toContain("Preview Standby");
    expect(markup).not.toContain('data-testid="scorebug-overlay"');
  });

  it("indicates emergency active safely in debug mode", () => {
    const snapshot = createSnapshot({
      graphicTakeState: {
        previewPayload: {
          graphicType: "SCORE_BUG",
          matchId: "match_grand-final"
        },
        status: "PREVIEW"
      },
      emergency: {
        active: true,
        message: "private raw emergency reason",
        triggeredAt: timestamp
      }
    });
    const normalMarkup = renderPreview(createClientState(snapshot));
    const debugMarkup = renderPreview(createClientState(snapshot), "?debug=1");

    expect(normalMarkup).toContain('data-testid="scorebug-overlay"');
    expect(normalMarkup).not.toContain("Graphic Diagnostics");
    expect(normalMarkup).not.toContain("private raw emergency reason");

    expect(debugMarkup).toContain("Graphic Diagnostics");
    expect(debugMarkup).toContain("Emergency");
    expect(debugMarkup).toContain("active");
    expect(debugMarkup).not.toContain("private raw emergency reason");
  });

  it("hides debug-only payload details in normal mode", () => {
    const snapshot = createSnapshot({
      graphicTakeState: {
        previewPayload: {
          graphicType: "SCORE_BUG",
          matchId: "match_grand-final"
        },
        status: "PREVIEW"
      }
    });
    const markup = renderPreview(createClientState(snapshot));

    expect(markup).not.toContain("Graphic Diagnostics");
    expect(markup).not.toContain("Payload");
    expect(markup).not.toContain("Revision");
  });

  it("does not render mutation controls", () => {
    const markup = renderPreview();

    [
      "Start Draft",
      "Pause Draft",
      "Resume Draft",
      "Hover",
      "Lock",
      "Undo",
      "Reset Draft",
      "Complete Draft",
      "Preview Graphic",
      "Take to Program",
      "Clear Program",
      "Trigger Emergency",
      "Clear Emergency"
    ].forEach((controlText) => {
      expect(markup).not.toContain(controlText);
    });
  });
});
