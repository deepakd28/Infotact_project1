package com.gridviewer.service;

import com.gridviewer.models.TelemetryEvent;
import com.gridviewer.repository.NodeRepository;
import org.springframework.stereotype.Component;

import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

@Component
public class TelemetryQueue {
    private final BlockingQueue<TelemetryEvent> queue = new LinkedBlockingQueue<>();
    private final NodeRepository nodeRepository;

    public TelemetryQueue(NodeRepository nodeRepository) {
        this.nodeRepository = nodeRepository;
    }

    public void put(TelemetryEvent event) throws InterruptedException {
        if (event != null && nodeExists(event.nodeId())) {
            queue.put(event);
        }
    }

    private boolean nodeExists(String nodeId) {
        if (nodeId == null || nodeId.equals("unknown")) {
            return false;
        }
        try {
            Long id = Long.parseLong(nodeId);
            return nodeRepository.exists(id);
        } catch (NumberFormatException e) {
            String numericOnly = nodeId.replaceAll("\\D+", "");
            if (!numericOnly.isEmpty()) {
                try {
                    Long id = Long.parseLong(numericOnly);
                    return nodeRepository.exists(id);
                } catch (NumberFormatException ex) {
                    return false;
                }
            }
            return false;
        }
    }

    public TelemetryEvent poll(long timeout, TimeUnit unit) throws InterruptedException {
        return queue.poll(timeout, unit);
    }

    public int size() {
        return queue.size();
    }

    public void clear() {
        queue.clear();
    }
}
