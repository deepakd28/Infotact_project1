package com.gridviewer.models;

import java.time.Instant;

public record TelemetryEvent(String nodeId, String payload, Instant timestamp) {
}
