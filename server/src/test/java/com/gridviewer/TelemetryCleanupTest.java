package com.gridviewer;

import com.gridviewer.models.TelemetryEvent;
import com.gridviewer.server.model.Node;
import com.gridviewer.server.repository.NodeRepository;
import com.gridviewer.service.TelemetryQueue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.Instant;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class TelemetryCleanupTest {

    @Autowired
    private TelemetryQueue telemetryQueue;

    @Autowired
    private NodeRepository nodeRepository;

    @BeforeEach
    void setUp() {
        telemetryQueue.clear();
    }

    @Test
    void testDropEventForDeletedNode() throws Exception {
        Long nodeId = 999L;
        String nodeIdStr = "node-999";

        // 1. Save a node
        Node node = new Node(nodeId, "SOLAR", "ACTIVE", 12.0, 77.0);
        nodeRepository.save(node);

        // 2. Put event in queue (should pass through)
        TelemetryEvent event1 = new TelemetryEvent(nodeIdStr, "status=ACTIVE", Instant.now());
        telemetryQueue.put(event1);

        TelemetryEvent polled1 = telemetryQueue.poll(100, TimeUnit.MILLISECONDS);
        assertNotNull(polled1, "Telemetry event should pass through when node exists in repository");
        assertEquals(nodeIdStr, polled1.nodeId());

        // 3. Delete the node
        nodeRepository.delete(nodeId);

        // 4. Put another event in queue (should be dropped)
        TelemetryEvent event2 = new TelemetryEvent(nodeIdStr, "status=IDLE", Instant.now());
        telemetryQueue.put(event2);

        TelemetryEvent polled2 = telemetryQueue.poll(100, TimeUnit.MILLISECONDS);
        assertNull(polled2, "Telemetry event should be dropped when node does not exist in repository");
    }
}
