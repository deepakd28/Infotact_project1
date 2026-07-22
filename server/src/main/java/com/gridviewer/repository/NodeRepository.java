package com.gridviewer.repository;

import com.gridviewer.models.Node;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class NodeRepository {

    private final Map<Long, Node> nodes = new ConcurrentHashMap<>();

    public List<Node> findAll() {
        return new ArrayList<>(nodes.values());
    }

    public Node findById(Long id) {
        return nodes.get(id);
    }

    public Node save(Node node) {
        nodes.put(node.getId(), node);
        return node;
    }

    public void delete(Long id) {
        nodes.remove(id);
    }

    public boolean exists(Long id) {
        return nodes.containsKey(id);
    }
}
