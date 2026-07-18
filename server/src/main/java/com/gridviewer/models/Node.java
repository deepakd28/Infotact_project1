package com.gridviewer.models;

public class Node {
    private String id;
    private String type;
    private double lat;
    private double lon;

    public Node() {
    }

    public Node(String id, String type, double lat, double lon) {
        this.id = id;
        this.type = type;
        this.lat = lat;
        this.lon = lon;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public double getLat() {
        return lat;
    }

    public void setLat(double lat) {
        this.lat = lat;
    }

    public double getLon() {
        return lon;
    }

    public void setLon(double lon) {
        this.lon = lon;
    }
}
