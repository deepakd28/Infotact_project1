package com.gridviewer.repository;

import com.gridviewer.models.Node;
import org.springframework.stereotype.Repository;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class NodeRepository {

    private final Map<String, Node> nodes = new ConcurrentHashMap<>();

    public void save(Node node) {
        nodes.put(node.getId(), node);
    }

    public Optional<Node> findById(String id) {
        return Optional.ofNullable(nodes.get(id));
    }

    public void deleteById(String id) {
        nodes.remove(id);
    }

    public boolean existsById(String id) {
        return nodes.containsKey(id);
    }
}
