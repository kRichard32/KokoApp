package com.Koko.app.rest;


import com.Koko.app.domain.Message;
import com.Koko.app.repositories.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
public class MessageResource {
    @Autowired
    private MessageService messageService;

    @ResponseStatus(value = HttpStatus.OK)

    @CrossOrigin()
    @PostMapping("/send")
    public Map<String, String> index(@RequestBody Message message) {
        HashMap<String, String> map = new HashMap<>();

        map.put("id", "");
        return map;
    }
}
