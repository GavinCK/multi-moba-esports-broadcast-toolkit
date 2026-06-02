import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { OverlayClientState, OverlayRuntimeState } from "../client/types";
import { OverlayRouteView } from "../routes/OverlayRouteView";
import { parseOverlayRoute } from "../routes/route";

const timestamp = "2026-06-02T06:00:00.000Z";

function createSnapshot(
  emergency: Partial<OverlayRuntimeState["production"]["emergency"]> = {},
  overrides: Partial<OverlayRuntimeState> = {}
): OverlayRuntimeState {
  return {
    revision: 17,
    timestamp,
    eventPackageId: "sample-event",
    event: {
      id: "event_sample-2026",
      name: "Sample Event",
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
        format: "BO3",
        teams: {
          blue: "team_blue",
          red: "team_red"
        },
        score: {
          blue: 0,
          red: 0
        },
        currentGameNumber: 1,
        status: "READY",
        games: []
      }
    ],
    teams: [],
    sponsors: [],
    games: [],
    rulesets: [],
    themes: [],
    currentMatchId: "match_grand-final",
    currentGameId: null,
    drafts: {},
    production: {
      id: "production",
      status: "PRE_SHOW",
      activeMatchId: null,
      activeGameNumber: null,
      activeDraftId: null,
      graphicTakeState: {
        id: "graphic-take",
        graphicType: "EMERGENCY",
        previewPayload: null,
        programPayload: null,
        status: "IDLE",
        updatedAt: timestamp
      },
      emergency: {
        active: false,
        message: null,
        ...emergency
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
      currentProductionState: "PRE_SHOW",
      adapterStatus: {},
      assetStatus: {
        missingAssets: [],
        warnings: []
      },
      emergencyReady: true,
      lastStateUpdateAt: timestamp
    },
    ...overrides
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

function renderEmergency(state = createClientState(), search = ""): string {
  return renderToStaticMarkup(
    <OverlayRouteView route={parseOverlayRoute("/overlay/emergency", search)} clientState={state} />
  );
}

describe("emergency overlay", () => {
  it("renders the active emergency graphic", () => {
    const snapshot = createSnapshot({
      active: true,
      message: "Technical Pause",
      triggeredAt: timestamp
    });
    const markup = renderEmergency(createClientState(snapshot));

    expect(markup).toContain('data-testid="emergency-graphic"');
    expect(markup).toContain('data-emergency-active="true"');
    expect(markup).toContain("Technical Pause");
    expect(markup).toContain("Broadcast will resume shortly");
  });

  it("renders safe standby when inactive", () => {
    const markup = renderEmergency();

    expect(markup).toContain('data-emergency-active="false"');
    expect(markup).toContain("Emergency Standby");
    expect(markup).toContain("Transparent standby");
  });

  it("works without match, draft, team, sponsor, theme, or asset data", () => {
    const snapshot = createSnapshot(
      {
        active: true,
        message: "Broadcast Standby",
        triggeredAt: timestamp
      },
      {
        matches: [],
        teams: [],
        sponsors: [],
        games: [],
        rulesets: [],
        themes: [],
        drafts: {},
        currentMatchId: null,
        currentGameId: null
      }
    );
    const markup = renderEmergency(createClientState(snapshot));

    expect(markup).toContain("Broadcast Standby");
    expect(markup).toContain('data-emergency-active="true"');
  });

  it("uses a public-safe fallback instead of raw private emergency text", () => {
    const snapshot = createSnapshot({
      active: true,
      message: "private raw emergency reason",
      triggeredAt: timestamp
    });
    const normalMarkup = renderEmergency(createClientState(snapshot));
    const debugMarkup = renderEmergency(createClientState(snapshot), "?debug=1");

    expect(normalMarkup).toContain("Technical Pause");
    expect(normalMarkup).not.toContain("private raw emergency reason");
    expect(debugMarkup).toContain("Emergency Diagnostics");
    expect(debugMarkup).toContain("fallback");
    expect(debugMarkup).not.toContain("private raw emergency reason");
  });

  it("shows public-safe diagnostics only in debug mode", () => {
    const snapshot = createSnapshot({
      active: true,
      message: "Match paused",
      triggeredAt: timestamp
    });
    const normalMarkup = renderEmergency(createClientState(snapshot));
    const debugMarkup = renderEmergency(createClientState(snapshot), "?debug=1");

    expect(normalMarkup).not.toContain("Emergency Diagnostics");
    expect(normalMarkup).not.toContain("Revision");

    expect(debugMarkup).toContain("Emergency Diagnostics");
    expect(debugMarkup).toContain("active");
    expect(debugMarkup).toContain("17");
    expect(debugMarkup).toContain(timestamp);
  });

  it("does not render mutation controls", () => {
    const markup = renderEmergency();

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
