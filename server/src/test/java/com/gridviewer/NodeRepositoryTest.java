package com.gridviewer;

import com.gridviewer.server.model.Node;
import com.gridviewer.server.repository.NodeRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class NodeRepositoryTest {

    @Autowired
    private NodeRepository repository;

    @Test
    void savesAndRetrievesNode() {
        Node node = new Node(1L, "SOLAR", "IDLE", 12.97, 77.59);
        repository.save(node);

        Node found = repository.findById(1L);
        assertNotNull(found);
        assertEquals("SOLAR", found.getType());
        assertEquals("IDLE", found.getState());
    }

    @Test
    void deletesNode() {
        repository.save(new Node(2L, "BATTERY", "CHARGING", 12.90, 77.60));
        repository.delete(2L);

        assertFalse(repository.exists(2L));
        assertNull(repository.findById(2L));
    }
}