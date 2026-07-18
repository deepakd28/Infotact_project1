package com.gridviewer;

import com.gridviewer.models.Node;
import com.gridviewer.repository.NodeRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class NodeRepositoryTest {

    @Autowired
    private NodeRepository repository;

    @Test
    void savesAndRetrievesNode() {
        Node node = new Node("node-1", "SOLAR", 12.97, 77.59);
        repository.save(node);

        Optional<Node> found = repository.findById("node-1");
        assertTrue(found.isPresent());
        assertEquals("SOLAR", found.get().getType());
    }

    @Test
    void deletesNode() {
        repository.save(new Node("node-2", "BATTERY", 12.90, 77.60));
        repository.deleteById("node-2");

        assertFalse(repository.existsById("node-2"));
    }
}