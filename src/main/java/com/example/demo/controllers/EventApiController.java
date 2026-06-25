package com.example.demo.controllers;

import com.example.demo.models.entities.Event;
import com.example.demo.repositories.EventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
@CrossOrigin
public class EventApiController {

    private final EventRepository eventRepository;
    private final ObjectMapper plainMapper = new ObjectMapper();

    public EventApiController(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public String getAllEvents() throws Exception {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Event e : eventRepository.findAll()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", e.getId());
            m.put("title", e.getTitle());
            m.put("description", e.getDescription());
            m.put("dateTime", e.getDateTime() != null ? e.getDateTime().toString() : null);
            m.put("eventType", e.getEventType() != null ? e.getEventType().name() : null);
            m.put("genreName", e.getGenre() != null ? e.getGenre().getName() : null);
            m.put("hallName", e.getHall() != null ? e.getHall().getName() : "");
            m.put("hallAddress", e.getHall() != null ? e.getHall().getAddress() : "");
            m.put("capacity", e.getHall() != null ? e.getHall().getCapacity() : null);
            m.put("availableSeats", e.getAvailableSeats());
            m.put("imageUrl", e.getImageUrl());
            m.put("featured", false);
            result.add(m);
        }
        return plainMapper.writeValueAsString(result);
    }
}
