package com.gridviewer;

import com.gridviewer.models.TelemetryEvent;
import com.gridviewer.models.Node;
import com.gridviewer.repository.NodeRepository;
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

    @Autowired
    private NodeRepository nodeRepository;

    @BeforeEach
    void setUp() {
        telemetryQueue.clear();
        nodeRepository.save(new Node(101L, "SOLAR", "ACTIVE", 12.97, 77.59));
        nodeRepository.save(new Node(202L, "BATTERY", "CHARGING", 12.90, 77.60));
    }

    @Test
    void testTelemetryPipelineSendsAndParsesEvents() throws Exception {
        // Connect to the telemetry socket server
        try (Socket socket = new Socket("localhost", 9090);
             PrintWriter writer = new PrintWriter(socket.getOutputStream(), true)) {

            // Send standard telemetry events
            writer.println("node-101:status=ACTIVE,battery=94%");
            writer.println("node-202:status=CHARGING,battery=12%");
            // Send event with no colon (should fallback to unknown nodeId, which will be dropped)
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

        // Verify the unknown event is dropped, meaning there are no other events in the queue
        TelemetryEvent emptyEvent = telemetryQueue.poll(1, TimeUnit.SECONDS);
        assertNull(emptyEvent, "The unknown event should have been dropped and the queue should be empty");
    }
}
