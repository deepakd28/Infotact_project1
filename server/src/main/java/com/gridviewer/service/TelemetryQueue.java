package com.gridviewer.service;

import com.gridviewer.models.TelemetryEvent;
import org.springframework.stereotype.Component;

import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

@Component
public class TelemetryQueue {
    private final BlockingQueue<TelemetryEvent> queue = new LinkedBlockingQueue<>();

    public void put(TelemetryEvent event) throws InterruptedException {
        queue.put(event);
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
