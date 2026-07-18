package com.gridviewer;

import com.gridviewer.models.TelemetryEvent;
import com.gridviewer.service.TelemetryQueue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.PrintWriter;
import java.net.Socket;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class TelemetryPipelineTest {

    @Autowired
    private TelemetryQueue telemetryQueue;

    @BeforeEach
    void setUp() {
        telemetryQueue.clear();
    }

    @Test
    void testTelemetryPipelineSendsAndParsesEvents() throws Exception {
        // Connect to the telemetry socket server
        try (Socket socket = new Socket("localhost", 9090);
             PrintWriter writer = new PrintWriter(socket.getOutputStream(), true)) {

            // Send standard telemetry events
            writer.println("node-101:status=ACTIVE,battery=94%");
            writer.println("node-202:status=CHARGING,battery=12%");
            // Send event with no colon (should fallback to unknown nodeId)
            writer.println("system-reboot-event");
            // Send empty line (should be ignored/not produce event)
            writer.println("");
        }

        // Wait and verify the events are parsed and queued correctly
        TelemetryEvent event1 = telemetryQueue.poll(5, TimeUnit.SECONDS);
        assertNotNull(event1, "First event should be present");
        assertEquals("node-101", event1.nodeId());
        assertEquals("status=ACTIVE,battery=94%", event1.payload());
        assertNotNull(event1.timestamp());

        TelemetryEvent event2 = telemetryQueue.poll(5, TimeUnit.SECONDS);
        assertNotNull(event2, "Second event should be present");
        assertEquals("node-202", event2.nodeId());
        assertEquals("status=CHARGING,battery=12%", event2.payload());
        assertNotNull(event2.timestamp());

        TelemetryEvent event3 = telemetryQueue.poll(5, TimeUnit.SECONDS);
        assertNotNull(event3, "Third event should be present");
        assertEquals("unknown", event3.nodeId());
        assertEquals("system-reboot-event", event3.payload());
        assertNotNull(event3.timestamp());

        // Verify no more events are queued
        TelemetryEvent emptyEvent = telemetryQueue.poll(500, TimeUnit.MILLISECONDS);
        assertNull(emptyEvent, "There should be no other events in the queue");
    }
}
