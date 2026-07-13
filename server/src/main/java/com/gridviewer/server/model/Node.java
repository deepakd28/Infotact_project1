package com.gridviewer.server.model;

public class Node {

    private Long id;
    private String type;
    private String state;
    private double latitude;
    private double longitude;

    public Node() {
    }

    public Node(Long id, String type, String state, double latitude, double longitude) {
        this.id = id;
        this.type = type;
        this.state = state;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }
}