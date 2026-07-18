package com.gridviewer.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.SocketException;
import java.time.Instant;
import java.util.concurrent.ExecutorService;

import com.gridviewer.models.TelemetryEvent;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

@Component
public class TelemetrySocketListener {

    private final ExecutorService executor;
    private final TelemetryQueue telemetryQueue;
    private ServerSocket serverSocket;
    private volatile boolean running = true;

    public TelemetrySocketListener(ExecutorService virtualThreadExecutor, TelemetryQueue telemetryQueue) {
        this.executor = virtualThreadExecutor;
        this.telemetryQueue = telemetryQueue;
    }

    @PostConstruct
    public void start() {
        executor.submit(this::listen);
    }

    private void listen() {
        try {
            // Use a backlog of 2000 to cleanly handle the 1,000 connection load test
            serverSocket = new ServerSocket(9090, 2000);
            while (running) {
                Socket socket = serverSocket.accept();
                executor.submit(() -> handleConnection(socket));
            }
        } catch (SocketException e) {
            if (!running) {
                System.out.println("Telemetry socket server closed cleanly.");
            } else {
                e.printStackTrace();
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        } finally {
            cleanup();
        }
    }

    private void handleConnection(Socket socket) {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                TelemetryEvent event = parseLine(line);
                if (event != null) {
                    telemetryQueue.put(event);
                }
            }
        } catch (IOException e) {
            // Common when client disconnects or connection is closed
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            try {
                socket.close();
            } catch (IOException e) {
                // ignore
            }
        }
    }

    private TelemetryEvent parseLine(String line) {
        if (line == null || line.isBlank()) {
            return null;
        }
        int colonIdx = line.indexOf(':');
        String nodeId;
        String payload;
        if (colonIdx != -1) {
            nodeId = line.substring(0, colonIdx).trim();
            payload = line.substring(colonIdx + 1).trim();
        } else {
            nodeId = "unknown";
            payload = line.trim();
        }
        return new TelemetryEvent(nodeId, payload, Instant.now());
    }

    @PreDestroy
    public void stop() {
        running = false;
        cleanup();
    }

    private void cleanup() {
        if (serverSocket != null && !serverSocket.isClosed()) {
            try {
                serverSocket.close();
            } catch (IOException e) {
                // ignore
            }
        }
    }
}
