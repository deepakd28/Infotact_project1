package com.gridviewer.service;

import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.SocketException;
import java.util.concurrent.ExecutorService;

import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

@Component
public class TelemetrySocketListener {

    private final ExecutorService executor;
    private ServerSocket serverSocket;
    private volatile boolean running = true;

    public TelemetrySocketListener(ExecutorService virtualThreadExecutor) {
        this.executor = virtualThreadExecutor;
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
        // placeholder: just keep it open and log for now
        System.out.println("Connection accepted: " + socket.getRemoteSocketAddress());
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
