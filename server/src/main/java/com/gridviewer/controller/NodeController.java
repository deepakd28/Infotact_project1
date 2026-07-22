package com.gridviewer.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gridviewer.models.Node;
import com.gridviewer.service.NodeService;

@RestController
@RequestMapping("/api/nodes")
@CrossOrigin(origins = "*")
public class NodeController {

    private final NodeService service;

    public NodeController(NodeService service) {
        this.service = service;
    }

    @GetMapping
    public List<Node> getAllNodes() {
        return service.getAllNodes();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Node> getNode(@PathVariable Long id) {

        Node node = service.getNode(id);

        if (node == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(node);
    }

    @PostMapping
    public ResponseEntity<Node> addNode(@RequestBody Node node) {
        return ResponseEntity.ok(service.addNode(node));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Node> updateNode(@PathVariable Long id,
                                           @RequestBody Node node) {

        Node updated = service.updateNode(id, node);

        if (updated == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteNode(@PathVariable Long id) {

        boolean deleted = service.deleteNode(id);

        if (!deleted) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok("Node deleted successfully");
    }
}
