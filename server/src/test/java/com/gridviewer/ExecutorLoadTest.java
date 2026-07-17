package com.gridviewer;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.IOException;
import java.net.Socket;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
class ExecutorLoadTest {

    @Test
    void testLoadConcurrentConnections() throws Exception {
        int connectionCount = 1000;
        List<Socket> sockets = new ArrayList<>();
        
        System.out.println("Starting ExecutorLoadTest with " + connectionCount + " concurrent connections...");

        try (ExecutorService clientExecutor = Executors.newVirtualThreadPerTaskExecutor()) {
            List<Future<Socket>> futures = new ArrayList<>();
            for (int i = 0; i < connectionCount; i++) {
                futures.add(clientExecutor.submit(() -> {
                    try {
                        return new Socket("localhost", 9090);
                    } catch (IOException e) {
                        throw new RuntimeException("Failed to connect to socket", e);
                    }
                }));
            }

            int successCount = 0;
            for (Future<Socket> future : futures) {
                try {
                    Socket socket = future.get();
                    sockets.add(socket);
                    successCount++;
                } catch (Exception e) {
                    System.err.println("Connection failed: " + e.getMessage());
                }
            }

            System.out.println("Successfully opened " + successCount + " concurrent connections to the socket listener.");
            assertEquals(connectionCount, successCount, "Should successfully establish all 1000 connections");
        } finally {
            // Clean up all opened client connections
            for (Socket socket : sockets) {
                try {
                    socket.close();
                } catch (IOException e) {
                    // Ignore close exceptions during test tear down
                }
            }
            System.out.println("Cleaned up client sockets.");
        }
    }
}
