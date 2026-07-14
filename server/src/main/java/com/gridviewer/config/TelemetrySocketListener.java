package com.gridviewer.config;

import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.concurrent.ExecutorService;

import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
public class TelemetrySocketListener {

    private final ExecutorService executor;

    public TelemetrySocketListener(ExecutorService virtualThreadExecutor) {
        this.executor = virtualThreadExecutor;
    }

    @PostConstruct
    public void start() {
        executor.submit(this::listen);
    }

    private void listen() {
        try (ServerSocket serverSocket = new ServerSocket(9090)) {
            while (true) {
                Socket socket = serverSocket.accept();
                executor.submit(() -> handleConnection(socket));
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private void handleConnection(Socket socket) {
        // placeholder: just keep it open and log for now
        System.out.println("Connection accepted: " + socket.getRemoteSocketAddress());
    }
}
