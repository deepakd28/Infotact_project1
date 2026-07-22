package com.gridviewer.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.gridviewer.models.Node;
import com.gridviewer.repository.NodeRepository;

@Service
public class NodeService {

    private final NodeRepository repository;

    public NodeService(NodeRepository repository) {
        this.repository = repository;
    }

    public List<Node> getAllNodes() {
        return repository.findAll();
    }

    public Node getNode(Long id) {
        return repository.findById(id);
    }

    public Node addNode(Node node) {
        return repository.save(node);
    }

    public Node updateNode(Long id, Node node) {

        if (!repository.exists(id)) {
            return null;
        }

        node.setId(id);
        return repository.save(node);
    }

    public boolean deleteNode(Long id) {

        if (!repository.exists(id)) {
            return false;
        }

        repository.delete(id);
        return true;
    }
}
